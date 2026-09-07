import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { 
  Compass, User, Users, ShoppingBag, Heart, 
  MessageSquare, FileText, Tag, Shield, Sparkles, MapPin, Plus, Send 
} from 'lucide-react';

// Ikony pikselowe dla mapy
const createPixelIcon = (emoji, isBrand = false) => {
  return L.divIcon({
    className: isBrand ? 'pixel-brand-marker' : 'pixel-avatar-marker',
    html: `<div>${emoji}</div>`
  });
};

export default function App() {
  const [activeTab, setActiveTab] = useState('map');
  const [socialSubTab, setSocialSubTab] = useState('soulmates');
  
  // Lokalizacja GPS użytkownika
  const [position, setPosition] = useState([52.2297, 21.0122]);
  const [gpsActive, setGpsActive] = useState(false);

  // Profil Postaci Użytkownika (Sims / Tibia Style)
  const [player, setPlayer] = useState({
    name: "PixelHero",
    sprite: "🧙‍♂️",
    classType: "Cyber Mag",
    level: 15,
    gold: 2450,
    gems: 35,
    bio: "Szukam ekipy na rajd po promocje w centrum!",
    hobbies: ["Retro Gaming", "Kawa", "Programowanie"],
    relationshipStatus: "Wolny"
  });

  // Punkty sklepów/marek na mapie
  const [brandLocations] = useState([
    { id: 1, name: "Zabka Quest", pos: [52.2310, 21.0150], icon: "🏪", offer: "-20% na Hot-Dog za 50 Golda", reward: "+100 EXP" },
    { id: 2, name: "Cyber Cafe & Board Games", pos: [52.2280, 21.0100], icon: "☕", offer: "Darmowy napój przy wejściu", reward: "+200 EXP" },
    { id: 3, name: "Nike Sneaker Spot", pos: [52.2325, 21.0080], icon: "👟", offer: "Unikalna skórka butów do awatara", reward: "+1 Limitowany Skin" }
  ]);

  // Moduł Społecznościowy - Bratnie Dusze (Matchmaking)
  const [soulmates] = useState([
    { id: 1, name: "NeonQueen", sprite: "🧝‍♀️", level: 18, hobbies: ["Kawa", "Anime", "Muzyka Synth"], match: "94%" },
    { id: 2, name: "RetroGamer99", sprite: "🥷", level: 12, hobbies: ["Retro Gaming", "Programowanie"], match: "88%" }
  ]);

  // Grupy i Kluby
  const [groups, setGroups] = useState([
    { id: 1, title: "Lokalni Łowcy Okazji", members: 142, desc: "Dzielimy się kodami rabatowymi z okolicy." },
    { id: 2, title: "Pixel Art & Devs", members: 89, desc: "Sztuka pikselowa i tworzenie gier 2D." }
  ]);

  // Blogi & Forum
  const [posts, setPosts] = useState([
    { id: 1, author: "System", title: "Witaj w GeoVerse MMORPG!", content: "Eksploruj mapę, wykonuj questy sklepów i szukaj znajomych w okolicy.", likes: 45 },
    { id: 2, author: "NeonQueen", title: "Najlepsze kawiarnie w sektorze centralnym", content: "Oto lista miejsc, gdzie dostaniecie darmowy boost do energii za zrealizowanie bonu.", likes: 12 }
  ]);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");

  // Śledzenie geolokalizacji w czasie rzeczywistym
  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setPosition([pos.coords.latitude, pos.coords.longitude]);
          setGpsActive(true);
        },
        (err) => {
          console.warn("Brak GPS, używam pozycji domyślnej:", err.message);
          setGpsActive(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  // Dodawanie wpisu na blogu/forum
  const handleAddPost = (e) => {
    e.preventDefault();
    if (!newPostTitle || !newPostContent) return;
    setPosts([
      { id: Date.now(), author: player.name, title: newPostTitle, content: newPostContent, likes: 0 },
      ...posts
    ]);
    setNewPostTitle("");
    setNewPostContent("");
  };

  return (
    <div className="flex justify-center items-center h-screen bg-black p-0 md:p-2">
      <div className="w-full max-w-md h-full md:h-[900px] bg-[#0d0d1a] border-4 border-[#3a1a5a] flex flex-col justify-between relative overflow-hidden shadow-2xl">
        
        {/* ================= BAR STATYSTYK AVATARA ================= */}
        <header className="bg-[#121224] border-b-2 border-[#3a1a5a] p-2 flex justify-between items-center text-[8px] z-10">
          <div className="flex items-center gap-2">
            <span className="text-xl bg-[#222244] p-1 border border-[#ff00ff]">{player.sprite}</span>
            <div>
              <div className="text-yellow-400 font-bold">{player.name}</div>
              <div className="text-gray-400">LVL {player.level} [{player.classType}]</div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-[#00ffcc]">💰 {player.gold} Gold</span>
            <span className="text-[#ff00ff]">💎 {player.gems} Gems</span>
          </div>
        </header>

        {/* ================= GŁÓWNY EKRAN APULIKACJI ================= */}
        <main className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
          
          {/* ZAKŁADKA 1: MAPA WEKTOROWA PIXEL ART */}
          {activeTab === 'map' && (
            <div className="flex flex-col h-full gap-2">
              <div className="flex justify-between items-center text-[8px]">
                <span className="text-[#ff00ff] font-bold">[MAPA SWIATA REALNEGO]</span>
                <span className={gpsActive ? "text-emerald-400" : "text-amber-400 animate-pulse"}>
                  {gpsActive ? "● GPS ONLINE" : "○ GPS TRYB TESTOWY"}
                </span>
              </div>

              {/* MAPA LEAFLET */}
              <div className="h-[300px] w-full border-2 border-[#00ffcc] relative overflow-hidden rounded">
                <MapContainer center={position} zoom={15} zoomControl={false} className="h-full w-full">
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution="OpenStreetMap"
                  />
                  {/* Marker Gracza */}
                  <Marker position={position} icon={createPixelIcon(player.sprite)}>
                    <Popup>
                      <strong>{player.name} (Ty)</strong><br />
                      {player.bio}
                    </Popup>
                  </Marker>

                  {/* Markery Sklepów i MarekW */}
                  {brandLocations.map(brand => (
                    <Marker key={brand.id} position={brand.pos} icon={createPixelIcon(brand.icon, true)}>
                      <Popup>
                        <strong className="text-yellow-400">{brand.name}</strong><br/>
                        <span>Oferta: {brand.offer}</span><br/>
                        <span className="text-emerald-400">Nagroda: {brand.reward}</span>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>

              {/* QUESTY I PROMOCJE MAREK W OKOLICY */}
              <div className="bg-[#121224] border-2 border-[#3a1a5a] p-2 flex flex-col gap-2">
                <div className="text-[8px] text-yellow-400 flex items-center gap-1">
                  <Tag size={12} /> SPONSOROWANE QUESTY MAREK W OKOLICY
                </div>
                {brandLocations.map(b => (
                  <div key={b.id} className="bg-[#1a1a3a] p-2 border border-[#3a1a5a] flex justify-between items-center text-[7px]">
                    <div>
                      <div className="text-white font-bold">{b.icon} {b.name}</div>
                      <div className="text-gray-400">{b.offer}</div>
                    </div>
                    <button 
                      onClick={() => {
                        setPlayer(p => ({ ...p, gold: p.gold + 100 }));
                        alert(`Odebrano nagrodę z ${b.name}! +100 Golda`);
                      }}
                      className="bg-[#00ffcc] text-black px-2 py-1 font-bold hover:bg-emerald-400"
                    >
                      ODBIERZ
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ZAKŁADKA 2: KREATOR / PROFILE SIMS STYLE */}
          {activeTab === 'avatar' && (
            <div className="flex flex-col gap-3 text-[8px]">
              <div className="text-[#ff00ff] font-bold">[KREATOR POSTACI & SIMS PROFILE]</div>
              <div className="bg-[#121224] border-2 border-[#3a1a5a] p-3 flex flex-col items-center gap-2">
                <div className="text-4xl bg-black p-3 border-2 border-[#00ffcc]">{player.sprite}</div>
                <div className="flex gap-2">
                  {["🧙‍♂️", "🧝‍♀️", "🥷", "🤖", "🧛‍♂️", "👨‍🎤"].map(s => (
                    <button 
                      key={s} 
                      onClick={() => setPlayer({...player, sprite: s})}
                      className="text-lg bg-[#222244] p-1 border border-gray-600 hover:border-[#00ffcc]"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#121224] border-2 border-[#3a1a5a] p-3 flex flex-col gap-2">
                <label className="text-gray-400">Nazwa Awatara:</label>
                <input 
                  type="text" 
                  value={player.name} 
                  onChange={(e) => setPlayer({...player, name: e.target.value})}
                  className="bg-black border border-[#3a1a5a] p-1.5 text-[#00ffcc] outline-none"
                />

                <label className="text-gray-400 mt-1">Klasa Postaci:</label>
                <select 
                  value={player.classType} 
                  onChange={(e) => setPlayer({...player, classType: e.target.value})}
                  className="bg-black border border-[#3a1a5a] p-1.5 text-[#00ffcc] outline-none"
                >
                  <option value="Cyber Mag">Cyber Mag</option>
                  <option value="Łowca Okazji">Łowca Okazji</option>
                  <option value="Street Trader">Street Trader</option>
                  <option value="Kolekcjoner">Kolekcjoner</option>
                </select>

                <label className="text-gray-400 mt-1">Status Związku (Bratnia Dusza):</label>
                <input 
                  type="text" 
                  value={player.relationshipStatus} 
                  onChange={(e) => setPlayer({...player, relationshipStatus: e.target.value})}
                  className="bg-black border border-[#3a1a5a] p-1.5 text-[#00ffcc] outline-none"
                />

                <label className="text-gray-400 mt-1">Opis Postaci (Bio):</label>
                <textarea 
                  value={player.bio} 
                  onChange={(e) => setPlayer({...player, bio: e.target.value})}
                  className="bg-black border border-[#3a1a5a] p-1.5 text-[#00ffcc] outline-none h-16"
                />
              </div>
            </div>
          )}

          {/* ZAKŁADKA 3: SPOŁECZNOŚĆ (BRATNIE DUSZE, GRUPY, BLOGI, FORUM) */}
          {activeTab === 'social' && (
            <div className="flex flex-col gap-3 text-[8px]">
              {/* NAWIGACJA WEWNĘTRZNA SPOŁECZNOŚCI */}
              <div className="flex justify-between border-b border-[#3a1a5a] pb-2 gap-1">
                <button 
                  onClick={() => setSocialSubTab('soulmates')}
                  className={`flex-1 py-1 text-center border ${socialSubTab === 'soulmates' ? 'bg-[#ff00ff] text-white' : 'bg-[#121224] text-gray-400'}`}
                >
                  ❤️ BRATNIE DUSZE
                </button>
                <button 
                  onClick={() => setSocialSubTab('groups')}
                  className={`flex-1 py-1 text-center border ${socialSubTab === 'groups' ? 'bg-[#ff00ff] text-white' : 'bg-[#121224] text-gray-400'}`}
                >
                  👥 GRUPY
                </button>
                <button 
                  onClick={() => setSocialSubTab('forum')}
                  className={`flex-1 py-1 text-center border ${socialSubTab === 'forum' ? 'bg-[#ff00ff] text-white' : 'bg-[#121224] text-gray-400'}`}
                >
                  📝 BLOGI & FORUM
                </button>
              </div>

              {/* SUBTAB 1: BRATNIE DUSZE (Dating / Social Match) */}
              {socialSubTab === 'soulmates' && (
                <div className="flex flex-col gap-2">
                  <div className="text-gray-400">Osoby o podobnych pasjach w Twojej okolicy:</div>
                  {soulmates.map(sm => (
                    <div key={sm.id} className="bg-[#121224] border-2 border-[#ff00ff] p-3 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl bg-black p-2 border border-[#ff00ff]">{sm.sprite}</span>
                        <div>
                          <div className="text-yellow-400 font-bold">{sm.name} (LVL {sm.level})</div>
                          <div className="text-[#00ffcc] text-[7px] mt-0.5">Dopasowanie: {sm.match}</div>
                          <div className="text-gray-400 text-[6px] mt-1">Hobby: {sm.hobbies.join(", ")}</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => alert(`Wysłano propozycję nawiązania relacji do ${sm.name}!`)}
                        className="bg-[#ff00ff] text-white p-2 font-bold hover:bg-pink-600"
                      >
                        Napisz
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* SUBTAB 2: GRUPY I KLUBY */}
              {socialSubTab === 'groups' && (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Lokalne Społeczności:</span>
                    <button onClick={() => alert("Tworzenie grupy... Feature w przygotowaniu")} className="bg-[#00ffcc] text-black px-2 py-1 font-bold">+ Nowa Grupa</button>
                  </div>
                  {groups.map(g => (
                    <div key={g.id} className="bg-[#121224] border-2 border-[#3a1a5a] p-3">
                      <div className="text-yellow-400 font-bold">{g.title} ({g.members} członków)</div>
                      <div className="text-gray-300 text-[7px] mt-1">{g.desc}</div>
                      <button onClick={() => alert(`Dołączono do grupy: ${g.title}`)} className="mt-2 bg-[#3a1a5a] text-white px-2 py-1 text-[7px] border border-[#00ffcc]">Dołącz</button>
                    </div>
                  ))}
                </div>
              )}

              {/* SUBTAB 3: BLOGI & FORUM */}
              {socialSubTab === 'forum' && (
                <div className="flex flex-col gap-3">
                  <form onSubmit={handleAddPost} className="bg-[#121224] border-2 border-[#3a1a5a] p-2 flex flex-col gap-2">
                    <span className="text-yellow-400">Stwórz wpis na blogu / forum:</span>
                    <input 
                      type="text" 
                      placeholder="Tytuł..." 
                      value={newPostTitle} 
                      onChange={(e) => setNewPostTitle(e.target.value)}
                      className="bg-black border border-[#3a1a5a] p-1 text-[#00ffcc] outline-none"
                    />
                    <textarea 
                      placeholder="Treść wpisu..." 
                      value={newPostContent} 
                      onChange={(e) => setNewPostContent(e.target.value)}
                      className="bg-black border border-[#3a1a5a] p-1 text-[#00ffcc] outline-none h-12"
                    />
                    <button type="submit" className="bg-[#00ffcc] text-black p-1 font-bold">Opublikuj Wpis</button>
                  </form>

                  <div className="flex flex-col gap-2">
                    {posts.map(p => (
                      <div key={p.id} className="bg-[#121224] border border-[#3a1a5a] p-2">
                        <div className="text-[#ff00ff] font-bold">{p.title}</div>
                        <div className="text-[6px] text-gray-500">Autor: {p.author}</div>
                        <p className="text-gray-300 text-[7px] my-1">{p.content}</p>
                        <div className="text-right text-[6px] text-emerald-400">❤️ {p.likes} Polubień</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ZAKŁADKA 4: RYNEK & HANDEL (MARKETPLACE) */}
          {activeTab === 'market' && (
            <div className="flex flex-col gap-3 text-[8px]">
              <div className="text-[#ff00ff] font-bold">[RYNEK & HANDEL PHYGITAL]</div>
              <p className="text-gray-400">Wymieniaj się przedmiotami, kupuj oferty marek lub wystawiaj własne ogłoszenia.</p>
              
              <div className="bg-[#121224] border-2 border-[#3a1a5a] p-2 flex flex-col gap-2">
                <div className="text-yellow-400 font-bold">Wystawione Przedmioty & Usługi:</div>
                
                <div className="bg-[#1a1a3a] border border-[#3a1a5a] p-2 flex justify-between items-center">
                  <div>
                    <div className="text-white font-bold">Voucher Castorama -10%</div>
                    <div className="text-gray-400">Sprzedający: Agent_47</div>
                  </div>
                  <button onClick={() => alert("Zakupiono przedmiot!")} className="bg-[#00ffcc] text-black px-2 py-1 font-bold">Kup za 150 G</button>
                </div>

                <div className="bg-[#1a1a3a] border border-[#3a1a5a] p-2 flex justify-between items-center">
                  <div>
                    <div className="text-white font-bold">Pikselowy Miecz Cyberpunk</div>
                    <div className="text-gray-400">Sprzedający: TibiaMaster</div>
                  </div>
                  <button onClick={() => alert("Zakupiono przedmiot!")} className="bg-[#00ffcc] text-black px-2 py-1 font-bold">Kup za 500 G</button>
                </div>
              </div>
            </div>
          )}

        </main>

        {/* ================= DOLNE MENU NAWIGACJI MMORPG ================= */}
        <nav className="bg-[#121224] border-t-2 border-[#3a1a5a] flex justify-around z-10">
          <button 
            onClick={() => setActiveTab('map')} 
            className={`flex-1 py-3 flex flex-col items-center gap-1 text-[7px] ${activeTab === 'map' ? 'bg-[#3a1a5a] text-[#00ffcc]' : 'text-gray-400'}`}
          >
            <Compass size={16} /> Mapa
          </button>
          <button 
            onClick={() => setActiveTab('avatar')} 
            className={`flex-1 py-3 flex flex-col items-center gap-1 text-[7px] ${activeTab === 'avatar' ? 'bg-[#3a1a5a] text-[#00ffcc]' : 'text-gray-400'}`}
          >
            <User size={16} /> Postać
          </button>
          <button 
            onClick={() => setActiveTab('social')} 
            className={`flex-1 py-3 flex flex-col items-center gap-1 text-[7px] ${activeTab === 'social' ? 'bg-[#3a1a5a] text-[#00ffcc]' : 'text-gray-400'}`}
          >
            <Users size={16} /> Socjal
          </button>
          <button 
            onClick={() => setActiveTab('market')} 
            className={`flex-1 py-3 flex flex-col items-center gap-1 text-[7px] ${activeTab === 'market' ? 'bg-[#3a1a5a] text-[#00ffcc]' : 'text-gray-400'}`}
          >
            <ShoppingBag size={16} /> Rynek
          </button>
        </nav>

      </div>
    </div>
  );
}
