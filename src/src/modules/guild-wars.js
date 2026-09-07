import { AppState } from '../core/state.js';

export class GuildWars {
    static resolveTerritoryConquest(territoryId) {
        const state = AppState.load();
        const territory = state.housing.find(t => t.id === territoryId);
        
        if (!territory) return { success: false, reason: "Strefa nie istnieje" };
        
        const defensePower = Math.floor(Math.random() * 400) + 150;
        const playerPower = state.player.lvl * 250 + (state.player.gold > 500 ? 200 : 50);
        const victory = playerPower > defensePower;

        if (victory) {
            territory.name = `Dominacja: ${state.player.name}`;
            territory.icon = "👑";
            AppState.save(state);
            return { success: true, reward: 800, defensePower };
        } else {
            return { success: false, reason: `Obrona strefy wyniosła ${defensePower} pkt! Zdobądź wyższy poziom.`, defensePower };
        }
    }
}
