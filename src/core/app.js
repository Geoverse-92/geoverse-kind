import { NativeBridge } from './native.js';
import { CloudSync } from './cloud.js';

class GeoVersePixelApp {
    constructor() {
        this.state = {
            lvl: 12,
            gold: 5800,
            vouchers: 18,
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
            quests: [
                { id: 1, title: "Sektorowa Infiltracja", desc: "Zamelduj się w najbliższym heksagonie za pomocą GPS.", reward: "400 PLN", done: false },
                { id: 2, title: "Przechwycenie Paragonu", desc: "Zeskanuj dowód transakcji partnerskiej w sklepie.", reward: "600 PLN + 3 Bony", done: false }
            ],
            feed: [
                { time: "14:00", author: "System", text: "Załadowano mistrzowski rdzeń izometryczny v3.5." }
            ]
        };

        this.cloud = new CloudSync();
        this.map = null;
        this.userMarker = null;
        this.init();
    }

    init() {
        this.loadState();
        this.initNavigation();
        this.initUI();
        this.initMap();
        this.renderAll();
        this.startPassiveIncome();
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
                    setTimeout(() => this.map.invalidateSize(), 250);
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
            this.showToast("[OK] Profil agenta zaktualizowany!");
        });

        document.getElementById('btnOpenScanner').addEventListener('click', async () => {
            await NativeBridge.takePicture();
            this.state.gold += 600;
            this.state.vouchers += 3;
            
            const q = this.state.quests.find(x => x.id === 2);
            if (q) q.done = true;

            this.addFeedItem("Sklep", "Zatwierdzono dowód zakupu u partnera. +600 PLN");
            this.saveState();
            this.renderAll();
            this.showToast("[LOOT] Paragon zweryfikowany pomyślnie!");
        });

        document.getElementById('btnCheckIn').addEventListener('click', async () => {
            try {
                const pos = await NativeBridge.getCurrentPosition();
                this.updateUserPositionOnMap(pos.coords.latitude, pos.coords.longitude);
                this.state.gold += 450;
                
                const q = this.state.quests.find(x => x.id === 1);
                if (q) q.done = true;

                this.addFeedItem("GPS", "Zajęto heksagon terenowy w świecie rzeczywistym.");
                this.saveState();
                this.renderAll();
                this.showToast("[MAP] Sektor zabezpieczony! +450 PLN");
            } catch (err) {
                this.state.gold += 350;
                this.showToast("[MAP] Zameldowano pomyślnie! +350 PLN");
                this.renderAll();
            }
        });

        document.getElementById('btnResetAccount').addEventListener('click', () => {
            if (confirm("Czy na pewno chcesz zresetować profil agenta do ustawień fabrycznych?")) {
                localStorage.removeItem('geoverse_pixel_state');
                location.reload();
            }
        });
    }

    initMap() {
        if (typeof L === 'undefined') return;
        const centerLat = 50.0266;
        const centerLng = 19.2334;

        this.map = L.map('map-view', { zoomControl: false }).setView([centerLat, centerLng], 15);
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
        }).addTo(this.map);

        const partners = [
            { name: "ZARA HUB", lat: 50.0280, lng: 19.2310, icon: "🧥", desc: "Hub modowy ZARA" },
            { name: "ROSSMANN ZONE", lat: 50.0250, lng: 19.2360, icon: "🧴", desc: "Strefa handlowa Rossmann" },
            { name: "NIKE POINT", lat: 50.0290, lng: 19.2370, icon: "👟", desc: "Arena sportowa Nike" }
        ];

        partners.forEach(p => {
            const customIcon = L.divIcon({
                className: 'custom-pixel-pin',
                html: `<div style="background:#0b1118; border:2px solid #00ffcc; color:#00ffcc; padding:4px 8px; font-size:0.6rem; font-family:'Courier New', monospace; font-weight:bold; box-shadow: 3px 3px 0px #000; text-align:center; white-space:nowrap;">${p.icon} ${p.name}</div>`,
                iconSize: [120, 32],
                iconAnchor: [60, 16]
            });

            L.marker([p.lat, p.lng], { icon: customIcon }).addTo(this.map).bindPopup(`<b>${p.name}</b><br>${p.desc}`);
        });
    }

    updateUserPositionOnMap(lat, lng) {
        if (!this.map) return;
        if (this.userMarker) {
            this.userMarker.setLatLng([lat, lng]);
        } else {
            const userIcon = L.divIcon({
                className: 'user-pin',
                html: `<div style="background:#ffcc00; border:2px solid #000; width:18px; height:18px; border-radius:50%; box-shadow: 0 0 12px #ffcc00;"></div>`,
                iconSize: [18, 18],
                iconAnchor: [9, 9]
            });
            this.userMarker = L.marker([lat, lng], { icon: userIcon }).addTo(this.map);
        }
        this.map.setView([lat, lng], 16);
    }

    startPassiveIncome() {
        setInterval(() => {
            const totalIncome = this.state.housing.reduce((acc, h) => acc + (h.level * 25), 0);
            if (totalIncome > 0) {
                this.state.gold += totalIncome;
                this.saveState();
                this.renderAll();
            }
        }, 60000);
    }

    addFeedItem(author, text) {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        this.state.feed.unshift({ time, author, text });
        if (this.state.feed.length > 25) this.state.feed.pop();
    }

    showToast(msg) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = 'pixel-toast';
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
        document.getElementById('avatarDisplay').innerHTML = `${this.state.head} <span style="font-size:1.8rem; margin-left:-10px;">${this.state.outfit}</span>`;
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
                    <div style="font-size:1.2rem; margin-bottom:4px;">${h.level > 0 ? '🏬' : '➕'}</div>
                    <div style="font-size:0.5rem; font-weight:bold;">${h.name}</div>
                    <div style="font-size:0.45rem; color:var(--accent-neon); margin-top:2px;">+${h.income} PLN/h</div>
                </div>
            `).join('');
        }

        const questsContainer = document.getElementById('questsList');
        if (questsContainer) {
            questsContainer.innerHTML = this.state.quests.map(q => `
                <div class="quest-item" style="opacity: ${q.done ? 0.65 : 1};">
                    <div class="quest-title">${q.done ? '[UKOŃCZONO] ' : ''}${q.title}</div>
                    <div class="quest-desc">${q.desc}</div>
                    <div style="font-size:0.58rem; color:var(--accent-neon);">Nagroda: ${q.reward}</div>
                </div>
            `).join('');
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.app = new GeoVersePixelApp();
});
