import { NativeBridge } from './native.js';
import { CloudSync } from './cloud.js';

class GeoVerseApp {
    constructor() {
        this.state = {
            lvl: 1,
            gold: 1200,
            vouchers: 2,
            name: "Agent",
            avatar: "👨‍💻",
            classTitle: "Cyber Tech",
            outfit: "💻",
            inventory: ["💻", "⚡", "🔮", "🛡️"],
            housing: [
                { id: 1, name: "Strefa Alpha", level: 1, income: 50 },
                { id: 2, name: "Pusty Slot", level: 0, income: 0 },
                { id: 3, name: "Pusty Slot", level: 0, income: 0 }
            ],
            quests: [
                { id: 1, title: "Skan paragonu spożywczego", reward: "150 PLN", desc: "Zweryfikuj zakup w lokalnym partnerskim sklepie." },
                { id: 2, title: "Meldunek w strefie centralnej", reward: "300 PLN + 1 Bon", desc: "Odwiedź wyznaczony punkt na mapie miasta." }
            ],
            feed: [
                { time: "12:00", author: "System", text: "Zainicjalizowano rdzeń ekosystemu Phygital." }
            ]
        };

        this.cloud = new CloudSync();
        this.map = null;
        this.init();
    }

    init() {
        this.loadState();
        this.initNavigation();
        this.initUI();
        this.initMap();
        this.renderAll();
        NativeBridge.scheduleNotification("GeoVerse Phygital", "System gotowy do działania, Agencie.");
    }

    loadState() {
        const saved = localStorage.getItem('geoverse_state');
        if (saved) {
            try { this.state = { ...this.state, ...JSON.parse(saved) }; } catch (e) { console.error(e); }
        }
    }

    saveState() {
        localStorage.setItem('geoverse_state', JSON.stringify(this.state));
        this.cloud.syncUserData(this.state.name, this.state);
    }

    initNavigation() {
        document.querySelectorAll('nav button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = btn.getAttribute('data-target');
                document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(target).classList.add('active');
                if (target === 'screen-map' && this.map) {
                    setTimeout(() => this.map.invalidateSize(), 200);
                }
            });
        });
    }

    initUI() {
        // Profil
        document.getElementById('btnSaveProfile').addEventListener('click', () => {
            this.state.name = document.getElementById('inputName').value || "Agent";
            const avParts = document.getElementById('inputAvatarType').value.split('|');
            this.state.avatar = avParts[0];
            this.state.classTitle = avParts[1];
            this.state.outfit = avParts[2];
            this.saveState();
            this.renderAll();
            this.showToast("Profil zaktualizowany pomyślnie!");
        });

        // Skaner paragonów / Akcje
        document.getElementById('btnOpenScanner').addEventListener('click', async () => {
            const pic = await NativeBridge.takePicture();
            this.state.gold += 150;
            this.addFeedItem("Skaner", "Przetworzono paragon handlowy. +150 PLN");
            this.saveState();
            this.renderAll();
            this.showToast("Paragon zweryfikowany! +150 PLN");
        });

        // GPS Check-in
        document.getElementById('btnCheckIn').addEventListener('click', async () => {
            try {
                const pos = await NativeBridge.getCurrentPosition();
                this.state.gold += 300;
                this.addFeedItem("GPS", `Meldunek udany w lokacji: ${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}`);
                this.saveState();
                this.renderAll();
                this.showToast("Meldunek GPS zweryfikowany! +300 PLN");
            } catch (err) {
                this.showToast("Błąd GPS: " + err);
            }
        });

        document.getElementById('btnResetAccount').addEventListener('click', () => {
            if (confirm("Czy na pewno chcesz zresetować postać?")) {
                localStorage.removeItem('geoverse_state');
                location.reload();
            }
        });
    }

    initMap() {
        if (typeof L === 'undefined') return;
        this.map = L.map('map-view').setView([52.2297, 21.0122], 13);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{z}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        // Marker przykładowej strefy
        L.marker([52.2297, 21.0122]).addTo(this.map)
          .bindPopup('<b>Strefa Główna</b><br>Przejmij terytorium!');
    }

    addFeedItem(author, text) {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        this.state.feed.unshift({ time, author, text });
        if (this.state.feed.length > 20) this.state.feed.pop();
    }

    showToast(msg) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.style.background = 'var(--card-bg)';
        toast.style.border = '1px solid var(--accent-green)';
        toast.style.padding = '10px 15px';
        toast.style.borderRadius = '8px';
        toast.style.marginBottom = '8px';
        toast.style.fontSize = '0.75rem';
        toast.style.fontFamily = 'Inter';
        toast.innerText = msg;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    renderAll() {
        document.getElementById('statLvl').innerText = this.state.lvl;
        document.getElementById('statGold').innerText = this.state.gold;
        document.getElementById('statVouchers').innerText = this.state.vouchers;
        
        document.getElementById('profileNameDisplay').innerText = this.state.name;
        document.getElementById('profileClassDisplay').innerText = this.state.classTitle;
        document.getElementById('avatarDisplay').innerText = this.state.avatar;
        document.getElementById('currentOutfitLabel').innerText = `Aktywny skin: ${this.state.outfit}`;

        // Feed render
        const feedContainer = document.getElementById('portalFeed');
        if (feedContainer) {
            feedContainer.innerHTML = this.state.feed.map(f => `
                <div class="feed-item">
                    <div class="feed-header"><span>${f.author}</span><span>${f.time}</span></div>
                    <div class="feed-body">${f.text}</div>
                </div>
            `).join('');
        }

        // Housing slots
        const housingContainer = document.getElementById('housingGrid');
        if (housingContainer) {
            housingContainer.innerHTML = this.state.housing.map(h => `
                <div class="build-slot ${h.level > 0 ? 'active' : ''}">
                    <div style="font-size:1.2rem; margin-bottom:4px;">${h.level > 0 ? '🏢' : '➕'}</div>
                    <div style="font-size:0.55rem;">${h.name}</div>
                </div>
            `).join('');
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.app = new GeoVerseApp();
});
