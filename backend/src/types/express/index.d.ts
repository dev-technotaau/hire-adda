import { Role } from '@prisma/client';

declare global {
    namespace Express {
        interface User {
            id: string;
            email: string;
            role: string; // Using string to match Prisma Role enum value
            firstName?: string | null;
            lastName?: string | null;
            isEmailVerified?: boolean;
            mfaEnabled?: boolean;
        }

        interface Request {
            user?: User;
        }
    }
}
