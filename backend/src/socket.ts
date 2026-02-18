import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from './config/env';
import logger from './config/logger';

let io: Server;

export const initSocket = (httpServer: HttpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: env.FRONTEND_URL || '*',
            methods: ['GET', 'POST'],
        },
    });

    // JWT Authentication middleware
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;
        if (!token || typeof token !== 'string') {
            return next(new Error('Authentication required'));
        }

        try {
            const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string; email: string; role: string };
            (socket as any).userId = decoded.userId;
            (socket as any).userRole = decoded.role;
            next();
        } catch (err) {
            next(new Error('Invalid or expired token'));
        }
    });

    io.on('connection', (socket: Socket) => {
        const userId = (socket as any).userId;
        logger.info(`Client connected: ${socket.id} (user: ${userId})`);

        // Auto-join user-specific room
        if (userId) {
            socket.join(`user:${userId}`);
        }

        socket.on('disconnect', () => {
            logger.info(`Client disconnected: ${socket.id}`);
        });

        // Keep backward compat for manual room joining
        socket.on('join_user', (requestedUserId: string) => {
            if (requestedUserId === userId) {
                socket.join(`user:${requestedUserId}`);
            }
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};
