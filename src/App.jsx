import { useEffect, useMemo, useState } from 'react';
import { Compass, User, Users, ShoppingBag, Tag } from 'lucide-react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';

const STORAGE_KEY = 'geoverse-save-v1';

const createPixelIcon = (emoji, isBrand = false) =>
  L.divIcon({
    className: isBrand ? 'pixel-brand-marker' : 'pixel-avatar-marker',
    html: `<div>${emoji}</div>`,
    iconSize: isBrand ? [30, 30] : [36, 36],
    iconAnchor: isBrand ? [15, 15] : [18, 18],
  });

const brandLocations = [
  { id: 1, name: 'Żabka Quest', pos: [52.231, 21.015], icon: '🏪', offer: '-20% na hot-doga za 50 GeoCoin', reward: '+100 EXP', rewardGold: 120, rewardExp: 100 },
  { id: 2, name: 'Cyber Cafe & Board Games', pos: [52.228, 21.01], icon: '☕', offer: 'Darmowy napój przy wejściu', reward: '+200 EXP', rewardGold: 150, rewardExp: 200 },
  { id: 3, name: 'Nike Sneaker Spot', pos: [52.2325, 21.008], icon: '👟', offer: 'Unikalna skórka butów do awatara', reward: '+1 limitowany skin', rewardGold: 200, rewardExp: 250 },
];

const defaultPlayer = {
  name: 'PixelHero',
  sprite: '🧙‍♂️',
  classType: 'Cyber Mag',
  level: 15,
  xp: 120,
  xpToNext: 300,
  gold: 2450,
  gems: 35,
  bio: 'Szukam ekipy na rajd po promocje w centrum!',
  hobbies: ['Retro Gaming', 'Kawa', 'Programowanie'],
  relationshipStatus: 'Wolny',
};

const defaultPosts = [
  {
    id: 1,
    author: 'System',
    title: 'Witaj w GeoVerse MMORPG!',
    content: 'Eksploruj mapę, wykonuj questy sklepów i szukaj znajomych w okolicy.',
    likes: 45,
  },
  {
    id: 2,
    author: 'NeonQueen',
    title: 'Najlepsze kawiarnie w sektorze centralnym',
    content: 'Oto lista miejsc, gdzie dostaniecie darmowy boost do energii za zrealizowanie bonu.',
    likes: 12,
  },
];

const soulmates = [
  { id: 1, name: 'NeonQueen', sprite: '🧝‍♀️', level: 18, hobbies: ['Kawa', 'Anime', 'Muzyka synth'], match: '94%' },
  { id: 2, name: 'RetroGamer99', sprite: '🥷', level: 12, hobbies: ['Retro Gaming', 'Programowanie'], match: '88%' },
];

const groups = [
  { id: 1, title: 'Lokalni Łowcy Okazji', members: 142, desc: 'Dzielimy się kodami rabatowymi z okolicy.' },
  { id: 2, title: 'Pixel Art & Devs', members: 89, desc: 'Sztuka pikselowa i tworzenie gier 2D.' },
];

const marketItems = [
  { id: 1, title: 'Voucher Castorama -10%', seller: 'Agent_47', price: 150, type: 'GeoCoin', currency: 'gold' },
  { id: 2, title: 'Pikselowy Miecz Cyberpunk', seller: 'TibiaMaster', price: 500, type: 'GeoCoin', currency: 'gold' },
];

const getLevelProgress = (player) => Math.min((player.xp / player.xpToNext) * 100, 100);

const levelUpPlayer = (player) => {
  let currentXp = player.xp;
  let currentLevel = player.level;
  let currentGoal = player.xpToNext;

  while (currentXp >= currentGoal) {
    currentXp -= currentGoal;
    currentLevel += 1;
    currentGoal = 240 + currentLevel * 60;
  }

  return {
    ...player,
    level: currentLevel,
    xp: currentXp,
    xpToNext: currentGoal,
  };
};

const loadGameState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return { player: defaultPlayer, posts: defaultPosts, quests: [] };

    const parsed = JSON.parse(saved);
    return {
      player: { ...defaultPlayer, ...parsed.player },
      posts: parsed.posts?.length ? parsed.posts : defaultPosts,
      quests: parsed.quests?.length ? parsed.quests : [],
    };
  } catch {
    return { player: defaultPlayer, posts: defaultPosts, quests: [] };
  }
};

