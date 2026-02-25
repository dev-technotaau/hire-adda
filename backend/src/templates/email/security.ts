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
  successBox,
  warningBox,
  dangerBox,
  divider,
  iconCircle,
  smallText,
  BRAND,
} from './_layout';

export const twoFactorEnabled = (method: string): EmailTemplate => ({
  subject: 'Two-Factor Authentication Enabled — Talent Bridge',
  html: emailLayout(
    `
        ${iconCircle('&#128737;', BRAND.successLight)}
        ${heading('2FA Successfully Enabled')}
        ${subtitle('Your account security has been upgraded.')}
        ${successBox(`Two-factor authentication has been enabled using <strong>${method}</strong>. Your account is now significantly more secure.`)}
        ${paragraph("From now on, you'll need to provide a verification code from your authenticator app each time you sign in.")}
        ${warningBox("Keep your recovery codes in a safe place. If you lose access to your authenticator, you'll need these codes to regain access to your account.")}
        ${divider()}
        ${smallText('If you did not enable 2FA, your account may be compromised. Contact support immediately.')}
        ${button('Review Security Settings', `${BRAND.url}/settings/security`)}
        ${signature()}
    `,
    'Two-factor authentication has been enabled on your Talent Bridge account.'
  ),
  text: `Two-factor authentication has been enabled using ${method}. Your Talent Bridge account is now more secure. If you didn't do this, contact support immediately.`,
});

export const twoFactorDisabled = (method: string): EmailTemplate => ({
  subject: 'Two-Factor Authentication Disabled — Talent Bridge',
  html: emailLayout(
    `
        ${iconCircle('&#9888;', BRAND.warningLight)}
        ${heading('2FA Has Been Disabled')}
        ${subtitle('Your account protection level has changed.')}
        ${warningBox(`Two-factor authentication (<strong>${method}</strong>) has been removed from your account. Your account is now less secure.`)}
        ${paragraph('We strongly recommend keeping 2FA enabled to protect your account from unauthorized access.')}
        ${button('Re-enable 2FA', `${BRAND.url}/settings/security`)}
        ${divider()}
        ${dangerBox('If you did not disable 2FA, someone may have access to your account. <strong>Change your password immediately</strong> and contact support.')}
        ${signature()}
    `,
    'Two-factor authentication has been disabled on your Talent Bridge account.'
  ),
  text: `Two-factor authentication (${method}) has been disabled on your Talent Bridge account. If you didn't do this, change your password immediately and contact support.`,
});

export const passwordChanged = (time: string): EmailTemplate => ({
  subject: 'Password Changed Successfully — Talent Bridge',
  html: emailLayout(
    `
        ${iconCircle('&#128274;', BRAND.successLight)}
        ${heading('Password Updated')}
        ${subtitle('Your account password has been changed.')}
        ${successBox('Your Talent Bridge password was successfully updated.')}
        ${infoBox([{ label: 'Changed On', value: time }])}
        ${paragraph('If you made this change, no further action is needed.')}
        ${dangerBox('If you did not change your password, your account may be compromised. <strong>Reset your password immediately</strong> and contact our support team.')}
        ${button('Review Account Security', `${BRAND.url}/settings/security`)}
        ${signature()}
    `,
    `Your Talent Bridge password was changed on ${time}.`
  ),
  text: `Your Talent Bridge password was changed on ${time}. If you didn't do this, reset your password immediately and contact support.`,
});

export const emailChanged = (name: string, newEmail: string): EmailTemplate => ({
  subject: 'Email Address Updated — Talent Bridge',
  html: emailLayout(
    `
        ${iconCircle('&#9993;', '#eef2ff')}
        ${heading('Email Address Updated')}
        ${greeting(name)}
        ${paragraph(`Your Talent Bridge account email has been changed to <strong>${newEmail}</strong>.`)}
        ${infoBox([{ label: 'New Email', value: newEmail }])}
        ${paragraph('All future communications will be sent to your new email address.')}
        ${warningBox('If you did not make this change, your account may have been compromised. Please <a href="mailto:' + BRAND.supportEmail + '" style="color:#92400e;font-weight:600;">contact support</a> immediately.')}
        ${button('Review Account Settings', `${BRAND.url}/settings`)}
        ${signature()}
    `,
    `Your Talent Bridge email has been updated to ${newEmail}.`
  ),
  text: `Hi ${name}, your Talent Bridge email has been changed to ${newEmail}. If you didn't do this, contact support immediately at ${BRAND.supportEmail}.`,
});

export const accountLockedOut = (name: string, unlockTime?: string): EmailTemplate => ({
  subject: 'Account Temporarily Locked — Talent Bridge',
  html: emailLayout(
    `
        ${iconCircle('&#128683;', BRAND.errorLight)}
        ${heading('Account Temporarily Locked')}
        ${greeting(name)}
        ${dangerBox('Your account has been temporarily locked due to multiple failed sign-in attempts.')}
        ${unlockTime ? paragraph(`Your account will be automatically unlocked at <strong>${unlockTime}</strong>.`) : paragraph('Please wait a few minutes before trying again.')}
        ${paragraph("If you're having trouble signing in, you can reset your password to regain access immediately.")}
        ${button('Reset Your Password', `${BRAND.url}/auth/forgot-password`)}
        ${divider()}
        ${warningBox('If you did not attempt to sign in, someone may be trying to access your account. We recommend changing your password and enabling two-factor authentication.')}
        ${signature()}
    `,
    'Your Talent Bridge account has been temporarily locked due to multiple failed sign-in attempts.'
  ),
  text: `Hi ${name}, your Talent Bridge account has been temporarily locked due to multiple failed sign-in attempts.${unlockTime ? ` It will unlock at ${unlockTime}.` : ''} Reset your password: ${BRAND.url}/auth/forgot-password`,
});

export const sessionRevokedAll = (name: string): EmailTemplate => ({
  subject: 'All Sessions Revoked — Talent Bridge',
  html: emailLayout(
    `
        ${iconCircle('&#128274;', BRAND.warningLight)}
        ${heading('All Sessions Revoked')}
        ${greeting(name)}
        ${warningBox('All active sessions on your Talent Bridge account have been signed out.')}
        ${paragraph("This means you'll need to sign in again on all your devices. This action is typically performed for security reasons.")}
        ${paragraph('If you performed this action, no further steps are needed. If not, please change your password immediately.')}
        ${button('Sign In Again', `${BRAND.url}/auth/login`)}
        ${signature()}
    `,
    'All sessions on your Talent Bridge account have been revoked.'
  ),
  text: `Hi ${name}, all active sessions on your Talent Bridge account have been signed out. If you didn't do this, change your password immediately.`,
});
