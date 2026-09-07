import { NativeBridge } from './native.js';
import { CloudSync } from './cloud.js';

class GeoVerseTibiaApp {
    constructor() {
        this.state = {
            lvl: 8,
            gold: 3450,
            vouchers: 12,
            name: "Knight Rook",
            head: "🧑‍🦰",
            outfit: "🛡️",
            weapon: "⚔️",
            addon: "✨",
            voc: "Knight",
            housing: [
                { id: 1, name: "Depot Thais", level: 2, income: 150 },
                { id: 2, name: "Domek Carlin", level: 1, income: 75 },
                { id: 3, name: "Puste Guildhall", level: 0, income: 0 }
            ],
            feed: [
                { time: "13:00", author: "Oracle", text: "Witaj w świecie Phygital Tibia. Wybierz swoją ścieżkę!" }
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
        const saved = localStorage.getItem('geoverse_tibia_state');
        if (saved) {
            try { this.state = { ...this.state, ...JSON.parse(saved) }; } catch (e) { console.error(e); }
        }
    }

    saveState() {
        localStorage.setItem('geoverse_tibia_state', JSON.stringify(this.state));
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
            this.state.name = document.getElementById('inputName').value || "Knight Rook";
            this.state.head = document.getElementById('selectHead').value;
            this.state.outfit = document.getElementById('selectOutfit').value;
            this.state.weapon = document.getElementById('selectWeapon').value;
            this.state.addon = document.getElementById('selectAddon').value;
            this.state.voc = document.getElementById('selectVoc').value;
            
            this.saveState();
            this.renderAll();
            this.showToast("[CHAR] Postać została zaktualizowana pomyślnie!");
        });

        document.getElementById('btnOpenScanner').addEventListener('click', async () => {
            await NativeBridge.takePicture();
            this.state.gold += 300;
            this.addFeedItem("Loot", "Zlootowano rzadki przedmiot z paragonu! +300 GP");
            this.saveState();
            this.renderAll();
            this.showToast("[LOOT] Paragon zweryfikowany! +300 GP");
        });

        document.getElementById('btnCheckIn').addEventListener('click', async () => {
            try {
                const pos = await NativeBridge.getCurrentPosition();
                this.state.gold += 500;
                this.addFeedItem("Spawn", `Oczyszczono respawn GPS: ${pos.lat.toFixed(3)}, ${pos.lng.toFixed(3)}`);
                this.saveState();
                this.renderAll();
                this.showToast("[QUEST] Teren zabezpieczony! +500 GP");
            } catch (err) {
                this.showToast("[ERROR] Brak sygnału z orka: " + err);
            }
        });

        document.getElementById('btnResetAccount').addEventListener('click', () => {
            if (confirm("Czy na pewno chcesz wykonać Temple Teleport (Reset)?")) {
                localStorage.removeItem('geoverse_tibia_state');
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
            radius: 10,
            color: '#ffcc00',
            fillColor: '#ff0000',
            fillOpacity: 0.8
        }).addTo(this.map).bindPopup('<b>[THAIS] Główny Bank & Depot</b>');
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
        toast.style.background = '#181820';
        toast.style.border = '2px solid var(--accent-gold)';
        toast.style.color = '#ffcc00';
        toast.style.padding = '8px 12px';
        toast.style.marginBottom = '6px';
        toast.style.fontSize = '0.7rem';
        toast.style.fontFamily = 'Courier New', monospace;
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
        document.getElementById('avatarDisplay').innerHTML = `${this.state.head} <span style="font-size:2rem; margin-left:-15px;">${this.state.outfit}</span>`;
        document.getElementById('currentEquipmentLabel').innerText = `Eq: ${this.state.weapon} | Addon: ${this.state.addon}`;

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
                    <div style="font-size:1.2rem; margin-bottom:2px;">${h.level > 0 ? '🏰' : '⛺'}</div>
                    <div style="font-size:0.55rem; font-weight:bold;">${h.name}</div>
                    <div style="font-size:0.45rem; color:#00ff66;">+${h.income} GP/h</div>
                </div>
            `).join('');
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.app = new GeoVerseTibiaApp();
});
