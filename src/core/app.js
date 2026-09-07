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
                { id: 3, name: "Nike Point", level: 1, income: 150 }
            ],
            feed: [
                { time: "13:45", author: "System", text: "Załadowano izometryczną mapę sektorów." }
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
                this.addFeedItem("GPS", `Zajęto heksagon miejski.`);
                this.saveState();
                this.renderAll();
                this.showToast("[MAP] Obszar zabezpieczony! +600 PLN");
            } catch (err) {
                this.state.gold += 500;
                this.showToast("[MAP] Zameldowano pomyślnie! +500 PLN");
                this.renderAll();
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
        // Współrzędne centrum sektora
        const centerLat = 50.0266;
        const centerLng = 19.2334;

        this.map = L.map('map-view', { zoomControl: false }).setView([centerLat, centerLng], 15);
        
        // Stylowane kafelki mapy pasujące do mrocznego klimatu retro
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
        }).addTo(this.map);

        // Dodanie interaktywnych punktów partnerów w stylu pinezek z grafik
        const partners = [
            { name: "ZARA HUB", lat: 50.0280, lng: 19.2310, icon: "🧥", desc: "Sklep partnerski ZARA - zrealizuj quest zakupowy" },
            { name: "ROSSMANN ZONE", lat: 50.0250, lng: 19.2360, icon: "🧴", desc: "Strefa Beauty & Health Rossmann" },
            { name: "NIKE POINT", lat: 50.0290, lng: 19.2370, icon: "👟", desc: "Arena Sportowa Nike" }
        ];

        partners.forEach(p => {
            const customIcon = L.divIcon({
                className: 'custom-pixel-pin',
                html: `<div style="background:#0d1520; border:2px solid #00ffcc; color:#00ffcc; padding:4px 8px; font-size:0.6rem; font-family:'Courier New', monospace; font-weight:bold; box-shadow: 2px 2px 0px #000; text-align:center;">${p.icon} ${p.name}</div>`,
                iconSize: [110, 30],
                iconAnchor: [55, 15]
            });

            L.marker([p.lat, p.lng], { icon: customIcon })
                .addTo(this.map)
                .bindPopup(`<b>${p.name}</b><br>${p.desc}`);
        });
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
        toast.style.background = '#0d1520';
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
        document.getElementById('avatarDisplay').innerHTML = `${this.state.head} <span style="font-size:1.6rem; margin-left:-10px;">${this.state.outfit}</span>`;
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
                    <div style="font-size:1rem; margin-bottom:2px;">${h.level > 0 ? '🏬' : '➕'}</div>
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
