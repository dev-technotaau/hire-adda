import type { WhatsappTemplate } from '../../types/notification-templates';

// ===============================
// Authentication & Onboarding
// ===============================

export const welcomeWhatsapp = (name: string): WhatsappTemplate => ({
  templateName: 'welcome_message',
  languageCode: 'en',
  components: [
    {
      type: 'body',
      parameters: [{ type: 'text', text: name }],
    },
  ],
  text: `Welcome to Hire Adda, ${name}! We're excited to help you find your perfect career match. Complete your profile to get started.`,
});

export const otpWhatsapp = (otp: string): WhatsappTemplate => ({
  templateName: 'auth_otp',
  languageCode: 'en',
  components: [
    {
      type: 'body',
      parameters: [{ type: 'text', text: otp }],
    },
    {
      type: 'button',
      sub_type: 'url',
      index: '0',
      parameters: [{ type: 'text', text: otp }],
    },
  ],
  text: `Your Hire Adda verification code is ${otp}. Valid for 10 minutes. Do not share this code.`,
});

export const profileCompletionWhatsapp = (name: string, progress: number): WhatsappTemplate => ({
  templateName: 'profile_completion',
  languageCode: 'en',
  components: [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: name },
        { type: 'text', text: `${progress}%` },
      ],
    },
  ],
  text: `Hi ${name}, your Hire Adda profile is ${progress}% complete. Complete it to get up to 5x more interview invitations!`,
});

// ===============================
// Jobs & Applications
// ===============================

export const jobAlertWhatsapp = (
  jobTitle: string,
  company: string,
  link: string
): WhatsappTemplate => ({
  templateName: 'job_alert',
  languageCode: 'en',
  components: [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: jobTitle },
        { type: 'text', text: company },
      ],
    },
    {
      type: 'button',
      sub_type: 'url',
      index: '0',
      parameters: [{ type: 'text', text: link }],
    },
  ],
  text: `New job match: ${jobTitle} at ${company}. Apply now: ${link}`,
});

export const interviewWhatsapp = (
  jobTitle: string,
  date: string,
  link: string
): WhatsappTemplate => ({
  templateName: 'interview_invite',
  languageCode: 'en',
  components: [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: jobTitle },
        { type: 'text', text: date },
      ],
    },
    {
      type: 'button',
      sub_type: 'url',
      index: '0',
      parameters: [{ type: 'text', text: link }],
    },
  ],
  text: `Interview scheduled for ${jobTitle} on ${date}. Join here: ${link}`,
});

export const applicationStatusWhatsapp = (
  status: string,
  company: string,
  jobTitle: string
): WhatsappTemplate => ({
  templateName: 'application_status_update',
  languageCode: 'en',
  components: [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: jobTitle },
        { type: 'text', text: company },
        { type: 'text', text: status },
      ],
    },
  ],
  text: `Your application for ${jobTitle} at ${company} has been updated to: ${status}. Open Hire Adda for details.`,
});

export const jobOfferWhatsapp = (
  jobTitle: string,
  company: string,
  link: string
): WhatsappTemplate => ({
  templateName: 'job_offer',
  languageCode: 'en',
  components: [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: jobTitle },
        { type: 'text', text: company },
      ],
    },
    {
      type: 'button',
      sub_type: 'url',
      index: '0',
      parameters: [{ type: 'text', text: link }],
    },
  ],
  text: `Congratulations! You've received an offer for ${jobTitle} at ${company}. View details: ${link}`,
});

export const jobMatchWhatsapp = (
  jobTitle: string,
  companyName: string,
  matchPercentage: string
): WhatsappTemplate => ({
  templateName: 'job_match',
  languageCode: 'en',
  components: [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: jobTitle },
        { type: 'text', text: companyName },
        { type: 'text', text: matchPercentage },
      ],
    },
  ],
  text: `New job match (${matchPercentage}): ${jobTitle} at ${companyName}. View details on Hire Adda.`,
});

// ===============================
// Support
// ===============================

export const ticketReplyWhatsapp = (ticketNumber: string, subject: string): WhatsappTemplate => ({
  templateName: 'ticket_reply',
  languageCode: 'en',
  components: [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: ticketNumber },
        { type: 'text', text: subject },
      ],
    },
  ],
  text: `You have a new reply on your support ticket #${ticketNumber}: ${subject}. Open Hire Adda to view.`,
});

// ===============================
// Admin
// ===============================

export const adminAlertWhatsapp = (message: string): WhatsappTemplate => ({
  templateName: 'admin_alert',
  languageCode: 'en',
  components: [
    {
      type: 'body',
      parameters: [{ type: 'text', text: message }],
    },
  ],
  text: `${message}. Please review in the admin dashboard.`,
});

// ===============================
// Documents & Verification
// ===============================

