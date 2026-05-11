import { Router } from 'express';
import multer from 'multer';
import { Role } from '@prisma/client';
import { protect } from '../middleware/auth';
import { restrictTo } from '../middleware/rbac';
import { planGate } from '../middleware/plan-gate';
import * as vendorController from '../controllers/vendor.controller';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`));
    }
  },
});

const router = Router();

// ── Vendor's authenticated routes ──

router.use(protect);
router.use(restrictTo(Role.VENDOR));

router.get('/me', vendorController.getMyProfile);
router.put('/me', vendorController.upsertMyProfile);
router.post('/me/logo', imageUpload.single('logo'), vendorController.uploadLogo);
router.patch('/me/visibility', vendorController.setPublicFlag);

// Lead inbox — gated by feature.vendor_leads (active VENDOR_CONNECT plan).
router.get(
  '/me/leads',
  planGate({ require: ['feature.vendor_leads'], skipForRoles: ['SUPER_ADMIN'] }),
  vendorController.listMyLeads
);
router.patch(
  '/me/leads/:id',
  planGate({ require: ['feature.vendor_leads'], skipForRoles: ['SUPER_ADMIN'] }),
  vendorController.respondToLead
);

export default router;
