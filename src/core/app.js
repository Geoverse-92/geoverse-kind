import { AppState } from './state.js';
import { SyncEngine } from './sync.js';
import { initMapModule } from '../modules/map.js';
import { processReceipt } from '../modules/scanner.js';
import { AREngine } from '../modules/ar.js';
import { GuildWars } from '../modules/guild-wars.js';

let currentModalCallback = null;

function showToast(message, type = 'info', icon = 'ℹ️') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span style="font-size: 1.2rem;">${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
}

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

function updateHUD(state) {
    document.getElementById('statLvl').innerText = state.player.lvl;
    document.getElementById('statGold').innerText = state.player.gold;
    document.getElementById('statVouchers').innerText = state.player.vouchers;
    document.getElementById('currentOutfitLabel').innerText = `Aktywny set: ${state.player.equipped || "Brak"}`;
}

function renderAll() {
    const state = AppState.load();
    updateHUD(state);

    // Feed
    const feedContainer = document.getElementById('portalFeed');
    feedContainer.innerHTML = '';
    [...state.feed].reverse().forEach(post => {
        feedContainer.innerHTML += `<div class="feed-item"><div class="feed-header"><span>${post.author}</span> <span>[${post.tag}]</span></div><p class="feed-body">${post.text}</p></div>`;
    });

    // Profile
    document.getElementById('inputName').value = state.player.name;
    document.getElementById('inputAvatarType').value = state.player.typeValue;
    document.getElementById('profileNameDisplay').innerText = state.player.name;
    const parts = state.player.typeValue.split('|');
    document.getElementById('avatarDisplay').innerText = parts[0];
    document.getElementById('profileClassDisplay').innerText = parts[1];

    // Inventory
    const invContainer = document.getElementById('inventoryContainer');
    invContainer.innerHTML = '';
    state.inventory.forEach(item => {
        const isEq = state.player.equipped === item.name;
        invContainer.innerHTML += `<div class="item-card ${isEq ? 'equipped' : ''}" data-name="${item.name}"><div style="font-size:2rem; margin-bottom:5px;">${item.icon}</div><h4>${item.name}</h4><p style="font-size:0.55rem; color:${isEq ? 'var(--accent-green)' : '#888'}; margin:0;">${isEq ? '★ ZAŁOŻONE' : 'Załóż'}</p></div>`;
    });

    // Housing
    const housingContainer = document.getElementById('housingGrid');
    housingContainer.innerHTML = '';
    state.housing.forEach((slot, index) => {
        const isActive = !slot.name.includes("Wolne");
        housingContainer.innerHTML += `<div class="build-slot ${isActive ? 'active' : ''}" data-index="${index}"><div>${slot.icon}</div><span style="font-size:0.45rem; font-family:'Press Start 2P'; margin-top:8px; color:${isActive ? 'var(--accent-gold)' : 'var(--text-muted)'}">${slot.name}</span></div>`;
    });

    // Quests
    const questContainer = document.getElementById('questList');
    questContainer.innerHTML = '';
    state.quests.forEach(q => {
        questContainer.innerHTML += `<div class="quest-item"><h4>${q.title}</h4><p>${q.desc}</p><p style="font-size: 0.65rem; color:var(--accent-green); margin-bottom: 10px;">Nagroda: 🪙 ${q.rewardGold} PLN</p><button class="btn btn-sm btn-complete-quest" data-id="${q.id}">ODBIERZ NAGRODĘ</button></div>`;
    });
}

