import type { Request, Response, NextFunction } from 'express';
import { reportService } from '../services/report.service';

export const exportUsersExcel = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filters = {
      role: req.query.role as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
    };
    const buffer = await reportService.exportUsersExcel(filters);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename="users-report.xlsx"');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

export const exportJobsExcel = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filters = {
      status: req.query.status as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
    };
    const buffer = await reportService.exportJobsExcel(filters);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename="jobs-report.xlsx"');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

export const exportAnalyticsPdf = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const buffer = await reportService.exportAnalyticsPdf();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="analytics-report.pdf"');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};
