import { prisma } from '../config/prisma';
import { Role, JobStatus } from '@prisma/client';

class ReportService {
  /**
   * Generate users report data (structured for Excel export)
   */
  async generateUsersReport(filters?: { role?: Role; startDate?: string; endDate?: string }) {
    const where: any = {};
    if (filters?.role) where.role = filters.role;
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        isEmailVerified: true,
        isMobileVerified: true,
        isActive: true,
        isSuspended: true,
        mobileNumber: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Return structured data that can be converted to Excel/CSV
    const headers = [
      'ID',
      'Email',
      'First Name',
      'Last Name',
      'Role',
      'Email Verified',
      'Mobile',
      'Mobile Verified',
      'Active',
      'Suspended',
      'Created At',
      'Last Login',
    ];
    const rows = users.map((u) => [
      u.id,
      u.email,
      u.firstName || '',
      u.lastName || '',
      u.role,
      u.isEmailVerified ? 'Yes' : 'No',
      u.mobileNumber || '',
      u.isMobileVerified ? 'Yes' : 'No',
      u.isActive ? 'Yes' : 'No',
      u.isSuspended ? 'Yes' : 'No',
      u.createdAt.toISOString(),
      u.lastLoginAt?.toISOString() || 'Never',
    ]);

    return { headers, rows, totalCount: users.length };
  }

  /**
   * Generate jobs report data
   */
  async generateJobsReport(filters?: { status?: JobStatus; startDate?: string; endDate?: string }) {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const jobs = await prisma.jobPost.findMany({
      where,
      include: {
        company: { select: { companyName: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'ID',
      'Title',
      'Company',
      'Location',
      'Type',
      'Status',
      'Salary Range',
      'Experience',
      'Applications',
      'Views',
      'Created At',
      'Expires At',
    ];
    const rows = jobs.map((j) => [
      j.id,
      j.title,
      j.company.companyName,
      j.location,
      j.type,
      j.status,
      `${Number(j.salaryMin || 0)} - ${Number(j.salaryMax || 0)} ${j.currency}`,
      `${j.experienceMin} - ${j.experienceMax || 'Any'} yrs`,
      j._count.applications,
      j.views,
      j.createdAt.toISOString(),
      j.expiresAt?.toISOString() || 'None',
    ]);

    return { headers, rows, totalCount: jobs.length };
  }

  /**
   * Generate analytics summary report
   */
  async generateAnalyticsSummary() {
    const [
      totalUsers,
      totalCandidates,
      totalEmployers,
      totalJobs,
      activeJobs,
      totalApplications,
      verifiedEmployers,
    ] = await prisma.$transaction([
      prisma.user.count(),
      prisma.user.count({ where: { role: Role.CANDIDATE } }),
      prisma.user.count({ where: { role: Role.EMPLOYER } }),
      prisma.jobPost.count(),
      prisma.jobPost.count({ where: { status: JobStatus.OPEN } }),
      prisma.jobApplication.count(),
      prisma.companyProfile.count({ where: { isVerified: true } }),
    ]);

    return {
      summary: {
        totalUsers,
        totalCandidates,
        totalEmployers,
        totalJobs,
        activeJobs,
        totalApplications,
        verifiedEmployers,
      },
      generatedAt: new Date().toISOString(),
    };
  }
  /**
   * Export users report as Excel
   */
  async exportUsersExcel(filters?: {
    role?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Buffer> {
    const ExcelJS = await import('exceljs');
    const data = await this.generateUsersReport(filters as any);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Users Report');

    // Header row with styling
    sheet.addRow(data.headers);
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

    // Data rows
    data.rows.forEach((row) => sheet.addRow(row));

    // Auto-width columns
    sheet.columns.forEach((col) => {
      let maxLen = 10;
      col.eachCell?.({ includeEmpty: true }, (cell) => {
        const len = cell.value ? String(cell.value).length : 0;
        if (len > maxLen) maxLen = Math.min(len, 50);
      });
      col.width = maxLen + 2;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Export jobs report as Excel
   */
  async exportJobsExcel(filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Buffer> {
    const ExcelJS = await import('exceljs');
    const data = await this.generateJobsReport(filters as any);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Jobs Report');

    sheet.addRow(data.headers);
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

    data.rows.forEach((row) => sheet.addRow(row));

    sheet.columns.forEach((col) => {
      let maxLen = 10;
      col.eachCell?.({ includeEmpty: true }, (cell) => {
        const len = cell.value ? String(cell.value).length : 0;
        if (len > maxLen) maxLen = Math.min(len, 50);
      });
      col.width = maxLen + 2;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Export analytics summary as PDF
   */
  async exportAnalyticsPdf(): Promise<Buffer> {
    const PDFDocument = (await import('pdfkit')).default;
    const summary = await this.generateAnalyticsSummary();

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Title
      doc.fontSize(20).text('Talent Bridge - Analytics Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Generated: ${summary.generatedAt}`, { align: 'center' });
      doc.moveDown(2);

      // Summary stats
      doc.fontSize(14).text('Platform Summary', { underline: true });
      doc.moveDown();
      doc.fontSize(11);

      const s = summary.summary;
      const stats = [
        ['Total Users', s.totalUsers],
        ['Candidates', s.totalCandidates],
        ['Employers', s.totalEmployers],
        ['Verified Employers', s.verifiedEmployers],
        ['Total Jobs', s.totalJobs],
        ['Active Jobs', s.activeJobs],
        ['Total Applications', s.totalApplications],
      ];

      stats.forEach(([label, value]) => {
        doc.text(`${label}: ${value}`, { continued: false });
      });

      doc.end();
    });
  }
}

export const reportService = new ReportService();
