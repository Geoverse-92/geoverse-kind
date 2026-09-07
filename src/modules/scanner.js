export class PhygitalScanner {
    constructor(onScanSuccess) {
        this.onScanSuccess = onScanSuccess;
        this.isScanning = false;
    }

    async startScan() {
        this.isScanning = true;
        console.log("[Scanner] Uruchamianie optycznego skanera paragnów...");
        
        // W środowisku natywnym lub webowym próbujemy wywołać interfejs wideo / aparat
        try {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                return { success: true, stream, message: "Kamera aktywna. Skieruj obiektyw na kod QR partnera." };
            } else {
                throw new Error("Brak wsparcia dla mediów w tej przeglądarce.");
            }
        } catch (error) {
            console.warn("[Scanner] Uruchomiono tryb symulacji skanowania:", error);
            // Symulacja pomyślnego zeskanowania po 2 sekundach dla wygody testów
            return new Promise((resolve) => {
                setTimeout(() => {
                    this.isScanning = false;
                    const mockData = {
                        partner: "ZARA HUB Oświęcim",
                        amount: "149.99 PLN",
                        vouchersEarned: 3,
                        cashback: 450
                    };
                    if (this.onScanSuccess) this.onScanSuccess(mockData);
                    resolve({ success: true, simulated: true, data: mockData });
                }, 2000);
            });
        }
    }

    stopScan(stream) {
        this.isScanning = false;
        if (stream && stream.getTracks) {
            stream.getTracks().forEach(track => track.stop());
        }
        console.log("[Scanner] Skaner zatrzymany.");
    }
}
