import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.resolve('data');
const LEADERBOARD_FILE = path.join(DATA_DIR, 'leaderboard.json');

export function getLeaderboard() {
  try {
    if (fs.existsSync(LEADERBOARD_FILE)) {
      const content = fs.readFileSync(LEADERBOARD_FILE, 'utf-8');
      const data = JSON.parse(content);
      if (Array.isArray(data.entries)) {
        return data.entries;
      }
    }
  } catch (err) {
    // If read error, fallback to empty
  }
  return [];
}

export function saveLeaderboard(entries) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify({ entries }, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save leaderboard:', err.message);
  }
}

export function addLeaderboardEntry({ name, score, nights_won, achieved_at, seed }) {
  // Validate name (3-12 chars [A-Za-z0-9_], also allow unicode letters)
  let cleanName = String(name || '').trim();
  if (cleanName.length < 3) cleanName = 'NguoiChoi';
  if (cleanName.length > 12) cleanName = cleanName.slice(0, 12);

  const entry = {
    name: cleanName,
    score: Number(score) || 0,
    nights_won: Number(nights_won) || 0,
    achieved_at: achieved_at || new Date().toISOString(),
    seed: Number(seed) || 0
  };

  const entries = getLeaderboard();
  entries.push(entry);

  // Sort descending by score, tie-break by achieved_at ascending (earlier first)
  entries.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return new Date(a.achieved_at).getTime() - new Date(b.achieved_at).getTime();
  });

  // Top 10 only
  const top10 = entries.slice(0, 10);
  saveLeaderboard(top10);
  return top10;
}

export function exportLeaderboard(outPath) {
  const entries = getLeaderboard();
  const resolved = path.resolve(outPath);
  const dir = path.dirname(resolved);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(resolved, JSON.stringify({ entries }, null, 2), 'utf-8');
}
