export const AppState = {
    key: 'geoverse_repo_state_v4',
    load() {
        const saved = localStorage.getItem(this.key);
        return saved ? JSON.parse(saved) : {
            player: { name: "Agent", lvl: 1, gold: 1000, vouchers: 2, equipped: null, icon: "💻" },
            inventory: [{ name: "Skan-Startowy", icon: "🧾" }],
            territories: [{ id: 1, name: "Strefa Główna", level: 1 }]
        };
    },
    save(state) {
        localStorage.setItem(this.key, JSON.stringify(state));
        window.dispatchEvent(new CustomEvent('stateChanged', { detail: state }));
    }
};
