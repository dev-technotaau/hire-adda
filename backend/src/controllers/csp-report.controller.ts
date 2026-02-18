import { Request, Response } from 'express';
import logger from '../config/logger';

/**
 * Handle CSP violation reports from browsers.
 * Browsers send reports as application/csp-report or application/json.
 */
export const handleCspReport = (req: Request, res: Response): void => {
    const report = req.body?.['csp-report'] || req.body;

    if (report) {
        logger.warn('CSP Violation Report', {
            documentUri: report['document-uri'],
            violatedDirective: report['violated-directive'],
            blockedUri: report['blocked-uri'],
            sourceFile: report['source-file'],
            lineNumber: report['line-number'],
            columnNumber: report['column-number'],
        });
    }

    // Allow cross-origin CSP reports (frontend → backend are different origins in dev)
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.status(204).send();
};
