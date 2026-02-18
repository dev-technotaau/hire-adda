import puppeteer from 'puppeteer';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import logger from '../config/logger';

export interface ResumeData {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    portfolio?: string;
    summary?: string;
    experience?: Array<{
        title: string;
        company: string;
        startDate: string;
        endDate: string;
        description: string;
        highlights?: string[];
    }>;
    education?: Array<{
        institution: string;
        degree: string;
        year: string;
    }>;
    skills?: string[];
}

export class ResumeGeneratorService {
    private static instance: ResumeGeneratorService;
    private readonly templatePath = path.join(__dirname, '../templates/resume/default.hbs');

    private constructor() { }

    public static getInstance(): ResumeGeneratorService {
        if (!ResumeGeneratorService.instance) {
            ResumeGeneratorService.instance = new ResumeGeneratorService();
        }
        return ResumeGeneratorService.instance;
    }

    /**
     * Generates a PDF resume from the provided data
     * @param data Candidate profile data
     * @returns Buffer containing the PDF
     */
    public async generateResume(data: ResumeData): Promise<Buffer> {
        try {
            // 1. Read and compile the template
            const templateHtml = fs.readFileSync(this.templatePath, 'utf8');
            const template = handlebars.compile(templateHtml);
            const htmlContent = template(data);

            // 2. Launch Puppeteer
            const browser = await puppeteer.launch({
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                headless: true,
            });

            const page = await browser.newPage();

            // 3. Set content and wait for network idle
            await page.setContent(htmlContent, {
                waitUntil: 'networkidle0',
            });

            // 4. Generate PDF
            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '20px',
                    right: '20px',
                    bottom: '20px',
                    left: '20px',
                },
            });

            await browser.close();

            return Buffer.from(pdfBuffer);
        } catch (error) {
            logger.error('Error generating resume PDF:', error);
            throw new Error('Failed to generate resume PDF');
        }
    }
}

export const resumeGenerator = ResumeGeneratorService.getInstance();
