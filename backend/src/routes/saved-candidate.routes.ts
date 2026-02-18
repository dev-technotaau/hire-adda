import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth';
import * as savedCandidateController from '../controllers/saved-candidate.controller';
import { Role } from '@prisma/client';

const router = Router();

router.use(protect);
router.use(restrictTo(Role.EMPLOYER));

router.post('/:id/toggle', savedCandidateController.toggleSave);
router.get('/', savedCandidateController.listSaved);
router.patch('/:id/notes', savedCandidateController.updateNotes);

export default router;
