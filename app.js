const STORAGE_KEY = 'geoverse_ultimate_v2';
const defaultState = {
    player: { name: "Nowy Gracz", icon: "🧑‍💻", className: "Cyber Tech", equipped: null, gold: 850, vouchers: 2, lvl: 1, energy: 100, typeValue: "👨‍💻|Cyber Tech|💻" },
    inventory: [{ name: "Koszulka Biedronka", icon: "👕" }, { name: "Trampki Nike", icon: "👟" }],
    housing: [{ id: 1, name: "Sklep Partner", icon: "🏪" }, { id: 2, name: "Wolne", icon: "➕" }, { id: 3, name: "Wolne", icon: "➕" }],
    feed: [{ author: "SYSTEM", tag: "INFO", text: "Zainicjowano ekosystem Phygital zintegrowany z siecią sklepów." }],
    quests: [{ id: 1, title: "Odwiedź Galerię Handlową", desc: "Zamelduj się w strefie partnerskiej.", rewardGold: 300 }]
};

let appState = JSON.parse(localStorage.getItem(STORAGE_KEY)) || JSON.parse(JSON.stringify(defaultState));

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    updateHUD();
}

function resetAccount() {
    if(confirm("Czy na pewno chcesz zresetować postęp?")) {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
    }
}

function showToast(message, type = 'info', icon = 'ℹ️') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span style="font-size: 1.2rem;">${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
}

let currentModalCallback = null;
function openModal(title, placeholder, callback) {
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalInput').value = '';
    document.getElementById('modalInput').placeholder = placeholder;
    document.getElementById('modal-overlay').classList.add('show');
    document.getElementById('modalInput').focus();
    currentModalCallback = callback;
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('show');
    currentModalCallback = null;
}

document.getElementById('modalConfirmBtn').addEventListener('click', () => {
    const val = document.getElementById('modalInput').value.trim();
    if (val && currentModalCallback) {
        currentModalCallback(val);
        closeModal();
    } else {
        showToast("Wprowadź wartość!", "error", "❌");
    }
});

function initApp() {
    updateHUD();
    renderProfile();
    renderFeed();
    renderInventory();
    renderHousing();
    renderQuests();
}

function updateHUD() {
    document.getElementById('statLvl').innerText = appState.player.lvl;
    document.getElementById('statGold').innerText = appState.player.gold;
    document.getElementById('statVouchers').innerText = appState.player.vouchers;
    document.getElementById('currentOutfitLabel').innerText = `Aktywny set: ${appState.player.equipped || "Brak"}`;
}

function renderFeed() {
    const container = document.getElementById('portalFeed');
    container.innerHTML = '';
    [...appState.feed].reverse().forEach(post => {
        container.innerHTML += `<div class="feed-item"><div class="feed-header"><span>${post.author}</span> <span>[${post.tag}]</span></div><p class="feed-body">${post.text}</p></div>`;
    });
}

function openPostModal() {
    openModal("NOWY WPIS", "Podziel się osiągnięciem...", (text) => {
        appState.feed.push({ author: appState.player.name.toUpperCase(), tag: "GLOBAL", text });
        saveState();
        renderFeed();
        showToast("Wpis opublikowany w sieci!", "info", "✅");
    });
}

function updateAvatarPreview() {
    const val = document.getElementById('inputAvatarType').value.split('|');
    document.getElementById('avatarDisplay').innerText = val[0];
    document.getElementById('profileClassDisplay').innerText = val[1];
}

function renderProfile() {
    document.getElementById('inputName').value = appState.player.name;
    document.getElementById('inputAvatarType').value = appState.player.typeValue;
    document.getElementById('profileNameDisplay').innerText = appState.player.name;
    updateAvatarPreview();
}

function saveProfile() {
    const name = document.getElementById('inputName').value.trim();
    if(!name) return showToast("Nick nie może być pusty!", "error", "❌");
    const val = document.getElementById('inputAvatarType').value.split('|');
    appState.player.name = name;
    appState.player.icon = val[0];
    appState.player.className = val[1];
    appState.player.typeValue = document.getElementById('inputAvatarType').value;
    saveState();
    showToast("Zapisano profil gracza!", "info", "🧬");
}

function triggerAiAdvisor() {
    const tips = [
        "AI Asystent: W pobliżu Twojej lokalizacji sklep MediaExpert oferuje +50% złota za check-in!",
        "AI Asystent: Twoje statysty gildii rosną. Zaproś znajomych, by przejąć całą dzielnicę!",
        "AI Asystent: Zeskanuj dzisiejszy paragon spożywczy, aby zdobyć legendarne wyposażenie!"
    ];
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    showToast(randomTip, "warning", "🤖");
}

function renderInventory() {
    const container = document.getElementById('inventoryContainer');
    container.innerHTML = "";
    appState.inventory.forEach(item => {
        const isEquipped = (appState.player.equipped === item.name);
        container.innerHTML += `<div class="item-card ${isEquipped ? 'equipped' : ''}" onclick="equipItem('${item.name}')"><div style="font-size: 2rem; margin-bottom: 5px;">${item.icon}</div><h4>${item.name}</h4><p style="font-size:0.55rem; color:${isEquipped ? 'var(--accent-green)' : '#888'}; margin:0;">${isEquipped ? '★ ZAŁOŻONE' : 'Załóż'}</p></div>`;
    });
}

function equipItem(itemName) {
    appState.player.equipped = itemName;
    saveState();
    renderInventory();
    showToast(`Wyposażono: ${itemName}`, "info", "👕");
}

