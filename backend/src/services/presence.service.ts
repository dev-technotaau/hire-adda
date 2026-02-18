import { realtimeDb } from '../config/firebase';
import logger from '../config/logger';

export const presenceService = {
    async setOnline(userId: string): Promise<void> {
        if (!realtimeDb) return;
        try {
            await realtimeDb.ref(`presence/${userId}`).set({
                online: true,
                lastSeen: new Date().toISOString(),
            });
        } catch (error) {
            logger.debug(`Presence setOnline failed: ${(error as Error).message}`);
        }
    },

    async setOffline(userId: string): Promise<void> {
        if (!realtimeDb) return;
        try {
            await realtimeDb.ref(`presence/${userId}`).set({
                online: false,
                lastSeen: new Date().toISOString(),
            });
        } catch (error) {
            logger.debug(`Presence setOffline failed: ${(error as Error).message}`);
        }
    },

    async getPresence(userId: string): Promise<{ online: boolean; lastSeen: string | null } | null> {
        if (!realtimeDb) return null;
        try {
            const snapshot = await realtimeDb.ref(`presence/${userId}`).get();
            return snapshot.exists() ? snapshot.val() : null;
        } catch (error) {
            logger.debug(`Presence getPresence failed: ${(error as Error).message}`);
            return null;
        }
    },

    async getMultiplePresence(
        userIds: string[]
    ): Promise<Record<string, { online: boolean; lastSeen: string | null }>> {
        if (!realtimeDb || userIds.length === 0) return {};
        try {
            const results: Record<string, { online: boolean; lastSeen: string | null }> = {};
            // Batch read via individual gets (Realtime DB doesn't support multi-get)
            await Promise.all(
                userIds.map(async (userId) => {
                    const snapshot = await realtimeDb!.ref(`presence/${userId}`).get();
                    if (snapshot.exists()) {
                        results[userId] = snapshot.val();
                    }
                })
            );
            return results;
        } catch (error) {
            logger.debug(`Presence getMultiplePresence failed: ${(error as Error).message}`);
            return {};
        }
    },
};
