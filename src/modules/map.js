import { AppState } from '../core/state.js';

let map = null, userMarker = null, mapInitialized = false;

export function initMapModule(containerId) {
    const state = AppState.load();
    const statusEl = document.getElementById('gpsStatus');
    const defaultPos = [51.7592, 19.4559];

    if (!mapInitialized) {
        map = L.map(containerId, { zoomControl: false, attributionControl: false }).setView(defaultPos, 14);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);

        if (navigator.geolocation) {
            navigator.geolocation.watchPosition(pos => {
                statusEl.innerText = "GPS AKTYWNY 🟢";
                updateMarker(pos.coords.latitude, pos.coords.longitude, state.player.icon);
            }, () => {
                statusEl.innerText = "GPS DEMO 🟡";
                updateMarker(defaultPos[0], defaultPos[1], state.player.icon);
            }, { enableHighAccuracy: true });
        } else {
            updateMarker(defaultPos[0], defaultPos[1], state.player.icon);
        }

        L.marker([51.7620, 19.4570]).addTo(map).bindPopup("<b>Sklep Partner: Biedronka</b><br>Zeskanuj paragon po zakupach!");
        L.marker([51.7550, 19.4500]).addTo(map).bindPopup("<b>Sklep Partner: MediaExpert</b><br>Odbierz unikalny item AR!");
        mapInitialized = true;
    } else {
        setTimeout(() => map.invalidateSize(), 100);
    }
}

function updateMarker(lat, lng, iconChar) {
    if (!userMarker) {
        const icon = L.divIcon({ html: `<div style="background:#0e111a; border:2px solid #00ffcc; border-radius:50%; width:40px; height:40px; display:flex; align-items:center; justify-content:center; font-size:20px;">${iconChar}</div>`, iconSize: [40, 40], iconAnchor: [20, 20] });
        userMarker = L.marker([lat, lng], { icon }).addTo(map);
        map.setView([lat, lng], 15);
    } else {
        userMarker.setLatLng([lat, lng]);
    }
}
