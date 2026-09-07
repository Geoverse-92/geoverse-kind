export const AppState = {
    key: 'geoverse_repo_state_v6',
    load() {
        const saved = localStorage.getItem(this.key);
        return saved ? JSON.parse(saved) : {
            player: { name: "Agent", icon: "👨‍💻", className: "Cyber Tech", equipped: "Koszulka Biedronka", gold: 1200, vouchers: 2, lvl: 1, typeValue: "👨‍💻|Cyber Tech|💻" },
            inventory: [{ name: "Koszulka Biedronka", icon: "👕" }, { name: "Trampki Nike", icon: "👟" }],
            housing: [{ id: 1, name: "Galeria Centralna", icon: "🏪" }, { id: 2, name: "Wolne Terytorium", icon: "➕" }, { id: 3, name: "Wolne Terytorium", icon: "➕" }],
            feed: [{ author: "SYSTEM", tag: "INFO", text: "Zainicjowano ekosystem Phygital z pełną obsługą silnika AR i Gildii." }],
            quests: [{ id: 1, title: "Odwiedź Strefę Handlową", desc: "Zamelduj się w najbliższym sklepie partnerskim.", rewardGold: 300 }]
        };
    },
    save(state) {
        localStorage.setItem(this.key, JSON.stringify(state));
        window.dispatchEvent(new CustomEvent('stateChanged', { detail: state }));
    }
};
