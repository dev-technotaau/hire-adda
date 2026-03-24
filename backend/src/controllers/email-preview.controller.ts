import type { Request, Response, NextFunction } from 'express';

// Registry of all available email templates with sample data generators
const TEMPLATE_REGISTRY: Record<
  string,
  {
    module: string;
    export: string;
    sampleArgs: () => unknown[];
    description: string;
  }
> = {
  // Auth templates
  'auth.welcome': {
    module: '../templates/email/auth',
    export: 'welcomeEmail',
    sampleArgs: () => ['John Doe'],
    description: 'Welcome email sent after registration',
  },
  'auth.verifyEmail': {
    module: '../templates/email/auth',
    export: 'verifyEmail',
    sampleArgs: () => ['482915'],
    description: 'Email verification OTP code',
  },
  'auth.passwordReset': {
    module: '../templates/email/auth',
    export: 'passwordReset',
    sampleArgs: () => ['https://hireadda.in/auth/reset-password?token=abc123def456'],
    description: 'Password reset link email',
  },
  'auth.loginAlert': {
    module: '../templates/email/auth',
    export: 'loginAlert',
    sampleArgs: () => [
      'February 16, 2026 at 10:30 AM IST',
      '203.0.113.42',
      'Chrome 120 on Windows 11',
    ],
    description: 'New login security alert',
  },
  'auth.accountDeactivated': {
    module: '../templates/email/auth',
    export: 'accountDeactivated',
    sampleArgs: () => ['John Doe'],
    description: 'Account deactivation notification',
  },
  'auth.accountSuspended': {
    module: '../templates/email/auth',
    export: 'accountSuspended',
    sampleArgs: () => ['John Doe', 'Violation of community guidelines'],
    description: 'Account suspension notification',
  },
  'auth.accountReactivated': {
    module: '../templates/email/auth',
    export: 'accountReactivated',
    sampleArgs: () => ['John Doe'],
    description: 'Account reactivation notification',
  },
  'auth.passwordResetOtp': {
    module: '../templates/email/auth',
    export: 'passwordResetOtp',
    sampleArgs: () => ['847293'],
    description: 'Password reset OTP code',
  },
  'auth.changePasswordOtp': {
    module: '../templates/email/auth',
    export: 'changePasswordOtp',
    sampleArgs: () => ['531076'],
    description: 'Change password confirmation OTP code',
  },

  // Job templates
  'job.applicationReceived': {
    module: '../templates/email/job',
    export: 'jobApplicationReceived',
    sampleArgs: () => ['Jane Smith', 'Senior React Developer', 'TechCorp Solutions'],
    description: 'Application received confirmation (to candidate)',
  },
  'job.newApplicationForEmployer': {
    module: '../templates/email/job',
    export: 'newApplicationForEmployer',
    sampleArgs: () => [
      'Mike Johnson',
      'Jane Smith',
      'Senior React Developer',
      'https://hireadda.in/employer/applications/abc123',
    ],
    description: 'New application notification (to employer)',
  },
  'job.interviewScheduled': {
    module: '../templates/email/job',
    export: 'interviewScheduled',
    sampleArgs: () => [
      'Jane Smith',
      'Senior React Developer',
      'March 5, 2026 at 2:00 PM IST',
      'https://meet.google.com/abc-defg-hij',
    ],
    description: 'Interview scheduling notification',
  },
  'job.offerReceived': {
    module: '../templates/email/job',
    export: 'jobOfferReceived',
    sampleArgs: () => [
      'Jane Smith',
      'Senior React Developer',
      'TechCorp Solutions',
      'https://hireadda.in/candidate/offers/abc123',
    ],
    description: 'Job offer notification',
  },
  'job.rejection': {
    module: '../templates/email/job',
    export: 'jobRejection',
    sampleArgs: () => ['Jane Smith', 'Senior React Developer', 'TechCorp Solutions'],
    description: 'Professional rejection email',
  },
  'job.statusUpdate': {
    module: '../templates/email/job',
    export: 'applicationStatusUpdate',
    sampleArgs: () => ['Jane Smith', 'Senior React Developer', 'TechCorp Solutions', 'Shortlisted'],
    description: 'Application status update notification',
  },
  'job.alert': {
    module: '../templates/email/job',
    export: 'jobAlert',
    sampleArgs: () => [
      'Jane Smith',
      [
        {
          title: 'Senior React Developer',
          company: 'TechCorp Solutions',
          location: 'Mumbai, India',
          link: 'https://hireadda.in/jobs/1',
        },
        {
          title: 'Full Stack Engineer',
          company: 'InnovateTech',
          location: 'Bangalore, India',
          link: 'https://hireadda.in/jobs/2',
        },
        {
          title: 'Frontend Architect',
          company: 'DigitalFirst',
          location: 'Remote',
          link: 'https://hireadda.in/jobs/3',
        },
      ],
    ],
    description: 'Job alert with matching recommendations',
  },

  // Onboarding templates
  'onboarding.profileReminder': {
    module: '../templates/email/onboarding',
    export: 'profileCompletionReminder',
    sampleArgs: () => ['John', 65],
    description: 'Profile completion reminder with progress bar',
  },
  'onboarding.documentApproved': {
    module: '../templates/email/onboarding',
    export: 'documentVerificationStatus',
    sampleArgs: () => ['Government ID (Aadhaar)', 'approved'],
    description: 'Document approved notification',
  },
  'onboarding.documentRejected': {
    module: '../templates/email/onboarding',
    export: 'documentVerificationStatus',
    sampleArgs: () => [
      'Government ID (Aadhaar)',
      'rejected',
      'The document image is blurry and the text is not legible.',
    ],
    description: 'Document rejected notification with reason',
  },
  'onboarding.employerWelcome': {
    module: '../templates/email/onboarding',
    export: 'onboardingWelcomeEmployer',
    sampleArgs: () => ['Mike Johnson', 'TechCorp Solutions'],
    description: 'Employer onboarding welcome email',
  },

  // Security templates
  'security.2faEnabled': {
    module: '../templates/email/security',
    export: 'twoFactorEnabled',
    sampleArgs: () => ['Authenticator App (TOTP)'],
    description: '2FA enabled confirmation',
  },
  'security.2faDisabled': {
    module: '../templates/email/security',
    export: 'twoFactorDisabled',
    sampleArgs: () => ['Authenticator App (TOTP)'],
    description: '2FA disabled warning',
  },
  'security.passwordChanged': {
    module: '../templates/email/security',
    export: 'passwordChanged',
    sampleArgs: () => ['February 16, 2026 at 3:45 PM IST'],
    description: 'Password change confirmation',
  },
  'security.emailChanged': {
    module: '../templates/email/security',
    export: 'emailChanged',
    sampleArgs: () => ['John Doe', 'john.new@example.com'],
    description: 'Email address change notification',
  },
  'security.accountLocked': {
    module: '../templates/email/security',
    export: 'accountLockedOut',
    sampleArgs: () => ['John Doe', 'February 16, 2026 at 4:15 PM IST'],
    description: 'Account locked after failed sign-in attempts',
  },
  'security.sessionsRevoked': {
    module: '../templates/email/security',
    export: 'sessionRevokedAll',
    sampleArgs: () => ['John Doe'],
    description: 'All sessions revoked notification',
  },

  // Onboarding — verification submitted
  'onboarding.verificationSubmitted': {
    module: '../templates/email/onboarding',
    export: 'verificationSubmitted',
    sampleArgs: () => ['Jane Smith', 'Government ID'],
    description: 'Verification request submitted notification',
  },

  // Job — application withdrawn
  'job.applicationWithdrawn': {
    module: '../templates/email/job',
    export: 'applicationWithdrawn',
    sampleArgs: () => ['Mike Johnson', 'Jane Smith', 'Senior React Developer'],
    description: 'Application withdrawn notification (to employer)',
  },

  // Ticket templates
  'ticket.confirmation': {
    module: '../templates/email/ticket',
    export: 'ticketConfirmation',
    sampleArgs: () => ['TKT-20260215-001', 'Cannot access my profile settings', 'candidate'],
    description: 'Ticket confirmation sent to user',
  },
  'ticket.newAdmin': {
    module: '../templates/email/ticket',
    export: 'ticketNewAdmin',
    sampleArgs: () => [
      'TKT-20260215-001',
      'Cannot access my profile settings',
      'Jane Smith',
      ' (Candidate)',
      'abc-123-def',
    ],
    description: 'New ticket notification to admin',
  },
  'ticket.replyAdmin': {
    module: '../templates/email/ticket',
    export: 'ticketReplyAdmin',
    sampleArgs: () => [
      'TKT-20260215-001',
      'Cannot access my profile settings',
      'Jane Smith',
      'I tried clearing my cache and it still does not work. Can you please look into this?',
      'abc-123-def',
    ],
    description: 'Ticket reply notification to admin',
  },
  'ticket.replyUser': {
    module: '../templates/email/ticket',
    export: 'ticketReplyUser',
    sampleArgs: () => [
      'TKT-20260215-001',
      'Cannot access my profile settings',
      'Thank you for reaching out. We have identified the issue and are working on a fix. Please try again in 30 minutes.',
      'candidate',
      'abc-123-def',
    ],
    description: 'Ticket reply notification to registered user',
  },
  'ticket.replyGuest': {
    module: '../templates/email/ticket',
    export: 'ticketReplyGuest',
    sampleArgs: () => [
      'TKT-20260215-001',
      'Question about job posting',
      'Thank you for your inquiry. The position is still open and accepting applications.',
    ],
    description: 'Ticket reply notification to guest user',
  },
  'ticket.statusChange': {
    module: '../templates/email/ticket',
    export: 'ticketStatusChange',
    sampleArgs: () => [
      'TKT-20260215-001',
      'Cannot access my profile settings',
      'resolved',
      'candidate',
      'abc-123-def',
      ' Please rate your experience.',
    ],
    description: 'Ticket status change notification',
  },
  'ticket.escalation': {
    module: '../templates/email/ticket',
    export: 'ticketEscalation',
    sampleArgs: () => ['TKT-20260215-001', 'Cannot access my profile settings', 'abc-123-def'],
    description: 'Ticket escalation — user rated Not Satisfied',
  },

  // Data export templates
  'export.userData': {
    module: '../templates/email/data-export',
    export: 'userDataExportReady',
    sampleArgs: () => ['February 16, 2026 at 3:00 PM IST'],
    description: 'User data (GDPR) export ready notification',
  },
  'export.candidates': {
    module: '../templates/email/data-export',
    export: 'candidateExportReady',
    sampleArgs: () => [
      'Mike',
      25,
      'xlsx',
      'https://example.com/download/candidates.xlsx',
      'candidates-1708100000.xlsx',
    ],
    description: 'Candidate export ready for download',
  },
  'export.resumes': {
    module: '../templates/email/data-export',
    export: 'resumeExportReady',
    sampleArgs: () => [
      'Mike',
      42,
      5,
      'https://example.com/download/resumes.zip',
      'resumes-1708100000.zip',
    ],
    description: 'Resume export (ZIP) ready for download',
  },

  // Weekly digest
  'digest.weekly': {
    module: '../templates/email/weekly-digest',
    export: 'weeklyHiringDigest',
    sampleArgs: () => [
      'Mike Johnson',
      'TechCorp Solutions',
      { newApplications: 12, activeJobs: 5, interviewsScheduled: 3, hires: 1 },
    ],
    description: 'Weekly hiring digest for employers',
  },

  // Contact form
  'contact.formSubmission': {
    module: '../templates/email/contact',
    export: 'contactFormSubmission',
    sampleArgs: () => [
      'Priya Sharma',
      'priya@example.com',
      'Inquiry about enterprise plan',
      'Hello, I am interested in your enterprise hiring plan. Could you share pricing details and schedule a demo?',
      'msg-abc-123',
    ],
    description: 'Contact form submission notification to support',
  },
};

