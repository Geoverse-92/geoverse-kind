import { AppState } from '../core/state.js';

export function processReceipt(receiptCode) {
    const state = AppState.load();
    state.player.gold += 200;
    state.inventory.push({ name: receiptCode, icon: "🎫" });
    AppState.save(state);
    return { success: true, reward: 200 };
}
