import { Router } from 'express';
import multer from 'multer';
import { protect } from '../middleware/auth';
import { restrictTo } from '../middleware/rbac';
import { requireMfaEnabled } from '../middleware/require-mfa';
import { validate } from '../validators/validate';
import { audit } from '../middleware/audit';
import { Role } from '@prisma/client';
import * as superAdminController from '../controllers/super-admin.controller';
import {
  createAdminSchema,
  updateConfigSchema,
  createUserSchema,
  updateUserProfileSchema,
  adminResetPasswordSchema,
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

export default router;
