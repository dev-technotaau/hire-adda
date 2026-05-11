import type { Request, Response, NextFunction } from 'express';
import type { VendorLeadStatus } from '@prisma/client';
import * as vendorService from '../services/vendor.service';
import { AppError, BadRequestError } from '../exceptions';

// ── Vendor's own profile ──

export const getMyProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authorized', 401);
    const profile = await vendorService.getMyProfile(req.user.id);
    res.status(200).json({ status: 'success', data: profile });
  } catch (err) {
    next(err);
  }
};

export const upsertMyProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authorized', 401);
    const profile = await vendorService.createOrUpdateProfile(req.user.id, req.body);
    res.status(200).json({ status: 'success', data: profile });
  } catch (err) {
    next(err);
  }
};

export const uploadLogo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authorized', 401);
    if (!req.file) throw new AppError('No file uploaded', 400);
    const profile = await vendorService.uploadLogo(req.user.id, req.file);
    res.status(200).json({ status: 'success', data: { logo: profile.logo } });
  } catch (err) {
    next(err);
  }
};

export const setPublicFlag = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authorized', 401);
    const isPublic = Boolean(req.body?.isPublic);
    const profile = await vendorService.setPublicFlag(req.user.id, isPublic);
    res.status(200).json({ status: 'success', data: profile });
  } catch (err) {
    next(err);
  }
};

// ── Vendor lead inbox ──

export const listMyLeads = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authorized', 401);
    const status = req.query.status as VendorLeadStatus | undefined;
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const result = await vendorService.listMyLeads(req.user.id, { status, page, limit });
    res.status(200).json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
};

export const respondToLead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authorized', 401);
    const leadId = String(req.params.id ?? '');
    const status = String(req.body?.status ?? '').toUpperCase();
    if (!['RESPONDED', 'ACCEPTED', 'DECLINED'].includes(status)) {
      throw new BadRequestError('status must be RESPONDED, ACCEPTED, or DECLINED');
    }
    const lead = await vendorService.respondToLead({
      userId: req.user.id,
      leadId,
      status: status as 'RESPONDED' | 'ACCEPTED' | 'DECLINED',
      responseText: req.body?.responseText,
    });
    res.status(200).json({ status: 'success', data: lead });
  } catch (err) {
    next(err);
  }
};

// ── Public directory ──

export const listPublic = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await vendorService.listPublicVendors({
      service: req.query.service as string | undefined,
      location: req.query.location as string | undefined,
      industry: req.query.industry as string | undefined,
      query: req.query.q as string | undefined,
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
    });
    res.status(200).json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
};

export const getPublicBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const slug = String(req.params.slug ?? '');
    const vendor = await vendorService.getPublicVendorBySlug(slug);
    res.status(200).json({ status: 'success', data: vendor });
  } catch (err) {
    next(err);
  }
};

// ── Reviews ──

export const listReviews = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const slug = String(req.params.slug ?? '');
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const result = await vendorService.listReviewsForSlug(slug, page, limit);
    res.status(200).json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
};

export const upsertReview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authorized', 401);
    const slug = String(req.params.slug ?? '');
    const rating = Number(req.body?.rating);
    if (!Number.isFinite(rating)) {
      throw new BadRequestError('rating is required');
    }
    const review = await vendorService.createReview({
      reviewerUserId: req.user.id,
      vendorSlug: slug,
      rating,
      text: typeof req.body?.text === 'string' ? req.body.text : undefined,
    });
    res.status(200).json({ status: 'success', data: review });
  } catch (err) {
    next(err);
  }
};

// ── Employer sends a lead ──

export const matchAndSend = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authorized', 401);
    const result = await vendorService.matchAndSendLead({
      employerUserId: req.user.id,
      requirementText: req.body?.requirementText ?? '',
      contactEmail: req.body?.contactEmail ?? req.user.email ?? '',
      contactPhone: req.body?.contactPhone,
      jobPostId: req.body?.jobPostId,
      services: Array.isArray(req.body?.services) ? req.body.services : undefined,
      industries: Array.isArray(req.body?.industries) ? req.body.industries : undefined,
      locations: Array.isArray(req.body?.locations) ? req.body.locations : undefined,
      vendorIds: Array.isArray(req.body?.vendorIds) ? req.body.vendorIds : undefined,
      limit: req.body?.limit ? Number(req.body.limit) : undefined,
    });
    res.status(201).json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
};

export const matchPreview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authorized', 401);
    const result = await vendorService.previewMatches({
      services: Array.isArray(req.body?.services) ? req.body.services : undefined,
      industries: Array.isArray(req.body?.industries) ? req.body.industries : undefined,
      locations: Array.isArray(req.body?.locations) ? req.body.locations : undefined,
      limit: req.body?.limit ? Number(req.body.limit) : undefined,
    });
    res.status(200).json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
};

export const sendLead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authorized', 401);
    const slug = String(req.params.slug ?? '');
    const lead = await vendorService.sendLeadToVendor({
      vendorSlug: slug,
      employerUserId: req.user.id,
      requirementText: req.body?.requirementText ?? '',
      contactEmail: req.body?.contactEmail ?? req.user.email ?? '',
      contactPhone: req.body?.contactPhone,
      jobPostId: req.body?.jobPostId,
    });
    res.status(201).json({ status: 'success', data: lead });
  } catch (err) {
    next(err);
  }
};
