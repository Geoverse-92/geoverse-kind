import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT) || 3001;
const DIST_DIR = path.join(__dirname, 'dist');
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'geoverse.db');

fs.mkdirSync(DATA_DIR, { recursive: true });

const app = express();
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    name TEXT NOT NULL,
    sprite TEXT NOT NULL,
    class_type TEXT NOT NULL,
    level INTEGER NOT NULL,
    xp INTEGER NOT NULL,
    xp_to_next INTEGER NOT NULL,
    gold INTEGER NOT NULL,
    gems INTEGER NOT NULL,
    bio TEXT,
    hobbies TEXT,
    relationship_status TEXT
  );

  CREATE TABLE IF NOT EXISTS quests (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    reward_gold INTEGER NOT NULL,
    reward_exp INTEGER NOT NULL,
    claimed INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    likes INTEGER NOT NULL DEFAULT 0
  );
`);

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

const defaultQuests = [
  {
    id: 1,
    title: 'Żabka Quest',
    description: '-20% na hot-doga za 50 Golda',
    rewardGold: 120,
    rewardExp: 100,
    claimed: false,
  },
  {
    id: 2,
    title: 'Cyber Cafe & Board Games',
    description: 'Darmowy napój przy wejściu',
    rewardGold: 150,
    rewardExp: 200,
    claimed: false,
  },
  {
    id: 3,
    title: 'Nike Sneaker Spot',
    description: 'Unikalna skórka butów do awatara',
    rewardGold: 200,
    rewardExp: 250,
    claimed: false,
  },
];

const ensureSeed = () => {
  const count = db.prepare('SELECT COUNT(*) AS total FROM players').get().total;

  if (count === 0) {
    db.prepare(
      `INSERT INTO players (id, name, sprite, class_type, level, xp, xp_to_next, gold, gems, bio, hobbies, relationship_status)
       VALUES (1, @name, @sprite, @classType, @level, @xp, @xpToNext, @gold, @gems, @bio, @hobbies, @relationshipStatus)`
    ).run({
      ...defaultPlayer,
      hobbies: JSON.stringify(defaultPlayer.hobbies),
    });
  }

  const questCount = db.prepare('SELECT COUNT(*) AS total FROM quests').get().total;
  if (questCount === 0) {
    const insertQuest = db.prepare(
      `INSERT INTO quests (id, title, description, reward_gold, reward_exp, claimed)
       VALUES (@id, @title, @description, @rewardGold, @rewardExp, @claimed)`
    );

    defaultQuests.forEach((quest) => insertQuest.run({ ...quest, claimed: Number(Boolean(quest.claimed)) }));
  }

  const postCount = db.prepare('SELECT COUNT(*) AS total FROM posts').get().total;
  if (postCount === 0) {
    const insertPost = db.prepare(
      `INSERT INTO posts (author, title, content, likes)
       VALUES (@author, @title, @content, @likes)`
    );

    defaultPosts.forEach((post) => insertPost.run(post));
  }
};

const normalizePlayer = (row) => ({
  name: row.name,
  sprite: row.sprite,
  classType: row.class_type,
  level: row.level,
  xp: row.xp,
  xpToNext: row.xp_to_next,
  gold: row.gold,
  gems: row.gems,
  bio: row.bio,
  hobbies: JSON.parse(row.hobbies || '[]'),
  relationshipStatus: row.relationship_status,
});

const normalizeQuest = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  rewardGold: row.reward_gold,
  rewardExp: row.reward_exp,
  claimed: Boolean(row.claimed),
});

const normalizePost = (row) => ({
  id: row.id,
  author: row.author,
  title: row.title,
  content: row.content,
  likes: row.likes,
});

const getState = () => {
  const player = db.prepare('SELECT * FROM players WHERE id = 1').get();
  const quests = db.prepare('SELECT * FROM quests ORDER BY id').all().map(normalizeQuest);
  const posts = db.prepare('SELECT * FROM posts ORDER BY id DESC').all().map(normalizePost);

  return {
    player: player ? normalizePlayer(player) : defaultPlayer,
    quests,
    posts,
  };
};

const saveState = ({ player, quests = [], posts = [] }) => {
  if (player) {
    db.prepare(
      `UPDATE players
       SET name = @name,
           sprite = @sprite,
           class_type = @classType,
           level = @level,
           xp = @xp,
           xp_to_next = @xpToNext,
           gold = @gold,
           gems = @gems,
           bio = @bio,
           hobbies = @hobbies,
           relationship_status = @relationshipStatus
       WHERE id = 1`
    ).run({
      ...player,
      hobbies: JSON.stringify(player.hobbies || []),
    });
  }

  if (Array.isArray(quests)) {
    const upsertQuest = db.prepare(
      `INSERT INTO quests (id, title, description, reward_gold, reward_exp, claimed)
       VALUES (@id, @title, @description, @rewardGold, @rewardExp, @claimed)
       ON CONFLICT(id) DO UPDATE SET
         title = excluded.title,
         description = excluded.description,
         reward_gold = excluded.reward_gold,
         reward_exp = excluded.reward_exp,
         claimed = excluded.claimed`
    );

    quests.forEach((quest) => upsertQuest.run({
      ...quest,
      claimed: Number(Boolean(quest.claimed)),
    }));
  }

  if (Array.isArray(posts)) {
    db.prepare('DELETE FROM posts').run();
    const insertPost = db.prepare(
      `INSERT INTO posts (id, author, title, content, likes)
       VALUES (@id, @author, @title, @content, @likes)`
    );

    posts.forEach((post) => insertPost.run({
      id: post.id,
      author: post.author,
      title: post.title,
      content: post.content,
      likes: Number(post.likes || 0),
    }));
  }
};

ensureSeed();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, status: 'healthy', time: new Date().toISOString() });
});

app.get('/api/state', (_req, res) => {
  res.json(getState());
});

app.post('/api/state', (req, res) => {
  try {
    const payload = req.body || {};
    saveState({
      player: payload.player,
      quests: payload.quests || [],
      posts: payload.posts || [],
    });
    res.json(getState());
  } catch (error) {
    res.status(500).json({ error: 'Unable to save game state', details: error.message });
  }
});

app.use(express.static(DIST_DIR));

app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api/')) {
    return next();
  }

  const indexPath = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }

  return res.status(404).send('App not built yet. Run npm run build first.');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`GeoVerse premium backend listening on http://0.0.0.0:${PORT}`);
});
