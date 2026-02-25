import type { Request, Response, NextFunction } from 'express';
import { sessionService } from '../services/session.service';
import { AppError } from '../middleware/error';

export const listSessions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authorized', 401);
    const sessions = await sessionService.listActiveSessions(req.user.id);
    res.status(200).json({ status: 'success', data: { sessions } });
  } catch (error) {
    next(error);
  }
};

export const revokeSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authorized', 401);
    await sessionService.revokeSession(req.user.id, req.params.id as string);
    res.status(200).json({ status: 'success', message: 'Session revoked' });
  } catch (error) {
    next(error);
  }
};

export const revokeAllSessions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authorized', 401);
    await sessionService.revokeAllSessions(req.user.id);
    res.status(200).json({ status: 'success', message: 'All sessions revoked' });
  } catch (error) {
    next(error);
  }
};
