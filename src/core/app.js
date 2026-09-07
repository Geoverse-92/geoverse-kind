import { PhygitalScanner } from '../modules/scanner.js';
import { AugmentedRealityLayer } from '../modules/ar.js';

// Wewnątrz metody initUI() w klasie GeoVersePixelApp:
document.getElementById('btnOpenScanner').addEventListener('click', async () => {
    this.showToast("[SCAN] Inicjalizacja kamery i modułu OCR...");
    
    const scanner = new PhygitalScanner((result) => {
        this.state.gold += result.cashback;
        this.state.vouchers += result.vouchersEarned;
        
        const q = this.state.quests.find(x => x.id === 2);
        if (q) q.done = true;

        this.addFeedItem("Phygital", `Zatwierdzono dowód zakupu: ${result.partner} (${result.amount}). +${result.cashback} PLN`);
        this.saveState();
        this.renderAll();
        this.showToast(`[SUKCES] Zweryfikowano paragon! +${result.cashback} PLN`);
    });

    await scanner.startScan();
});
