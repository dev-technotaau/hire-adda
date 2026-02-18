interface KafkaEventEntry {
    eventType: string;
    topic: string;
    key: string | null;
    timestamp: string;
}

const MAX_BUFFER_SIZE = 100;
const eventBuffer: KafkaEventEntry[] = [];

export const kafkaEventsService = {
    push(entry: KafkaEventEntry): void {
        eventBuffer.push(entry);
        if (eventBuffer.length > MAX_BUFFER_SIZE) {
            eventBuffer.shift();
        }
    },

    getRecentEvents(limit: number = 20): KafkaEventEntry[] {
        return eventBuffer.slice(-limit).reverse();
    },

    getBufferSize(): number {
        return eventBuffer.length;
    },
};