/**
 * GET /api/v1/admin/email-templates
 */
export const listTemplates = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const templates = Object.entries(TEMPLATE_REGISTRY).map(([key, config]) => ({
      key,
      description: config.description,
    }));
    res.status(200).json({ status: 'success', data: templates });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/admin/email-templates/preview
 */
export const previewTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { templateName } = req.body;
    const config = TEMPLATE_REGISTRY[templateName];

    if (!config) {
      res.status(404).json({
        status: 'error',
        message: `Template '${templateName}' not found`,
      });
      return;
    }

    const mod = await import(config.module);
    const templateFn = mod[config.export];

    if (!templateFn || typeof templateFn !== 'function') {
      res.status(404).json({
        status: 'error',
        message: `Template function '${config.export}' not found in module`,
      });
      return;
    }

    const args = config.sampleArgs();
    const result = templateFn(...args);

    res.status(200).json({
      status: 'success',
      data: {
        subject: result.subject,
        html: result.html,
        text: result.text,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/admin/email-templates/test
 */
export const sendTestEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { templateName, toEmail } = req.body;
    const config = TEMPLATE_REGISTRY[templateName];

    if (!config) {
      res.status(404).json({
        status: 'error',
        message: `Template '${templateName}' not found`,
      });
      return;
    }

    const mod = await import(config.module);
    const templateFn = mod[config.export];
    const args = config.sampleArgs();
    const result = templateFn(...args);

    const { emailQueue } = await import('../jobs/email.queue');
    await emailQueue.add('send-test-email', {
      to: toEmail,
      subject: `[TEST] ${result.subject}`,
      html: result.html,
      text: result.text,
    });

    res.status(200).json({
      status: 'success',
      message: `Test email queued for ${toEmail}`,
    });
  } catch (error) {
    next(error);
  }
};