function openScannerModal() {
    openModal("SKANER PARAGONÓW", "Wpisz kod z rachunku (np. Biedronka-123)", (code) => {
        appState.inventory.push({ name: code, icon: "🧾" });
        appState.player.gold += 150;
        saveState();
        renderInventory();
        showToast(`Zatwierdzono paragon! +150 PLN`, "warning", "✨");
    });
}

function renderHousing() {
    const container = document.getElementById('housingGrid');
    container.innerHTML = "";
    appState.housing.forEach((slot, index) => {
        const isActive = slot.name !== "Wolne";
        container.innerHTML += `<div class="build-slot ${isActive ? 'active' : ''}" onclick="openBuildModal(${index})"><div>${slot.icon}</div><span style="font-size:0.45rem; font-family:'Press Start 2P'; margin-top:8px; color:${isActive ? 'var(--accent-gold)' : 'var(--text-muted)'}">${slot.name}</span></div>`;
    });
}

function openBuildModal(index) {
    openModal("STREFA PARTNERSKA", "Nazwa punktu handlowego", (itemName) => {
        if(appState.player.gold < 200) return showToast("Za mało złota (wymagane 200)!", "error", "💰");
        appState.player.gold -= 200;
        appState.housing[index] = { name: itemName, icon: "🏢" };
        saveState();
        renderHousing();
        showToast(`Przejęto strefę: ${itemName}`, "info", "🏗️");
    });
}

function craftMaterials() {
    if(appState.player.gold < 100) return showToast("Brak funduszy na inwestycję!", "error", "❌");
    appState.player.gold += 250;
    saveState();
    showToast("Wygenerowano zysk pasywny z gildii! +250 PLN", "info", "♻️");
}

function renderQuests() {
    const container = document.getElementById('questList');
    container.innerHTML = "";
    appState.quests.forEach(q => {
        container.innerHTML += `<div class="quest-item"><h4>${q.title}</h4><p>${q.desc}</p><p style="font-size: 0.65rem; color:var(--accent-green); margin-bottom: 10px;">Nagroda: 🪙 ${q.rewardGold} PLN</p><button class="btn btn-sm" onclick="completeQuest(${q.id})">ODBIERZ NAGRODĘ</button></div>`;
    });
}

function openQuestModal() {
    openModal("NOWE ZADANIE", "Tytuł misji terenowej", (title) => {
        appState.quests.push({ id: Date.now(), title, desc: "Misja sponsorowana przez markę.", rewardGold: 200 });
        saveState();
        renderQuests();
        showToast("Dodano misję do giełdy", "info", "📜");
    });
}

function completeQuest(id) {
    const idx = appState.quests.findIndex(q => q.id === id);
    if(idx > -1) {
        appState.player.gold += appState.quests[idx].rewardGold;
        appState.quests.splice(idx, 1);
        saveState();
        renderQuests();
        showToast("Ukończono misję!", "warning", "🏆");
    }
}

function openVoucherShop() {
    if(appState.player.gold < 500) return showToast("Potrzebujesz min. 500 PLN na bon!", "error", "❌");
    appState.player.gold -= 500;
    appState.player.vouchers += 1;
    saveState();
    showToast("Wymieniono złoto na bon podarunkowy do partnerskiej sieci sklepów!", "warning", "🎁");
}

let map = null, userMarker = null, mapInitialized = false;

function switchScreen(screenId, btnElement) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    if(btnElement) btnElement.classList.add('active');

    if(screenId === 'screen-map') {
        setTimeout(() => {
            if (!mapInitialized) {
                initLeafletMap();
                mapInitialized = true;
            } else {
                map.invalidateSize();
            }
        }, 100);
    }
}

function initLeafletMap() {
    const statusEl = document.getElementById('gpsStatus');
    const defaultPos = [51.7592, 19.4559];
    map = L.map('map-view', { zoomControl: false, attributionControl: false }).setView(defaultPos, 14);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);

    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(pos => {
            statusEl.innerText = "GPS AKTYWNY 🟢";
            updatePlayerMarker(pos.coords.latitude, pos.coords.longitude);
        }, () => {
            statusEl.innerText = "GPS DEMO 🟡";
            updatePlayerMarker(defaultPos[0], defaultPos[1]);
        }, { enableHighAccuracy: true });
    } else {
        updatePlayerMarker(defaultPos[0], defaultPos[1]);
    }

    L.marker([51.7620, 19.4570]).addTo(map).bindPopup("<b>Sklep Partner: Biedronka</b><br>Zeskanuj paragon po zakupach!");
    L.marker([51.7550, 19.4500]).addTo(map).bindPopup("<b>Sklep Partner: MediaExpert</b><br>Odbierz unikalny item AR!");
}

function updatePlayerMarker(lat, lng) {
    if (!userMarker) {
        const icon = L.divIcon({ html: `<div style="background:#0e111a; border:2px solid #00ffcc; border-radius:50%; width:40px; height:40px; display:flex; align-items:center; justify-content:center; font-size:20px;">${appState.player.icon}</div>`, iconSize: [40, 40], iconAnchor: [20, 20] });
        userMarker = L.marker([lat, lng], { icon }).addTo(map);
        map.setView([lat, lng], 15);
    } else {
        userMarker.setLatLng([lat, lng]);
    }
}

function claimZoneReward() {
    appState.player.gold += 100;
    saveState();
    showToast("Dokonano check-inu w strefie partnerskiej! +100 PLN", "info", "📍");
}

window.onload = initApp;