const syncGameState = async (payload) => {
  try {
    await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }
};

export default function App() {
  const savedState = useMemo(() => loadGameState(), []);
  const [activeTab, setActiveTab] = useState('map');
  const [socialSubTab, setSocialSubTab] = useState('soulmates');
  const [position, setPosition] = useState([52.2297, 21.0122]);
  const [gpsActive, setGpsActive] = useState(false);
  const [player, setPlayer] = useState(savedState.player);
  const [posts, setPosts] = useState(savedState.posts);
  const [quests, setQuests] = useState(savedState.quests);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');

  useEffect(() => {
    const payload = { player, posts, quests };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    syncGameState(payload).catch(() => undefined);
  }, [player, posts, quests]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const response = await fetch('/api/state');
        if (!response.ok) throw new Error('API unavailable');
        const payload = await response.json();
        if (payload.player) setPlayer({ ...defaultPlayer, ...payload.player });
        if (payload.posts?.length) setPosts(payload.posts);
        if (payload.quests?.length) setQuests(payload.quests);
      } catch {
        const local = loadGameState();
        setPlayer(local.player);
        setPosts(local.posts);
        setQuests(local.quests);
      }
    };

    bootstrap();
  }, []);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setGpsActive(false);
      return undefined;
    }

    const watchId = navigator.geolocation.watchPosition(
      (geo) => {
        setPosition([geo.coords.latitude, geo.coords.longitude]);
        setGpsActive(true);
      },
      () => {
        setGpsActive(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const progress = getLevelProgress(player);

  const handleAddPost = (event) => {
    event.preventDefault();
    if (!newPostTitle.trim() || !newPostContent.trim()) return;

    setPosts((current) => [
      { id: Date.now(), author: player.name, title: newPostTitle.trim(), content: newPostContent.trim(), likes: 0 },
      ...current,
    ]);

    setNewPostTitle('');
    setNewPostContent('');
  };

  const claimQuest = (questId, brandName, rewardGold, rewardExp) => {
    const alreadyClaimed = quests.some((quest) => quest.id === questId && quest.claimed);
    if (alreadyClaimed) return;

    setQuests((current) => current.map((quest) => (quest.id === questId ? { ...quest, claimed: true } : quest)));

    setPlayer((current) => {
      const updated = {
        ...current,
        gold: current.gold + rewardGold,
        xp: current.xp + rewardExp,
      };

      return levelUpPlayer(updated);
    });

    alert(`Quest ukończony: ${brandName}! +${rewardGold} GeoCoin, +${rewardExp} XP`);
  };

  const buyMarketItem = (item) => {
    if (item.currency === 'gold' && player.gold < item.price) {
      alert('Masz za mało złota!');
      return;
    }

    if (item.currency === 'gems' && player.gems < item.price) {
      alert('Masz za mało gemów!');
      return;
    }

    setPlayer((current) => ({
      ...current,
      gold: item.currency === 'gold' ? current.gold - item.price : current.gold,
      gems: item.currency === 'gems' ? current.gems - item.price : current.gems,
    }));

    alert(`Zakupiono: ${item.title}`);
  };

  const handleQuestOpen = (brand) => {
    const exists = quests.some((quest) => quest.id === brand.id);
    if (!exists) {
      setQuests((current) => [
        ...current,
        {
          id: brand.id,
          title: brand.name,
          description: brand.offer,
          rewardGold: brand.rewardGold,
          rewardExp: brand.rewardExp,
          claimed: false,
        },
      ]);
    }
  };

  return (
    <div className="app-shell">
      <div className="game-panel">
        <header className="topbar">
          <div className="player-meta">
            <span className="avatar-sprite">{player.sprite}</span>
            <div>
              <div className="player-name">{player.name}</div>
              <div className="player-level">LVL {player.level} [{player.classType}]</div>
            </div>
          </div>

          <div className="player-currency">
            <span className="gold">💰 {player.gold} GeoCoin</span>
            <span className="gems">💎 {player.gems} Gems</span>
          </div>
        </header>

        <div className="xp-strip">
          <div className="xp-header">
            <span>XP</span>
            <span>{player.xp}/{player.xpToNext}</span>
          </div>
          <div className="xp-bar">
            <div style={{ width: `${progress}%` }} />
          </div>
        </div>

        <main className="content-panel">
          {activeTab === 'map' && (
            <div className="panel-stack map-panel">
              <div className="panel-headline">
                <span>[MAPA ŚWIATA REALNEGO]</span>
                <span className={gpsActive ? 'status-online' : 'status-demo'}>
                  {gpsActive ? '● GPS ONLINE' : '○ GPS TRYB TESTOWY'}
                </span>
              </div>

              <div className="map-box">
                <MapContainer center={position} zoom={15} scrollWheelZoom={false} className="leaflet-map">
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution="&copy; OpenStreetMap contributors &copy; CARTO"
                  />

                  <Marker position={position} icon={createPixelIcon(player.sprite)}>
                    <Popup>
                      <strong>{player.name} (Ty)</strong>
                      <br />
                      {player.bio}
                    </Popup>
                  </Marker>

                  {brandLocations.map((brand) => (
                    <Marker key={brand.id} position={brand.pos} icon={createPixelIcon(brand.icon, true)}>
                      <Popup>
                        <strong>{brand.name}</strong>
                        <br />
                        {brand.offer}
                        <br />
                        <span className="popup-reward">{brand.reward}</span>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>

              <div className="quest-panel">
                <div className="section-label">
                  <Tag size={12} /> SPONSOROWANE QUESTY MAREK W OKOLICY
                </div>

                {brandLocations.map((brand) => {
                  const quest = quests.find((item) => item.id === brand.id);
                  const claimed = Boolean(quest?.claimed);

                  return (
                    <div key={brand.id} className={claimed ? 'quest-card claimed' : 'quest-card'}>
                      <div>
                        <div className="quest-title">{brand.icon} {brand.name}</div>
                        <div className="quest-offer">{brand.offer}</div>
                      </div>

                      <button
                        type="button"
                        className="primary-button"
                        onClick={() => {
                          handleQuestOpen(brand);
                          claimQuest(brand.id, brand.name, brand.rewardGold, brand.rewardExp);
                        }}
                        disabled={claimed}
                      >
                        {claimed ? 'ODEBRANE' : 'ODBIERZ'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'avatar' && (
            <div className="panel-stack avatar-panel">
              <div className="section-title">[KREATOR POSTACI & SIMS PROFILE]</div>

              <div className="avatar-card">
                <div className="avatar-preview">{player.sprite}</div>
                <div className="sprite-picker">
                  {['🧙‍♂️', '🧝‍♀️', '🥷', '🤖', '🧛‍♂️', '👨‍🎤'].map((sprite) => (
                    <button
                      type="button"
                      key={sprite}
                      className="sprite-button"
                      onClick={() => setPlayer((current) => ({ ...current, sprite }))}
                    >
                      {sprite}
                    </button>
                  ))}
                </div>
              </div>

              <div className="stats-grid">
                <div className="stat-box">
                  <span>Poziom</span>
                  <strong>{player.level}</strong>
                </div>
                <div className="stat-box">
                  <span>GeoCoin</span>
                  <strong>{player.gold}</strong>
                </div>
                <div className="stat-box">
                  <span>Gems</span>
                  <strong>{player.gems}</strong>
                </div>
                <div className="stat-box">
                  <span>Status</span>
                  <strong>{player.relationshipStatus}</strong>
                </div>
              </div>

              <div className="settings-card">
                <label>
                  Nazwa awatara:
                  <input value={player.name} onChange={(event) => setPlayer((current) => ({ ...current, name: event.target.value }))} />
                </label>

                <label>
                  Klasa postaci:
                  <select value={player.classType} onChange={(event) => setPlayer((current) => ({ ...current, classType: event.target.value }))}>
                    <option value="Cyber Mag">Cyber Mag</option>
                    <option value="Łowca Okazji">Łowca Okazji</option>
                    <option value="Street Trader">Street Trader</option>
                    <option value="Kolekcjoner">Kolekcjoner</option>
                  </select>
                </label>

                <label>
                  Status związku:
                  <input value={player.relationshipStatus} onChange={(event) => setPlayer((current) => ({ ...current, relationshipStatus: event.target.value }))} />
                </label>

                <label>
                  Opis postaci:
                  <textarea value={player.bio} onChange={(event) => setPlayer((current) => ({ ...current, bio: event.target.value }))} />
                </label>
              </div>
            </div>
          )}

          {activeTab === 'social' && (
            <div className="panel-stack social-panel">
              <div className="social-tabs">
                <button type="button" className={socialSubTab === 'soulmates' ? 'tab active' : 'tab'} onClick={() => setSocialSubTab('soulmates')}>
                  ❤️ BRATNIE DUSZE
                </button>
                <button type="button" className={socialSubTab === 'groups' ? 'tab active' : 'tab'} onClick={() => setSocialSubTab('groups')}>
                  👥 GRUPY
                </button>
                <button type="button" className={socialSubTab === 'forum' ? 'tab active' : 'tab'} onClick={() => setSocialSubTab('forum')}>
                  📝 BLOGI & FORUM
                </button>
              </div>

              {socialSubTab === 'soulmates' && (
                <div className="stack-list">
                  {soulmates.map((person) => (
                    <div key={person.id} className="profile-card">
                      <div className="profile-main">
                        <span className="profile-avatar">{person.sprite}</span>
                        <div>
                          <div className="profile-name">{person.name} (LVL {person.level})</div>
                          <div className="profile-match">Dopasowanie: {person.match}</div>
                          <div className="profile-hobbies">Hobby: {person.hobbies.join(', ')}</div>
                        </div>
                      </div>

                      <button type="button" className="secondary-button" onClick={() => alert(`Wysłano wiadomość do ${person.name}!`)}>
                        Napisz
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {socialSubTab === 'groups' && (
                <div className="stack-list">
                  {groups.map((group) => (
                    <div key={group.id} className="group-card">
                      <div className="group-header">
                        <div className="group-title">{group.title}</div>
                        <div className="group-members">{group.members} członków</div>
                      </div>
                      <p>{group.desc}</p>
                      <button type="button" className="secondary-button" onClick={() => alert(`Dołączono do grupy: ${group.title}`)}>
                        Dołącz
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {socialSubTab === 'forum' && (
                <div className="stack-list">
                  <form className="forum-form" onSubmit={handleAddPost}>
                    <span>Stwórz wpis na blogu / forum:</span>
                    <input placeholder="Tytuł..." value={newPostTitle} onChange={(event) => setNewPostTitle(event.target.value)} />
                    <textarea placeholder="Treść wpisu..." value={newPostContent} onChange={(event) => setNewPostContent(event.target.value)} />
                    <button type="submit" className="primary-button">Opublikuj wpis</button>
                  </form>

                  {posts.map((post) => (
                    <article key={post.id} className="post-card">
                      <div className="post-title">{post.title}</div>
                      <div className="post-author">Autor: {post.author}</div>
                      <p>{post.content}</p>
                      <div className="post-likes">❤️ {post.likes} polubień</div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'market' && (
            <div className="panel-stack market-panel">
              <div className="section-title">[RYNEK & HANDEL PHYGITAL]</div>
              <p className="muted-text">Wymieniaj się przedmiotami, kupuj oferty marek lub wystawiaj własne ogłoszenia.</p>

              <div className="market-list">
                {marketItems.map((item) => (
                  <div key={item.id} className="market-card">
                    <div>
                      <div className="market-title">{item.title}</div>
                      <div className="market-seller">Sprzedający: {item.seller}</div>
                    </div>
                    <button type="button" className="primary-button" onClick={() => buyMarketItem(item)}>
                      Kup za {item.price} {item.type}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        <nav className="bottom-nav">
          <button type="button" className={activeTab === 'map' ? 'nav-button active' : 'nav-button'} onClick={() => setActiveTab('map')}>
            <Compass size={16} />
            <span>Mapa</span>
          </button>
          <button type="button" className={activeTab === 'avatar' ? 'nav-button active' : 'nav-button'} onClick={() => setActiveTab('avatar')}>
            <User size={16} />
            <span>Postać</span>
          </button>
          <button type="button" className={activeTab === 'social' ? 'nav-button active' : 'nav-button'} onClick={() => setActiveTab('social')}>
            <Users size={16} />
            <span>Socjal</span>
          </button>
          <button type="button" className={activeTab === 'market' ? 'nav-button active' : 'nav-button'} onClick={() => setActiveTab('market')}>
            <ShoppingBag size={16} />
            <span>Rynek</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
