import { NativeBridge } from './native.js';
import { CloudSync } from './cloud.js';

class GeoVersePixelApp {
    constructor() {
        this.state = {
            lvl: 12,
            gold: 5400,
            vouchers: 15,
            name: "Agent_Rook",
            head: "🧢",
            outfit: "🧥",
            weapon: "🚲",
            addon: "🟢",
            voc: "Cyber Courier",
            housing: [
                { id: 1, name: "Zara Hub", level: 2, income: 200 },
                { id: 2, name: "Rossman Zone", level: 1, income: 100 },
                { id: 3, name: "Nike Point", level: 0, income: 0 }
            ],
            feed: [
                { time: "13:45", author: "System", text: "Zainicjalizowano izometryczny skaner miast Phygital." }
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
    }

    loadState() {
        const saved = localStorage.getItem('geoverse_pixel_state');
        if (saved) {
            try { this.state = { ...this.state, ...JSON.parse(saved) }; } catch (e) { console.error(e); }
        }
    }

    saveState() {
        localStorage.setItem('geoverse_pixel_state', JSON.stringify(this.state));
        this.cloud.syncUserData(this.state.name, this.state);
    }

    initNavigation() {
        document.querySelectorAll('nav button').forEach(btn => {
            btn.addEventListener('click', () => {
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
        document.getElementById('btnSaveProfile').addEventListener('click', () => {
            this.state.name = document.getElementById('inputName').value || "Agent_Rook";
            this.state.head = document.getElementById('selectHead').value;
            this.state.outfit = document.getElementById('selectOutfit').value;
            this.state.weapon = document.getElementById('selectWeapon').value;
            this.state.addon = document.getElementById('selectAddon').value;
            this.state.voc = document.getElementById('selectVoc').value;
            
            this.saveState();
            this.renderAll();
            this.showToast("[OK] Tożsamość agenta zaktualizowana!");
        });

        document.getElementById('btnOpenScanner').addEventListener('click', async () => {
            await NativeBridge.takePicture();
            this.state.gold += 350;
            this.addFeedItem("Sklep", "Zweryfikowano paragon partnerski (Zara/Rossmann). +350 PLN");
            this.saveState();
            this.renderAll();
            this.showToast("[LOOT] Zeskanowano dowód zakupu! +350 PLN");
        });

        document.getElementById('btnCheckIn').addEventListener('click', async () => {
            try {
                const pos = await NativeBridge.getCurrentPosition();
                this.state.gold += 600;
                this.addFeedItem("GPS", `Zajęto heksagon: ${pos.lat.toFixed(3)}, ${pos.lng.toFixed(3)}`);
                this.saveState();
                this.renderAll();
                this.showToast("[MAP] Obszar zabezpieczony! +600 PLN");
            } catch (err) {
                this.showToast("[ERR] Błąd lokalizacji GPS: " + err);
            }
        });

        document.getElementById('btnResetAccount').addEventListener('click', () => {
            if (confirm("Zresetować profil i postać do ustawień fabrycznych?")) {
                localStorage.removeItem('geoverse_pixel_state');
                location.reload();
            }
        });
    }

    initMap() {
        if (typeof L === 'undefined') return;
        this.map = L.map('map-view', { zoomControl: false }).setView([50.0266, 19.2334], 14);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{z}.png', {
            maxZoom: 19
        }).addTo(this.map);

        L.circleMarker([50.0266, 19.2334], {
            radius: 12,
            color: '#00ffcc',
            fillColor: '#00ffcc',
            fillOpacity: 0.6
        }).addTo(this.map).bindPopup('<b>[GEOVERSE] Strefa Heksagonalna Partnera</b>');
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
        toast.style.background = '#161b22';
        toast.style.border = '2px solid var(--accent-neon)';
        toast.style.color = '#00ffcc';
        toast.style.padding = '8px 12px';
        toast.style.marginBottom = '6px';
        toast.style.fontSize = '0.65rem';
        toast.style.fontFamily = 'Courier New, monospace';
        toast.style.boxShadow = '3px 3px 0px #000';
        toast.innerText = msg;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3500);
    }

    renderAll() {
        document.getElementById('statLvl').innerText = this.state.lvl;
        document.getElementById('statGold').innerText = this.state.gold;
        document.getElementById('statVouchers').innerText = this.state.vouchers;
        
        document.getElementById('profileNameDisplay').innerText = this.state.name;
        document.getElementById('profileClassDisplay').innerText = `[${this.state.voc}]`;
        document.getElementById('avatarDisplay').innerHTML = `${this.state.head} <span style="font-size:1.8rem; margin-left:-12px;">${this.state.outfit}</span>`;
        document.getElementById('currentEquipmentLabel').innerText = `Sprzęt: ${this.state.weapon} | Aura: ${this.state.addon}`;

        const feedContainer = document.getElementById('portalFeed');
        if (feedContainer) {
            feedContainer.innerHTML = this.state.feed.map(f => `
                <div class="feed-item">
                    <div class="feed-header"><span>${f.author}</span><span>${f.time}</span></div>
                    <div class="feed-body">${f.text}</div>
                </div>
            `).join('');
        }

        const housingContainer = document.getElementById('housingGrid');
        if (housingContainer) {
            housingContainer.innerHTML = this.state.housing.map(h => `
                <div class="build-slot ${h.level > 0 ? 'active' : ''}">
                    <div style="font-size:1.1rem; margin-bottom:2px;">${h.level > 0 ? '🏬' : '➕'}</div>
                    <div style="font-size:0.5rem; font-weight:bold;">${h.name}</div>
                    <div style="font-size:0.45rem; color:var(--accent-neon);">+${h.income} PLN/h</div>
                </div>
            `).join('');
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.app = new GeoVersePixelApp();
});
