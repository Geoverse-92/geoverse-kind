import { AppState } from '../core/state.js';

export class AchievementEngine {
    static checkMilestones() {
        const state = AppState.load();
        const achievements = state.achievements || [];

        if (state.player.gold >= 5000 && !achievements.includes('MILLIONAIRE')) {
            achievements.push('MILLIONAIRE');
            state.player.vouchers += 3;
            state.feed.push({ author: "SYSTEM", tag: "ACHIEVEMENT", text: `${state.player.name} zdobył tytuł Magnata Finansowego!` });
            AppState.save(state);
            return { unlocked: true, title: "Magnat Finansowy", reward: "+3 Bony" };
        }
        return { unlocked: false };
    }
}