window.addEventListener('DOMContentLoaded', () => {
    SyncEngine.init();
    renderAll();

    // Nav switching
    document.querySelectorAll('nav button').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-target');
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
            document.getElementById(target).classList.add('active');
            btn.classList.add('active');

            if (target === 'screen-map') {
                initMapModule('map-view');
            }
        });
    });

    // Modals bindings
    document.getElementById('modalCancelBtn').addEventListener('click', closeModal);
    document.getElementById('modalConfirmBtn').addEventListener('click', () => {
        const val = document.getElementById('modalInput').value.trim();
        if (val && currentModalCallback) {
            currentModalCallback(val);
            closeModal();
        } else {
            showToast("Wprowadź wartość!", "error", "❌");
        }
    });

    // Actions
    document.getElementById('btnAddPost').addEventListener('click', () => {
        openModal("NOWY WPIS", "Podziel się osiągnięciem...", (text) => {
            const state = AppState.load();
            state.feed.push({ author: state.player.name.toUpperCase(), tag: "GLOBAL", text });
            AppState.save(state);
            SyncEngine.dispatchAction('NEW_POST', { text });
            renderAll();
            showToast("Wpis opublikowany w kronice!", "info", "✅");
        });
    });

    document.getElementById('btnSaveProfile').addEventListener('click', () => {
        const state = AppState.load();
        const name = document.getElementById('inputName').value.trim();
        if(!name) return showToast("Nick nie może być pusty!", "error", "❌");
        const val = document.getElementById('inputAvatarType').value;
        const parts = val.split('|');
        state.player.name = name;
        state.player.icon = parts[0];
        state.player.className = parts[1];
        state.player.typeValue = val;
        AppState.save(state);
        SyncEngine.dispatchAction('UPDATE_PROFILE', state.player);
        renderAll();
        showToast("Zapisano profil agenta!", "info", "🧬");
    });

    document.getElementById('btnAiAdvisor').addEventListener('click', () => {
        const tips = [
            "AI: Sklepy w Twojej okolicy oferują +50% złota za meldunek GPS!",
            "AI: Przejmij strefę handlową w zakładce Gildia, by czerpać pasywne zyski.",
            "AI: Skanuj paragony codziennie, aby zdobywać rzadkie skiny do szafy!"
        ];
        showToast(tips[Math.floor(Math.random() * tips.length)], "warning", "🤖");
    });

    document.getElementById('btnResetAccount').addEventListener('click', () => {
        if(confirm("Czy na pewno chcesz zresetować postać?")) {
            localStorage.clear();
            location.reload();
        }
    });

    document.getElementById('btnOpenScanner').addEventListener('click', () => {
        openModal("SKANER PARAGONÓW", "Nazwa sklepu / Kod (np. Biedronka-09)", (code) => {
            processReceipt(code);
            renderAll();
            showToast("Paragon zweryfikowany! +200 PLN", "warning", "✨");
        });
    });

    document.getElementById('btnOpenAR').addEventListener('click', () => {
        AREngine.initARScanner('ar-container', (reward) => {
            const state = AppState.load();
            state.inventory.push({ name: reward.name, icon: reward.icon });
            state.player.gold += reward.bonus;
            AppState.save(state);
            renderAll();
            showToast(`Odebrano nagrodę AR: +${reward.bonus} PLN!`, "warning", "💎");
        });
    });

    document.getElementById('inventoryContainer').addEventListener('click', (e) => {
        const card = e.target.closest('.item-card');
        if(!card) return;
        const itemName = card.getAttribute('data-name');
        const state = AppState.load();
        state.player.equipped = itemName;
        AppState.save(state);
        renderAll();
        showToast(`Wyposażono set: ${itemName}`, "info", "👕");
    });

    document.getElementById('btnGuildWar').addEventListener('click', () => {
        const result = GuildWars.resolveTerritoryConquest(1);
        if (result.success) {
            renderAll();
            showToast(`Wygrano bitwę o strefę! Nagroda: +${result.reward} PLN`, "warning", "👑");
        } else {
            showToast(`Przegrano potyczkę. ${result.reason}`, "error", "⚔️");
        }
    });

    document.getElementById('housingGrid').addEventListener('click', (e) => {
        const slot = e.target.closest('.build-slot');
        if(!slot) return;
        const index = slot.getAttribute('data-index');
        openModal("ZARZĄDZANIE TERYTORIUM", "Nazwa punktu handlowego", (itemName) => {
            const state = AppState.load();
            if(state.player.gold < 300) return showToast("Wymagane min. 300 PLN!", "error", "💰");
            state.player.gold -= 300;
            state.housing[index] = { id: Date.now(), name: itemName, icon: "🏢" };
            AppState.save(state);
            renderAll();
            showToast(`Przejęto strefę handlową: ${itemName}`, "info", "🏗️");
        });
    });

    document.getElementById('btnCraft').addEventListener('click', () => {
        const state = AppState.load();
        state.player.gold += 350;
        AppState.save(state);
        renderAll();
        showToast("Pobrano zysk pasywny z gildii! +350 PLN", "info", "♻️");
    });

    document.getElementById('questList').addEventListener('click', (e) => {
        if(!e.target.classList.contains('btn-complete-quest')) return;
        const id = Number(e.target.getAttribute('data-id'));
        const state = AppState.load();
        const idx = state.quests.findIndex(q => q.id === id);
        if(idx > -1) {
            state.player.gold += state.quests[idx].rewardGold;
            state.quests.splice(idx, 1);
            AppState.save(state);
            renderAll();
            showToast("Misja ukończona pomyślnie!", "warning", "🏆");
        }
    });

    document.getElementById('btnAddQuest').addEventListener('click', () => {
        openModal("NOWE ZLECENIE", "Tytuł misji terenowej", (title) => {
            const state = AppState.load();
            state.quests.push({ id: Date.now(), title, desc: "Misja sponsorowana przez markę partnerską.", rewardGold: 250 });
            AppState.save(state);
            renderAll();
            showToast("Dodano nowe zlecenie do giełdy", "info", "📜");
        });
    });

    document.getElementById('btnVoucherShop').addEventListener('click', () => {
        const state = AppState.load();
        if(state.player.gold < 600) return showToast("Potrzebujesz min. 600 PLN złota!", "error", "❌");
        state.player.gold -= 600;
        state.player.vouchers += 1;
        AppState.save(state);
        renderAll();
        showToast("Wymieniono walutę na bon podarunkowy!", "warning", "🎁");
    });

    document.getElementById('btnCheckIn').addEventListener('click', () => {
        const state = AppState.load();
        state.player.gold += 150;
        AppState.save(state);
        renderAll();
        showToast("Zameldułeś się w strefie partnerskiej! +150 PLN", "info", "📍");
    });

    window.addEventListener('stateChanged', () => {
        renderAll();
    });
});
