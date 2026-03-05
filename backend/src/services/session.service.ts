import { prisma } from '../config/prisma';
import redis from '../config/redis';
import logger from '../config/logger';
import { AppError } from '../middleware/error';

const SESSION_CACHE_TTL = 60; // 1 minute
const sessionCacheKey = (id: string) => `session:active:${id}`;
const tokenCacheKey = (hashedToken: string) => `token:valid:${hashedToken}`;

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

  /**
   * Check if a session is still active (Redis-cached for performance).
   */
  async isSessionActive(sessionId: string): Promise<boolean> {
    // Redis cache check first
    try {
      const cached = await redis.get(sessionCacheKey(sessionId));
      if (cached === '1') return true;
      if (cached === '0') return false;
    } catch {
      // Redis down — fall through to DB
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { isActive: true },
    });
    const active = !!session?.isActive;

    // Cache the result (fire-and-forget)
    redis.set(sessionCacheKey(sessionId), active ? '1' : '0', 'EX', SESSION_CACHE_TTL).catch(() => {});

    return active;
  }

  /**
   * Revoke a specific session by userId + sessionId.
   * Also revokes all linked refresh tokens and invalidates Redis caches.
   */
  async revokeSession(userId: string, sessionId: string) {
    const session = await prisma.session.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) throw new AppError('Session not found', 404);

    // Deactivate session
    await prisma.session.update({
      where: { id: sessionId },
      data: { isActive: false },
    });

    // Invalidate session Redis cache
    redis.del(sessionCacheKey(sessionId)).catch(() => {});

    // Revoke linked refresh tokens and invalidate their caches
    await this.revokeLinkedTokens(sessionId);
  }

  /**
   * Revoke a session by sessionId only (for super admin — no userId ownership check).
   */
  async revokeSessionById(sessionId: string) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new AppError('Session not found', 404);

    await prisma.session.update({
      where: { id: sessionId },
      data: { isActive: false },
    });

    redis.del(sessionCacheKey(sessionId)).catch(() => {});
    await this.revokeLinkedTokens(sessionId);
  }

  async updateLastSeen(sessionId: string) {
    await prisma.session
      .update({
        where: { id: sessionId },
        data: { lastSeenAt: new Date() },
      })
      .catch(() => {}); // Non-critical, don't throw
  }

  async revokeAllSessions(userId: string, excludeSessionId?: string) {
    const where: { userId: string; isActive: true; id?: { not: string } } = {
      userId,
      isActive: true,
    };
    if (excludeSessionId) {
      where.id = { not: excludeSessionId };
    }

    // Get all active sessions to invalidate caches
    const sessions = await prisma.session.findMany({
      where,
      select: { id: true },
    });

    await prisma.session.updateMany({ where, data: { isActive: false } });

    // Invalidate Redis cache for each session + revoke linked tokens
    for (const session of sessions) {
      redis.del(sessionCacheKey(session.id)).catch(() => {});
      await this.revokeLinkedTokens(session.id);
    }
  }

  /**
   * Revoke all refresh tokens linked to a session and invalidate their Redis caches.
   */
  private async revokeLinkedTokens(sessionId: string) {
    // Get hashed tokens before revoking so we can invalidate their caches
    const tokens = await prisma.refreshToken.findMany({
      where: { sessionId, isRevoked: false },
      select: { token: true },
    });

    if (tokens.length === 0) return;

    await prisma.refreshToken.updateMany({
      where: { sessionId, isRevoked: false },
      data: { isRevoked: true },
    });

    // Invalidate token cache keys
    for (const t of tokens) {
      redis.del(tokenCacheKey(t.token)).catch(() => {});
    }

    logger.debug(`Revoked ${tokens.length} refresh tokens for session ${sessionId}`);
  }
}

export const sessionService = new SessionService();
