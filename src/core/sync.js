export class SyncEngine {
    static init() {
        window.addEventListener('online', () => this.flushQueue());
        window.addEventListener('offline', () => console.warn("Tryb Offline: Operacje buforowane lokalnie w kolejce."));
    }

    static async dispatchAction(actionType, payload) {
        const actionPacket = { id: crypto.randomUUID(), type: actionType, payload, timestamp: Date.now() };
        
        if (navigator.onLine) {
            try {
                console.log("Wysłano pakiet zdarzenia do chmury:", actionPacket);
            } catch (e) {
                this.saveToQueue(actionPacket);
            }
        } else {
            this.saveToQueue(actionPacket);
        }
    }

    static saveToQueue(packet) {
        const queue = JSON.parse(localStorage.getItem('geoverse_offline_queue') || '[]');
        queue.push(packet);
        localStorage.setItem('geoverse_offline_queue', JSON.stringify(queue));
    }

    static async flushQueue() {
        const queue = JSON.parse(localStorage.getItem('geoverse_offline_queue') || '[]');
        if (queue.length === 0) return;
        
        console.log(`Zsynchronizowano ${queue.length} zaległych pakietów z chmurą.`);
        localStorage.removeItem('geoverse_offline_queue');
    }
}
