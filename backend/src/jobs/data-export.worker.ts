import { Worker, Job } from 'bullmq';
import { createBullMQConnection } from '../config/redis';
import logger from '../config/logger';
import { collectUserData } from '../services/data-export.service';
import { emailQueue } from './email.queue';
import { DATA_EXPORT_QUEUE_NAME } from './data-export.queue';
import { prisma } from '../config/prisma';

interface DataExportJob {
    userId: string;
    email?: string;
    exportType: 'USER_DATA' | 'CANDIDATE_EXPORT';
    format?: 'csv' | 'xlsx' | 'json';
    candidateIds?: string[];
}

const worker = new Worker<DataExportJob>(
    DATA_EXPORT_QUEUE_NAME,
    async (job: Job<DataExportJob>) => {
        const TIMEOUT_MS = 120_000;
        const timeoutId = setTimeout(() => { /* safety net */ }, TIMEOUT_MS);
        try {
            const { userId, email, exportType, format, candidateIds } = job.data;
            logger.info(`Processing ${exportType} export for user ${userId}`);

            const processExport = async () => {
                switch (exportType) {
                    case 'USER_DATA': {
                        // Original GDPR-style user data export
                        const data = await collectUserData(userId);
                        const jsonStr = JSON.stringify(data, null, 2);

                        await emailQueue.add('send-email', {
                            to: email!,
                            subject: 'Your Data Export - Talent Bridge',
                            html: `
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                    <h2>Your Data Export is Ready</h2>
                                    <p>Hi,</p>
                                    <p>As requested, we've compiled all your personal data from Talent Bridge.</p>
                                    <p>Your exported data is attached below as a JSON file. This includes your profile information, saved jobs, notifications, consent records, devices, and activity logs.</p>
                                    <p>This data was exported on <strong>${data.exportedAt}</strong>.</p>
                                    <p>If you did not request this export, please contact us immediately.</p>
                                </div>
                            `,
                            attachments: [
                                {
                                    filename: `talent-bridge-data-export-${new Date().toISOString().split('T')[0]}.json`,
                                    content: jsonStr,
                                    contentType: 'application/json',
                                },
                            ],
                        });

                        logger.info(`User data export completed and emailed for user ${userId}`);
                        return { success: true };
                    }

                    case 'CANDIDATE_EXPORT': {
                        if (!candidateIds || candidateIds.length === 0) {
                            throw new Error('candidateIds required for CANDIDATE_EXPORT');
                        }

                        // Fetch candidate profiles from database
                        const candidates = await prisma.candidateProfile.findMany({
                            where: { userId: { in: candidateIds } },
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        firstName: true,
                                        lastName: true,
                                        email: true,
                                        mobileNumber: true,
                                        lastActiveAt: true,
                                    },
                                },
                            },
                        });

                        // Generate Excel/CSV file using ExcelJS
                        const ExcelJS = (await import('exceljs')).default;
                        const workbook = new ExcelJS.Workbook();
                        const sheet = workbook.addWorksheet('Candidates');

                        // Define columns
                        sheet.columns = [
                            { header: 'Name', key: 'name', width: 25 },
                            { header: 'Email', key: 'email', width: 30 },
                            { header: 'Phone', key: 'phone', width: 15 },
                            { header: 'Location', key: 'location', width: 20 },
                            { header: 'Experience (yrs)', key: 'experience', width: 15 },
                            { header: 'Current Company', key: 'company', width: 25 },
                            { header: 'Current Role', key: 'role', width: 25 },
                            { header: 'Skills', key: 'skills', width: 50 },
                            { header: 'Expected Salary Min', key: 'salaryMin', width: 18 },
                            { header: 'Expected Salary Max', key: 'salaryMax', width: 18 },
                            { header: 'Notice Period', key: 'notice', width: 15 },
                            { header: 'Last Active', key: 'lastActive', width: 20 },
                        ];

                        // Style header row
                        sheet.getRow(1).font = { bold: true };
                        sheet.getRow(1).fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFE0E0E0' },
                        };

                        // Add data rows
                        for (const c of candidates) {
                            sheet.addRow({
                                name: `${c.user?.firstName || ''} ${c.user?.lastName || ''}`.trim() || '-',
                                email: c.user?.email || '-',
                                phone: c.phone || c.user?.mobileNumber || '-',
                                location: c.currentLocation || '-',
                                experience: c.experienceYears || 0,
                                company: c.currentCompany || '-',
                                role: c.currentRole || '-',
                                skills: (c.skills as string[] || []).join(', ') || '-',
                                salaryMin: c.expectedSalaryMin ? `${c.salaryCurrency} ${Number(c.expectedSalaryMin).toLocaleString()}` : '-',
                                salaryMax: c.expectedSalaryMax ? `${c.salaryCurrency} ${Number(c.expectedSalaryMax).toLocaleString()}` : '-',
                                notice: c.noticePeriod || '-',
                                lastActive: c.user?.lastActiveAt ? new Date(c.user.lastActiveAt).toLocaleDateString() : '-',
                            });
                        }

                        // Generate buffer
                        const buffer = format === 'csv'
                            ? await workbook.csv.writeBuffer()
                            : await workbook.xlsx.writeBuffer();

                        const filename = `candidates-${Date.now()}.${format === 'csv' ? 'csv' : 'xlsx'}`;
                        const contentType = format === 'csv'
                            ? 'text/csv'
                            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

                        // Upload to R2 storage
                        const { uploadFileToR2 } = await import('../services/storage.service');
                        const { url } = await uploadFileToR2(
                            Buffer.from(buffer),
                            filename,
                            'exports',
                            contentType
                        );

                        // Get user email for notification
                        const user = await prisma.user.findUnique({
                            where: { id: userId },
                            select: { email: true, firstName: true },
                        });

                        if (!user?.email) {
                            throw new Error('User email not found');
                        }

                        // Send notification email with download link
                        await emailQueue.add('send-email', {
                            to: user.email,
                            subject: 'Your Candidate Export is Ready',
                            html: `
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                    <h2>Your Candidate Export is Ready</h2>
                                    <p>Hi${user.firstName ? ` ${user.firstName}` : ''},</p>
                                    <p>Your export of <strong>${candidates.length} candidate(s)</strong> is now ready for download.</p>
                                    <p style="margin: 30px 0;">
                                        <a href="${url}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                                            Download ${(format || 'xlsx').toUpperCase()} File
                                        </a>
                                    </p>
                                    <p style="color: #666; font-size: 12px;">
                                        This link will expire in 7 days. File name: ${filename}
                                    </p>
                                </div>
                            `,
                        });

                        logger.info(`Candidate export completed for user ${userId}: ${candidates.length} candidates, format: ${format}`);
                        return { url, filename, count: candidates.length };
                    }

                    default:
                        throw new Error(`Unknown export type: ${exportType}`);
                }
            };

            await Promise.race([
                processExport(),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('Data export worker timeout after 120s')), TIMEOUT_MS)
                ),
            ]);
        } finally {
            clearTimeout(timeoutId);
        }
    },
    {
        connection: createBullMQConnection(),
        concurrency: 2,
        lockDuration: 120000,
        limiter: { max: 5, duration: 60000 },
    },
);

worker.on('completed', (job) => {
    logger.info(`Data export job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
    logger.error(`Data export job ${job?.id} failed:`, err);
});

export { worker as dataExportWorker };
