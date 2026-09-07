import { AppState } from './state.js';

export class SyncEngine {
    static async init() {
        window.addEventListener('online', () => this.flushQueue());
        window.addEventListener('offline', () => console.warn("Tryb Offline: Operacje buforowane lokalnie."));
    }

    static async dispatchAction(actionType, payload) {
        const state = AppState.load();
        const actionPacket = { id: crypto.randomUUID(), type: actionType, payload, timestamp: Date.now() };
        
        if (navigator.onLine) {
            try {
                // Symulacja autoryzowanego strzału do API mikroserwisu
                console.log("Wysłano pakiet do chmury:", actionPacket);
            } catch (e) {
                this.saveToQueue(actionPacket);
            }
        } else {
            this.saveToQueue(actionPacket);
        }
    }

    private static saveToQueue(packet) {
        const queue = JSON.parse(localStorage.getItem('geoverse_offline_queue') || '[]');
        queue.push(packet);
        localStorage.setItem('geoverse_offline_queue', JSON.stringify(queue));
    }

    private static async flushQueue() {
        const queue = JSON.parse(localStorage.getItem('geoverse_offline_queue') || '[]');
        if (queue.length === 0) return;
        
        console.log(`Synchronizacja ${queue.length} zaległych pakietów z chmurą...`);
        localStorage.removeItem('geoverse_offline_queue');
    }
  }
