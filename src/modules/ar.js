import { FXEngine } from './fx.js';

export class AREngine {
    static initARScanner(containerId, onReward) {
        const container = document.getElementById(containerId);
        container.innerHTML = `
            <div class="ar-viewport">
                <div class="ar-hud-overlay">
                    <div class="radar-sweep"></div>
                    <span class="ar-target-tag">SKRZYNKA AR DETECTED</span>
                </div>
                <div class="ar-chest" id="arChestBox">💎</div>
            </div>
        `;

        const chest = document.getElementById('arChestBox');
        chest.addEventListener('click', (e) => {
            const rect = chest.getBoundingClientRect();
            FXEngine.triggerMatrixExplosion(rect.left + rect.width / 2, rect.top + rect.height / 2);
            chest.style.transform = 'scale(0) rotate(720deg)';
            setTimeout(() => {
                container.innerHTML = '';
                if(onReward) onReward({ name: "Cyber Kryształ AR", icon: "💎", bonus: 500 });
            }, 600);
        });
    }
}
