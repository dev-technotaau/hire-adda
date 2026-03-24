import type { SmsTemplate } from '../../types/notification-templates';

// ===============================
// Authentication
// ===============================

export const otpSms = (otp: string): SmsTemplate => ({
  text: `[Hire Adda] Your verification code is ${otp}. Valid for 10 minutes. Never share this code with anyone.`,
});

export const welcomeSms = (name: string): SmsTemplate => ({
  text: `Welcome to Hire Adda, ${name}! Your account is ready. Complete your profile to start getting matched with opportunities.`,
});

export const passwordResetSms = (otp: string): SmsTemplate => ({
  text: `[Hire Adda] Your password reset code is ${otp}. Valid for 1 hour. If you didn't request this, ignore this message.`,
});

// ===============================
// Security
// ===============================

export const loginAlertSms = (time: string): SmsTemplate => ({
  text: `[Hire Adda] New sign-in detected at ${time}. If this wasn't you, secure your account immediately.`,
});

export const securityAlertSms = (action: string): SmsTemplate => ({
  text: `[Hire Adda] Security alert: ${action} on your account. If unauthorized, contact support immediately.`,
});

// ===============================
// Jobs & Applications
// ===============================

export const interviewReminderSms = (time: string, link: string): SmsTemplate => ({
  text: `[Hire Adda] Reminder: Your interview is scheduled for ${time}. Join here: ${link} — Please be ready 5 min early.`,
});

export const applicationStatusSms = (status: string, company: string): SmsTemplate => ({
  text: `[Hire Adda] Your application at ${company} has been updated to: ${status}. Open the app for details.`,
});

export const jobOfferSms = (company: string, link: string): SmsTemplate => ({
  text: `[Hire Adda] Congratulations! You've received a job offer from ${company}. View details: ${link}`,
});

export const profileViewedSms = (company: string): SmsTemplate => ({
  text: `[Hire Adda] A recruiter at ${company} viewed your profile. Keep your profile updated to stand out!`,
});

export const jobAlertSms = (count: number): SmsTemplate => ({
  text: `[Hire Adda] ${count} new job${count > 1 ? 's' : ''} matching your profile. Open Hire Adda to view and apply.`,
});