export const documentRequestWhatsapp = (docName: string, link: string): WhatsappTemplate => ({
  templateName: 'document_request',
  languageCode: 'en',
  components: [
    {
      type: 'body',
      parameters: [{ type: 'text', text: docName }],
    },
    {
      type: 'button',
      sub_type: 'url',
      index: '0',
      parameters: [{ type: 'text', text: link }],
    },
  ],
  text: `Action required: Please upload your ${docName} to continue your verification. Upload here: ${link}`,
});

// ===============================
// Applications (Employer & Candidate)
// ===============================

export const newApplicationWhatsapp = (
  candidateName: string,
  jobTitle: string
): WhatsappTemplate => ({
  templateName: 'new_application',
  languageCode: 'en',
  components: [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: candidateName },
        { type: 'text', text: jobTitle },
      ],
    },
  ],
  text: `New application: ${candidateName} applied for ${jobTitle}. Review on Hire Adda.`,
});

export const applicationSubmittedWhatsapp = (
  jobTitle: string,
  companyName: string
): WhatsappTemplate => ({
  templateName: 'application_submitted',
  languageCode: 'en',
  components: [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: jobTitle },
        { type: 'text', text: companyName },
      ],
    },
  ],
  text: `Your application for ${jobTitle} at ${companyName} has been submitted. Track it on Hire Adda.`,
});

// ===============================
// Account
// ===============================

export const accountAlertWhatsapp = (action: string): WhatsappTemplate => ({
  templateName: 'account_alert',
  languageCode: 'en',
  components: [
    {
      type: 'body',
      parameters: [{ type: 'text', text: action }],
    },
  ],
  text: `Account update: ${action}. Contact support if you did not request this.`,
});

// ===============================
// Security
// ===============================

export const securityAlertWhatsapp = (action: string): WhatsappTemplate => ({
  templateName: 'security_alert',
  languageCode: 'en',
  components: [
    {
      type: 'body',
      parameters: [{ type: 'text', text: action }],
    },
  ],
  text: `Security alert: ${action} was detected on your Hire Adda account. If this wasn't you, secure your account immediately.`,
});

// ===============================
// Billing / Payments
// ===============================

const inrWa = (paise: number): string => `Rs.${(paise / 100).toFixed(2)}`;

export const orderPlacedWhatsapp = (
  planName: string,
  amountPaise: number,
  payUrl: string
): WhatsappTemplate => ({
  templateName: 'billing_order_placed',
  languageCode: 'en',
  components: [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: planName },
        { type: 'text', text: inrWa(amountPaise) },
      ],
    },
    { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: payUrl }] },
  ],
  text: `Order created — ${planName} (${inrWa(amountPaise)}). Complete payment: ${payUrl}`,
});

export const paymentSuccessWhatsapp = (
  planName: string,
  amountPaise: number,
  validUntil: string
): WhatsappTemplate => ({
  templateName: 'billing_payment_success',
  languageCode: 'en',
  components: [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: planName },
        { type: 'text', text: inrWa(amountPaise) },
        { type: 'text', text: validUntil },
      ],
    },
  ],
  text: `Payment of ${inrWa(amountPaise)} received. ${planName} is active until ${validUntil}.`,
});

export const paymentFailedWhatsapp = (planName: string, retryUrl: string): WhatsappTemplate => ({
  templateName: 'billing_payment_failed',
  languageCode: 'en',
  components: [
    { type: 'body', parameters: [{ type: 'text', text: planName }] },
    { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: retryUrl }] },
  ],
  text: `Payment failed for ${planName}. No money debited. Retry: ${retryUrl}`,
});

export const subscriptionRenewedWhatsapp = (
  planName: string,
  amountPaise: number,
  nextChargeAt: string
): WhatsappTemplate => ({
  templateName: 'billing_subscription_renewed',
  languageCode: 'en',
  components: [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: planName },
        { type: 'text', text: inrWa(amountPaise) },
        { type: 'text', text: nextChargeAt },
      ],
    },
  ],
  text: `${planName} renewed for ${inrWa(amountPaise)}. Next charge: ${nextChargeAt}.`,
});

export const subscriptionFailedWhatsapp = (
  planName: string,
  graceUntil: string,
  updateUrl: string
): WhatsappTemplate => ({
  templateName: 'billing_subscription_failed',
  languageCode: 'en',
  components: [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: planName },
        { type: 'text', text: graceUntil },
      ],
    },
    {
      type: 'button',
      sub_type: 'url',
      index: '0',
      parameters: [{ type: 'text', text: updateUrl }],
    },
  ],
  text: `Renewal failed for ${planName}. Update payment method by ${graceUntil}: ${updateUrl}`,
});

