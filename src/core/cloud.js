export class CloudSync {
    constructor(endpointUrl) {
        this.endpointUrl = endpointUrl || "https://api.geoverse-phygital.cloud";
    }

    async syncUserData(userId, stateData) {
        try {
            const response = await fetch(`${this.endpointUrl}/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userId}`
                },
                body: JSON.stringify(stateData)
            });
            if (!response.ok) throw new Error("Błąd synchronizacji z chmurą");
            return await response.json();
        } catch (error) {
            console.warn("Tryb Offline: Zapisane lokalnie w kolejce.", error);
            return { success: false, offline: true };
        }
    }

    async fetchGlobalFeed() {
        try {
            const response = await fetch(`${this.endpointUrl}/feed`);
            return await response.json();
        } catch (error) {
            return [];
        }
    }
}
