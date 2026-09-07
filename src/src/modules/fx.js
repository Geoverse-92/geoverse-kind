export class FXEngine {
    static triggerMatrixExplosion(x, y) {
        const container = document.body;
        for (let i = 0; i < 15; i++) {
            const particle = document.createElement('div');
            particle.className = 'matrix-particle';
            particle.innerText = Math.random() > 0.5 ? '1' : '0';
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            particle.style.setProperty('--tx', `${(Math.random() - 0.5) * 200}px`);
            particle.style.setProperty('--ty', `${(Math.random() - 0.5) * 200}px`);
            container.appendChild(particle);
            setTimeout(() => particle.remove(), 800);
        }
    }
}