export const subscriptionActivatedWhatsapp = (
  planName: string,
  manageUrl: string
): WhatsappTemplate => ({
  templateName: 'billing_subscription_activated',
  languageCode: 'en',
  components: [
    { type: 'body', parameters: [{ type: 'text', text: planName }] },
    {
      type: 'button',
      sub_type: 'url',
      index: '0',
      parameters: [{ type: 'text', text: manageUrl }],
    },
  ],
  text: `${planName} subscription activated. Manage: ${manageUrl}`,
});

export const subscriptionCancelledWhatsapp = (
  planName: string,
  validUntil: string
): WhatsappTemplate => ({
  templateName: 'billing_subscription_cancelled',
  languageCode: 'en',
  components: [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: planName },
        { type: 'text', text: validUntil },
      ],
    },
  ],
  text: `${planName} subscription cancelled. Access until ${validUntil}.`,
});

export const renewalReminderWhatsapp = (
  planName: string,
  daysLeft: number,
  renewUrl: string
): WhatsappTemplate => ({
  templateName: 'billing_renewal_reminder',
  languageCode: 'en',
  components: [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: planName },
        { type: 'text', text: String(daysLeft) },
      ],
    },
    { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: renewUrl }] },
  ],
  text: `${planName} expires in ${daysLeft} day(s). Renew: ${renewUrl}`,
});

export const planExpiredWhatsapp = (planName: string, renewUrl: string): WhatsappTemplate => ({
  templateName: 'billing_plan_expired',
  languageCode: 'en',
  components: [
    { type: 'body', parameters: [{ type: 'text', text: planName }] },
    { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: renewUrl }] },
  ],
  text: `Your ${planName} has expired. Renew to restore access: ${renewUrl}`,
});

export const refundProcessedWhatsapp = (
  amountPaise: number,
  refundId: string
): WhatsappTemplate => ({
  templateName: 'billing_refund_processed',
  languageCode: 'en',
  components: [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: inrWa(amountPaise) },
        { type: 'text', text: refundId },
      ],
    },
  ],
  text: `Refund of ${inrWa(amountPaise)} processed (ID: ${refundId}). Allow 5-7 business days.`,
});

export const customQuoteReadyWhatsapp = (
  companyName: string,
  totalPaise: number,
  acceptUrl: string
): WhatsappTemplate => ({
  templateName: 'billing_custom_quote_ready',
  languageCode: 'en',
  components: [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: companyName },
        { type: 'text', text: inrWa(totalPaise) },
      ],
    },
    {
      type: 'button',
      sub_type: 'url',
      index: '0',
      parameters: [{ type: 'text', text: acceptUrl }],
    },
  ],
  text: `Custom quote for ${companyName}: ${inrWa(totalPaise)}. Accept: ${acceptUrl}`,
});

export const fraudAlertWhatsapp = (
  signal: string,
  severity: string,
  reviewUrl: string
): WhatsappTemplate => ({
  templateName: 'billing_fraud_alert',
  languageCode: 'en',
  components: [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: signal },
        { type: 'text', text: severity },
      ],
    },
    {
      type: 'button',
      sub_type: 'url',
      index: '0',
      parameters: [{ type: 'text', text: reviewUrl }],
    },
  ],
  text: `[FRAUD ${severity}] ${signal} — Review: ${reviewUrl}`,
});

export const quoteReceivedWhatsapp = (
  companyName: string,
  contactPerson: string,
  reviewUrl: string
): WhatsappTemplate => ({
  templateName: 'billing_quote_received',
  languageCode: 'en',
  components: [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: companyName },
        { type: 'text', text: contactPerson },
      ],
    },
    {
      type: 'button',
      sub_type: 'url',
      index: '0',
      parameters: [{ type: 'text', text: reviewUrl }],
    },
  ],
  text: `New CV Enterprise quote from ${companyName} (${contactPerson}). Open: ${reviewUrl}`,
});

export const planUpgradedWhatsapp = (
  fromPlanName: string,
  toPlanName: string,
  manageUrl: string
): WhatsappTemplate => ({
  templateName: 'billing_plan_upgraded',
  languageCode: 'en',
  components: [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: fromPlanName },
        { type: 'text', text: toPlanName },
      ],
    },
    {
      type: 'button',
      sub_type: 'url',
      index: '0',
      parameters: [{ type: 'text', text: manageUrl }],
    },
  ],
  text: `Upgraded from ${fromPlanName} to ${toPlanName}. Manage: ${manageUrl}`,
});

export const planDowngradedWhatsapp = (
  fromPlanName: string,
  toPlanName: string,
  manageUrl: string
): WhatsappTemplate => ({
  templateName: 'billing_plan_downgraded',
  languageCode: 'en',
  components: [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: fromPlanName },
        { type: 'text', text: toPlanName },
      ],
    },
    {
      type: 'button',
      sub_type: 'url',
      index: '0',
      parameters: [{ type: 'text', text: manageUrl }],
    },
  ],
  text: `Switched from ${fromPlanName} to ${toPlanName} as scheduled. Manage: ${manageUrl}`,
});
