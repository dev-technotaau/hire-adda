import { Router } from 'express';
import multer from 'multer';
import { protect } from '../middleware/auth';
import { restrictTo } from '../middleware/rbac';
import { requireMfaEnabled } from '../middleware/require-mfa';
import { validate } from '../validators/validate';
import { audit } from '../middleware/audit';
import { Role } from '@prisma/client';
import * as superAdminController from '../controllers/super-admin.controller';
import * as adminController from '../controllers/admin.controller';
import {
  createAdminSchema,
  updateConfigSchema,
  createUserSchema,
  updateUserProfileSchema,
  adminResetPasswordSchema,
  adminEmailInitiateSchema,
  adminEmailConfirmSchema,
  adminMobileInitiateSchema,
  adminMobileConfirmSchema,
  adminWhatsappVerifySchema,
  adminWhatsappChangeSchema,
  adminWhatsappConfirmSchema,
  adminPasswordInitiateSchema,
  adminPasswordConfirmSchema,
  updateCandidateProfileSchema,
  updateCompanyProfileSchema,
  bulkExportUsersSchema,
  bulkNotifyUsersSchema,
  bulkSuspendUsersSchema,
  bulkActivateUsersSchema,
} from '../schemas/super-admin.schema';

const router = Router();
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`));
    }
  },
});

router.use(protect);
router.use(restrictTo(Role.SUPER_ADMIN));
router.use(requireMfaEnabled);

// Admin management
router.post('/admins', validate(createAdminSchema), superAdminController.createAdmin);
router.get('/admins', superAdminController.listAdmins);
router.delete('/admins/:id', superAdminController.removeAdmin);

// System config
router.get('/config', superAdminController.getSystemConfig);
router.patch('/config', validate(updateConfigSchema), superAdminController.updateSystemConfig);

// User management
router.post(
  '/users',
  validate(createUserSchema),
  audit('CREATE_USER', 'User'),
  superAdminController.createUser
);
router.patch(
  '/users/:id/profile',
  validate(updateUserProfileSchema),
  audit('UPDATE_USER_PROFILE', 'User'),
  superAdminController.updateUserProfile
);
router.post(
  '/users/:id/password-otp',
  audit('SEND_PASSWORD_RESET_OTP', 'User'),
  superAdminController.sendAdminPasswordResetOtp
);
router.patch(
  '/users/:id/password',
  validate(adminResetPasswordSchema),
  audit('ADMIN_RESET_PASSWORD', 'User'),
  superAdminController.adminResetPassword
);
router.patch(
  '/users/:id/deactivate',
  audit('DEACTIVATE_USER', 'User'),
  superAdminController.deactivateUser
);
router.post(
  '/users/:id/avatar',
  upload.single('avatar'),
  audit('UPLOAD_USER_AVATAR', 'User'),
  superAdminController.uploadUserAvatar
);
router.delete(
  '/users/:id/avatar',
  audit('REMOVE_USER_AVATAR', 'User'),
  superAdminController.removeUserAvatar
);
router.get('/users/:id/sessions', superAdminController.getUserSessions);
router.delete(
  '/users/:id/sessions',
  audit('REVOKE_USER_SESSIONS', 'User'),
  superAdminController.revokeUserSessions
);
router.delete(
  '/users/:id/sessions/:sessionId',
  audit('REVOKE_USER_SESSION', 'User'),
  superAdminController.revokeUserSession
);

// User applications & jobs
router.get('/users/:id/applications', adminController.getUserApplications);
router.get('/users/:id/jobs', adminController.getUserJobs);
router.get('/users/:id/verifications', adminController.getUserVerifications);
router.patch(
  '/verifications/:id/status',
  audit('UPDATE_VERIFICATION', 'VerificationRequest'),
  adminController.updateVerificationStatus
);

// Profile updates
router.patch(
  '/users/:id/candidate-profile',
  validate(updateCandidateProfileSchema),
  audit('UPDATE_CANDIDATE_PROFILE', 'CandidateProfile'),
  adminController.updateCandidateProfile
);
router.patch(
  '/users/:id/company-profile',
  validate(updateCompanyProfileSchema),
  audit('UPDATE_COMPANY_PROFILE', 'CompanyProfile'),
  adminController.updateCompanyProfile
);

// Bulk operations
router.post(
  '/users/bulk/export',
  validate(bulkExportUsersSchema),
  audit('BULK_EXPORT_USERS', 'User'),
  adminController.bulkExportUsers
);
router.post(
  '/users/bulk/notify',
  validate(bulkNotifyUsersSchema),
  audit('BULK_NOTIFY_USERS', 'User'),
  adminController.bulkNotifyUsers
);
router.post(
  '/users/bulk/suspend',
  validate(bulkSuspendUsersSchema),
  audit('BULK_SUSPEND_USERS', 'User'),
  adminController.bulkSuspendUsers
);
router.post(
  '/users/bulk/activate',
  validate(bulkActivateUsersSchema),
  audit('BULK_ACTIVATE_USERS', 'User'),
  adminController.bulkActivateUsers
);

// Admin MFA management (super-admin manages admin MFA)
router.post(
  '/users/:id/mfa/setup',
  audit('ADMIN_MFA_SETUP', 'User'),
  superAdminController.setupAdminMfa
);
router.post(
  '/users/:id/mfa/enable',
  audit('ADMIN_MFA_ENABLE', 'User'),
  superAdminController.enableAdminMfa
);
router.post(
  '/users/:id/mfa/disable',
  audit('ADMIN_MFA_DISABLE', 'User'),
  superAdminController.disableAdminMfa
);
router.get('/users/:id/mfa/status', superAdminController.getAdminMfaStatus);
router.post(
  '/users/:id/mfa/backup-codes',
  audit('ADMIN_MFA_BACKUP_REGEN', 'User'),
  superAdminController.regenerateAdminBackupCodes
);

// Admin email / mobile / WhatsApp managed verification
router.post(
  '/users/:id/email/initiate',
  validate(adminEmailInitiateSchema),
  audit('ADMIN_EMAIL_CHANGE_INITIATED', 'User'),
  superAdminController.initiateAdminEmailChange
);
router.post(
  '/users/:id/email/confirm',
  validate(adminEmailConfirmSchema),
  audit('ADMIN_EMAIL_CHANGED', 'User'),
  superAdminController.confirmAdminEmailChange
);
router.post(
  '/users/:id/email/resend',
  audit('ADMIN_EMAIL_OTP_RESENT', 'User'),
  superAdminController.resendAdminEmailOtp
);

router.post(
  '/users/:id/mobile/initiate',
  validate(adminMobileInitiateSchema),
  audit('ADMIN_MOBILE_CHANGE_INITIATED', 'User'),
  superAdminController.initiateAdminMobileChange
);
router.post(
  '/users/:id/mobile/confirm',
  validate(adminMobileConfirmSchema),
  audit('ADMIN_MOBILE_CHANGED', 'User'),
  superAdminController.confirmAdminMobileChange
);
router.post(
  '/users/:id/mobile/resend',
  audit('ADMIN_MOBILE_OTP_RESENT', 'User'),
  superAdminController.resendAdminMobileOtp
);
router.delete(
  '/users/:id/mobile',
  audit('ADMIN_MOBILE_REMOVED', 'User'),
  superAdminController.removeAdminMobile
);

router.post(
  '/users/:id/whatsapp/verify',
  validate(adminWhatsappVerifySchema),
  audit('ADMIN_WHATSAPP_VERIFY_INITIATED', 'User'),
  superAdminController.initiateAdminWhatsappVerify
);
router.post(
  '/users/:id/whatsapp/change',
  validate(adminWhatsappChangeSchema),
  audit('ADMIN_WHATSAPP_CHANGE_INITIATED', 'User'),
  superAdminController.initiateAdminWhatsappChange
);
router.post(
  '/users/:id/whatsapp/confirm',
  validate(adminWhatsappConfirmSchema),
  audit('ADMIN_WHATSAPP_VERIFIED', 'User'),
  superAdminController.confirmAdminWhatsappOtp
);
router.delete(
  '/users/:id/whatsapp',
  audit('ADMIN_WHATSAPP_REMOVED', 'User'),
  superAdminController.removeAdminWhatsappNumber
);

// Admin password managed change (verified with super admin password + OTP)
router.post(
  '/users/:id/password/initiate',
  validate(adminPasswordInitiateSchema),
  audit('ADMIN_PASSWORD_CHANGE_INITIATED', 'User'),
  superAdminController.initiateAdminPasswordChange
);
router.post(
  '/users/:id/password/confirm',
  validate(adminPasswordConfirmSchema),
  audit('ADMIN_PASSWORD_CHANGED', 'User'),
  superAdminController.confirmAdminPasswordChange
);
router.post(
  '/users/:id/password/resend',
  audit('ADMIN_PASSWORD_OTP_RESENT', 'User'),
  superAdminController.resendAdminPasswordOtp
);

export default router;
