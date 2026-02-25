import { prisma } from '../config/prisma';
import { AppError } from '../middleware/error';

class SessionService {
  async createSession(userId: string, userAgent?: string, ipAddress?: string) {
    return prisma.session.create({
      data: { userId, userAgent, ipAddress },
    });
  }

  async listActiveSessions(userId: string) {
    return prisma.session.findMany({
      where: { userId, isActive: true },
      orderBy: { lastSeenAt: 'desc' },
    });
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await prisma.session.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) throw new AppError('Session not found', 404);

    await prisma.session.update({
      where: { id: sessionId },
      data: { isActive: false },
    });
  }

  async updateLastSeen(sessionId: string) {
    await prisma.session
      .update({
        where: { id: sessionId },
        data: { lastSeenAt: new Date() },
      })
      .catch(() => {}); // Non-critical, don't throw
  }

  async revokeAllSessions(userId: string) {
    await prisma.session.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });
  }
}

export const sessionService = new SessionService();
