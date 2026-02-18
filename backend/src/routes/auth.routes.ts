import { Router } from 'express';
import crypto from 'crypto';
import * as authController from '../controllers/auth.controller';
import * as firebaseAuthController from '../controllers/firebase-auth.controller';
import { validate } from '../validators/validate';
import { protect } from '../middleware/auth';
import { authLimiter } from '../middleware/rate-limit';
import { audit } from '../middleware/audit';
import { verifyTurnstile } from '../middleware/turnstile';
import passport from 'passport';
import {
    registerSchema,
    loginSchema,
    verifyEmailSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    initiateChangePasswordSchema,
    confirmChangePasswordSchema,
    refreshTokenSchema,
    mfaVerifySchema,
    mfaDisableSchema,
    verifyMobileSchema,
    resendMobileOtpSchema,
    verifyWhatsappSchema,
    verifyWhatsappOtpSchema,
    changeEmailSchema,
} from '../schemas/auth.schema';

const router = Router();

// Apply strict rate limiting to all auth routes
router.use(authLimiter);

// ===============================
// Public Routes
// ===============================

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, firstName, lastName]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               role: { type: string, enum: [CANDIDATE, EMPLOYER] }
 *     responses:
 *       201: { description: Registration successful }
 *       400: { description: Validation error or email already exists }
 */
router.post('/register', verifyTurnstile, validate(registerSchema), authController.register);

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *               mfaCode: { type: string, description: Required if MFA is enabled }
 *     responses:
 *       200: { description: Login successful }
 *       401: { description: Invalid credentials }
 *       423: { description: Account locked }
 */
router.post('/login', verifyTurnstile, validate(loginSchema), authController.login);

/**
 * @openapi
 * /api/v1/auth/verify-email:
 *   post:
 *     tags: [Auth]
 *     summary: Verify email address with token
 */
router.post('/verify-email', validate(verifyEmailSchema), authController.verifyEmail);

/**
 * @openapi
 * /api/v1/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request password reset email
 */
router.post('/forgot-password', verifyTurnstile, validate(forgotPasswordSchema), authController.forgotPassword);

/**
 * @openapi
 * /api/v1/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password with token
 */
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

/**
 * @openapi
 * /api/v1/auth/refresh-token:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 */
router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken);

/**
 * @openapi
 * /api/v1/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout (revoke refresh token)
 */
router.post('/logout', authController.logout);

// ===============================
// Protected Routes
// ===============================

/**
 * @openapi
 * /api/v1/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user profile
 *     security: [{ bearerAuth: [] }]
 */
router.get('/me', protect, authController.getMe);

/**
 * @openapi
 * /api/v1/auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Change password (authenticated)
 *     security: [{ bearerAuth: [] }]
 */
router.post('/change-password/initiate', protect, validate(initiateChangePasswordSchema), authController.initiateChangePassword);
router.post('/change-password/confirm', protect, validate(confirmChangePasswordSchema), audit('PASSWORD_CHANGE', 'User'), authController.confirmChangePassword);

/**
 * @openapi
 * /api/v1/auth/logout-everywhere:
 *   post:
 *     tags: [Auth]
 *     summary: Logout from all devices
 *     security: [{ bearerAuth: [] }]
 */
router.post('/logout-everywhere', protect, authController.logoutEverywhere);

// ===============================
// MFA Routes
// ===============================

/**
 * @openapi
 * /api/v1/auth/mfa/setup:
 *   post:
 *     tags: [Auth - MFA]
 *     summary: Generate MFA secret and QR code
 *     security: [{ bearerAuth: [] }]
 */
router.post('/mfa/setup', protect, authController.mfaSetup);

/**
 * @openapi
 * /api/v1/auth/mfa/enable:
 *   post:
 *     tags: [Auth - MFA]
 *     summary: Enable MFA after verifying token
 *     security: [{ bearerAuth: [] }]
 */
router.post('/mfa/enable', protect, validate(mfaVerifySchema), authController.mfaEnable);

/**
 * @openapi
 * /api/v1/auth/mfa/disable:
 *   post:
 *     tags: [Auth - MFA]
 *     summary: Disable MFA (requires password and token)
 *     security: [{ bearerAuth: [] }]
 */
router.post('/mfa/disable', protect, validate(mfaDisableSchema), authController.mfaDisable);

router.post(
    '/verify-mobile',
    validate(verifyMobileSchema),
    authController.verifyMobile
);

router.post(
    '/resend-mobile-otp',
    validate(resendMobileOtpSchema),
    authController.resendMobileOtp
);

router.post(
    '/verify-whatsapp',
    protect,
    validate(verifyWhatsappSchema),
    authController.verifyWhatsapp
);

router.post(
    '/verify-whatsapp-otp',
    protect,
    validate(verifyWhatsappOtpSchema),
    authController.confirmWhatsappOtp
);

// Public — accepts { email } in body (no auth required for pre-login resend)
router.post('/resend-email-verification', authController.resendEmailVerification);

/**
 * @openapi
 * /api/v1/auth/change-email:
 *   post:
 *     tags: [Auth]
 *     summary: Change email address (requires password verification)
 *     security: [{ bearerAuth: [] }]
 */
router.post('/change-email', protect, validate(changeEmailSchema), authController.changeEmail);

// ===============================
// Firebase Auth Login
// ===============================
router.post('/firebase-login', firebaseAuthController.firebaseLogin);

// ===============================
// Social Auth Routes
// ===============================

// Google (pass ?role=EMPLOYER to register as employer)
router.get('/google', (req, res, next) => {
    const role = req.query.role === 'EMPLOYER' ? 'EMPLOYER' : 'CANDIDATE';
    passport.authenticate('google', { scope: ['profile', 'email'], state: role })(req, res, next);
});
router.get(
    '/google/callback',
    passport.authenticate('google', { failureRedirect: '/login', session: false }),
    authController.socialCallback
);

// LinkedIn
router.get('/linkedin', (req, res, next) => {
    const state = crypto.randomBytes(16).toString('hex');
    passport.authenticate('linkedin', { state })(req, res, next);
});
router.get(
    '/linkedin/callback',
    passport.authenticate('linkedin', { failureRedirect: '/login', session: false }),
    authController.socialCallback
);

// ===============================
// Account Deletion (GDPR)
// ===============================
router.delete('/me', protect, audit('REQUEST_ACCOUNT_DELETION', 'User'), authController.requestAccountDeletion);

// ===============================
// Consent Management (GDPR)
// ===============================
router.get('/me/consents', protect, authController.getConsents);
router.post('/me/consents', protect, authController.giveConsent);
router.delete('/me/consents/:type', protect, authController.revokeConsent);

// ===============================
// Data Export (GDPR)
// ===============================
router.get('/me/data-export', protect, authController.exportMyData);

export default router;
