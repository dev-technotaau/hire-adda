import type { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      role: Role;
      firstName?: string | null;
      lastName?: string | null;
      isEmailVerified?: boolean;
      mfaEnabled?: boolean;
      sessionId?: string;
    }

    interface Request {
      user?: User;
    }
  }
}
