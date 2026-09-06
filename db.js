/**
 * db.js — JSONファイルベースのデータストレージ
 * better-sqlite3 の代替。Node.js 標準の fs モジュールのみ使用。
 * データは data.json に保存されます。
 */

const fs   = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.json');

// ─── 内部ヘルパー ──────────────────────────────────────────────

/** data.json を読み込む（存在しなければ初期化） */
function load() {
  if (!fs.existsSync(DATA_FILE)) {
    const init = { events: [], participants: [], comments: [] };
    fs.writeFileSync(DATA_FILE, JSON.stringify(init, null, 2), 'utf8');
    return init;
  }
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    return { events: [], participants: [], comments: [] };
  }
}

/** data.json に書き込む */
function save(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

/** 現在時刻を "YYYY-MM-DD HH:MM:SS" 形式で返す */
function now() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} `
       + `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// ─── Public API ───────────────────────────────────────────────

module.exports = {

  // ── Events ──────────────────────────────────────────────────

  getAllEvents() {
    const data = load();
    return data.events
      .map(ev => ({
        ...ev,
        participant_count: data.participants.filter(p => p.event_id === ev.id).length
      }))
      .sort((a, b) => (a.date + (a.time || '')) > (b.date + (b.time || '')) ? 1 : -1);
  },

  getEvent(id) {
    return load().events.find(ev => ev.id === id) || null;
  },

  createEvent({ id, title, date, time, location, description, deadline, passphrase_hash, organizer_name, organizer_email }) {
    const data = load();
    data.events.push({
      id, title, date,
      time:           time        || null,
      location:       location    || null,
      description:    description || null,
      deadline,
      passphrase_hash,
      organizer_name,
      organizer_email,
      created_at: now()
    });
    save(data);
  },

  updateEvent({ id, title, date, time, location, description, deadline, organizer_name, organizer_email }) {
    const data = load();
    const idx = data.events.findIndex(ev => ev.id === id);
    if (idx === -1) return false;
    data.events[idx] = {
      ...data.events[idx],
      title, date,
      time:        time        || null,
      location:    location    || null,
      description: description || null,
      deadline,
      organizer_name,
      organizer_email,
      updated_at: now(),
    };
    save(data);
    return true;
  },

  deleteEvent(id) {
    const data = load();
    data.events       = data.events.filter(ev => ev.id !== id);
    data.participants = data.participants.filter(p => p.event_id !== id);
    data.comments     = data.comments.filter(c => c.event_id !== id);
    save(data);
  },

  // ── Participants ─────────────────────────────────────────────

  getParticipants(eventId) {
    return load().participants
      .filter(p => p.event_id === eventId)
      .map(({ id, name, registered_at }) => ({ id, name, registered_at }))
      .sort((a, b) => a.registered_at > b.registered_at ? 1 : -1);
  },

  addParticipant({ id, event_id, name, email, cancel_token }) {
    const data = load();
    data.participants.push({
      id, event_id, name,
      email:        email || null,
      cancel_token,
      registered_at: now()
    });
    save(data);
  },

  getParticipantByToken(token) {
    const data = load();
    const p = data.participants.find(p => p.cancel_token === token);
    if (!p) return null;
    const ev = data.events.find(ev => ev.id === p.event_id);
    return { ...p, event_title: ev ? ev.title : '' };
  },

  removeParticipant(token) {
    const data = load();
    data.participants = data.participants.filter(p => p.cancel_token !== token);
    save(data);
  },

  // ── Comments ─────────────────────────────────────────────────

  getComments(eventId) {
    return load().comments
      .filter(c => c.event_id === eventId)
      .sort((a, b) => a.created_at > b.created_at ? 1 : -1);
  },

  addComment({ id, event_id, author_name, content }) {
    const data = load();
    data.comments.push({ id, event_id, author_name, content, created_at: now() });
    save(data);
  },
};
