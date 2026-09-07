import { AppState } from '../core/state.js';

export function processReceipt(receiptCode) {
    const state = AppState.load();
    state.inventory.push({ name: receiptCode, icon: "🧾" });
    state.player.gold += 200;
    AppState.save(state);
    return { success: true, reward: 200 };
}
