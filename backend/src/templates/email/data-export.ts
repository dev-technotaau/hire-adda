import type { EmailTemplate } from '../../types/notification-templates';
import {
  emailLayout,
  heading,
  subtitle,
  paragraph,
  greeting,
  signature,
  button,
  infoBox,
  warningBox,
  divider,
  iconCircle,
  smallText,
  BRAND,
} from './_layout';

// ===============================
// Data Export Email Templates
// ===============================

/**
 * User data (GDPR) export ready — sent with JSON attachment.
 */
export const userDataExportReady = (exportedAt: string): EmailTemplate => ({
  subject: 'Your Data Export — Talent Bridge',
  html: emailLayout(
    `
        ${iconCircle('&#128230;', '#eef2ff')}
        ${heading('Your Data Export is Ready')}
        ${subtitle('All your personal data has been compiled.')}
        ${paragraph('Hi,')}
        ${paragraph("As requested, we've compiled all your personal data from Talent Bridge. Your exported data is attached below as a JSON file.")}
        ${infoBox([
          { label: 'Export Type', value: 'Full Personal Data' },
          { label: 'Format', value: 'JSON' },
          { label: 'Exported At', value: exportedAt },
        ])}
        ${paragraph('This includes your profile information, saved jobs, notifications, consent records, devices, and activity logs.')}
        ${warningBox('If you did not request this export, please <a href="mailto:' + BRAND.supportEmail + '" style="color:#92400e;font-weight:600;">contact support</a> immediately.')}
        ${divider()}
        ${smallText('This export was generated in compliance with data portability regulations.')}
        ${signature()}
    `,
    'Your Talent Bridge data export is ready.'
  ),
  text: `Your Data Export is Ready\n\nAs requested, we've compiled all your personal data from Talent Bridge. The data is attached as a JSON file.\n\nExported at: ${exportedAt}\n\nIf you did not request this export, please contact support at ${BRAND.supportEmail}.`,
});

/**
 * Candidate export (employer-requested XLSX/CSV) ready for download.
 */
export const candidateExportReady = (
  firstName: string | null,
  candidateCount: number,
  format: string,
  downloadUrl: string,
  filename: string
): EmailTemplate => {
  const name = firstName || 'there';
  const formatLabel = format.toUpperCase();

  return {
    subject: 'Your Candidate Export is Ready',
    html: emailLayout(
      `
          ${iconCircle('&#128202;', '#ecfdf5')}
          ${heading('Your Candidate Export is Ready')}
          ${greeting(name)}
          ${paragraph(`Your export of <strong>${candidateCount} candidate${candidateCount === 1 ? '' : 's'}</strong> is now ready for download.`)}
          ${infoBox([
            { label: 'Candidates', value: candidateCount.toString() },
            { label: 'Format', value: formatLabel },
            { label: 'File', value: filename },
          ])}
          ${button(`Download ${formatLabel} File`, downloadUrl)}
          ${divider()}
          ${smallText('This link will expire in 7 days.')}
          ${signature()}
      `,
      `Your candidate export of ${candidateCount} candidates is ready.`
    ),
    text: `Hi ${name}, your export of ${candidateCount} candidate(s) is ready. Download the ${formatLabel} file: ${downloadUrl}\n\nThis link expires in 7 days. File: ${filename}`,
  };
};
