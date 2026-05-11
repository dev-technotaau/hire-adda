import type { Request, Response, NextFunction } from 'express';
import * as svc from '../services/super-admin-team-vendor.service';
import { AppError, BadRequestError } from '../exceptions';

const parseBool = (v: unknown): boolean | undefined => {
  if (v === undefined) return undefined;
  if (v === 'true') return true;
  if (v === 'false') return false;
  return undefined;
};

export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await svc.listVendors({
      query: typeof req.query.query === 'string' ? req.query.query : undefined,
      isVerified: parseBool(req.query.isVerified),
      isPublic: parseBool(req.query.isPublic),
      hasActiveSub: parseBool(req.query.hasActiveSub),
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 25,
    });
    res.status(200).json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
};

export const detail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await svc.getVendorDetail(String(req.params.id));
    res.status(200).json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
};

export const setVerified = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authorized', 401);
    const v = await svc.setVendorVerified({
      superAdminUserId: req.user.id,
      vendorProfileId: String(req.params.id),
      isVerified: Boolean(req.body?.isVerified),
    });
    res.status(200).json({ status: 'success', data: v });
  } catch (err) {
    next(err);
  }
};

export const setVisibility = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authorized', 401);
    const v = await svc.setVendorVisibility({
      superAdminUserId: req.user.id,
      vendorProfileId: String(req.params.id),
      isPublic: Boolean(req.body?.isPublic),
      reason: typeof req.body?.reason === 'string' ? req.body.reason : undefined,
    });
    res.status(200).json({ status: 'success', data: v });
  } catch (err) {
    next(err);
  }
};

export const deleteReview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authorized', 401);
    const reviewId = String(req.params.reviewId);
    if (!reviewId) throw new BadRequestError('reviewId required');
    await svc.moderateDeleteReview({
      superAdminUserId: req.user.id,
      reviewId,
      reason: typeof req.body?.reason === 'string' ? req.body.reason : undefined,
    });
    res.status(200).json({ status: 'success' });
  } catch (err) {
    next(err);
  }
};

// Combined teams + vendors analytics — lives in the vendors controller
// because the SA dashboard tile is in the vendor area, but the data is
// pulled from the shared service.
export const analytics = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await svc.getAnalytics();
    res.status(200).json({ status: 'success', data });
  } catch (err) {
    next(err);
  }
};
