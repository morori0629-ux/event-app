require('dotenv').config();
const express = require('express');
const crypto  = require('crypto');
const path    = require('path');
const db      = require('./db');
const mailer  = require('./mailer');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── ユーティリティ ────────────────────────────────────────────
function hash(plain) {
  return crypto.createHash('sha256').update(plain).digest('hex');
}

// ════════════════════════════════════════════════════════════════
//  イベント API
// ════════════════════════════════════════════════════════════════

// 一覧取得
app.get('/api/events', (req, res) => {
  try {
    res.json(db.getAllEvents());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 1件取得（合言葉ハッシュ・幹事メールは返さない）
app.get('/api/events/:id', (req, res) => {
  const event = db.getEvent(req.params.id);
  if (!event) return res.status(404).json({ error: 'イベントが見つかりません' });
  const { passphrase_hash, organizer_email, ...safe } = event;
  res.json(safe);
});

// 新規作成
app.post('/api/events', (req, res) => {
  const { title, date, time, location, description,
          deadline, passphrase, organizer_name, organizer_email } = req.body;

  if (!title || !date || !deadline || !passphrase || !organizer_name || !organizer_email) {
    return res.status(400).json({ error: '必須項目が入力されていません' });
  }

  const id = crypto.randomUUID();
  db.createEvent({
    id, title, date, time, location, description,
    deadline,
    passphrase_hash: hash(passphrase),
    organizer_name,
    organizer_email,
  });
  res.json({ id });
});

// 更新（合言葉が必要）
app.put('/api/events/:id', (req, res) => {
  const { title, date, time, location, description,
          deadline, passphrase, organizer_name, organizer_email } = req.body;

  if (!title || !date || !deadline || !passphrase || !organizer_name || !organizer_email) {
    return res.status(400).json({ error: '必須項目が入力されていません' });
  }

  const event = db.getEvent(req.params.id);
  if (!event) return res.status(404).json({ error: 'イベントが見つかりません' });
  if (hash(passphrase) !== event.passphrase_hash) {
    return res.status(403).json({ error: '合言葉が違います' });
  }

  db.updateEvent({ id: req.params.id, title, date, time, location, description,
                   deadline, organizer_name, organizer_email });
  res.json({ ok: true });
});

// 削除（合言葉が必要）
app.delete('/api/events/:id', (req, res) => {
  const { passphrase } = req.body;
  const event = db.getEvent(req.params.id);
  if (!event) return res.status(404).json({ error: 'イベントが見つかりません' });
  if (!passphrase || hash(passphrase) !== event.passphrase_hash) {
    return res.status(403).json({ error: '合言葉が違います' });
  }
  db.deleteEvent(req.params.id);
  res.json({ ok: true });
});

// ════════════════════════════════════════════════════════════════
//  参加者 API
// ════════════════════════════════════════════════════════════════

// 参加者一覧
app.get('/api/events/:id/participants', (req, res) => {
  res.json(db.getParticipants(req.params.id));
});

// 参加登録
app.post('/api/events/:id/participants', async (req, res) => {
  const { name, email } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: '名前を入力してください' });

  const event = db.getEvent(req.params.id);
  if (!event) return res.status(404).json({ error: 'イベントが見つかりません' });

  // 申込期限チェック
  if (new Date() > new Date(event.deadline)) {
    return res.status(400).json({ error: '申込期限が過ぎています' });
  }

  const id           = crypto.randomUUID();
  const cancel_token = crypto.randomUUID();
  const cleanName    = name.trim();
  const cleanEmail   = email?.trim() || null;

  db.addParticipant({ id, event_id: req.params.id, name: cleanName, email: cleanEmail, cancel_token });

  const cancelUrl = `${req.protocol}://${req.get('host')}/cancel.html?token=${cancel_token}`;

  // 幹事へ通知（失敗しても登録は成功扱い）
  mailer.notifyOrganizer(event, cleanName, cleanEmail).catch(e =>
    console.error('[mail] 幹事通知エラー:', e.message)
  );

  // 参加者へキャンセルリンク送付（メールが入力された場合のみ）
  if (cleanEmail) {
    mailer.sendCancelLink(cleanEmail, cleanName, event, cancelUrl).catch(e =>
      console.error('[mail] キャンセルリンクエラー:', e.message)
    );
  }

  res.json({ cancel_token, cancelUrl });
});

// 参加キャンセル
app.delete('/api/participants/:token', (req, res) => {
  const participant = db.getParticipantByToken(req.params.token);
  if (!participant) {
    return res.status(404).json({ error: 'この登録は見つかりません（すでにキャンセル済みか、無効なリンクです）' });
  }
  db.removeParticipant(req.params.token);
  res.json({ ok: true, name: participant.name, event_title: participant.event_title });
});

// ════════════════════════════════════════════════════════════════
//  コメント API
// ════════════════════════════════════════════════════════════════

// コメント一覧
app.get('/api/events/:id/comments', (req, res) => {
  res.json(db.getComments(req.params.id));
});

// コメント投稿
app.post('/api/events/:id/comments', (req, res) => {
  const { author_name, content } = req.body;
  if (!author_name?.trim() || !content?.trim()) {
    return res.status(400).json({ error: '名前とコメントを入力してください' });
  }

  const event = db.getEvent(req.params.id);
  if (!event) return res.status(404).json({ error: 'イベントが見つかりません' });

  const id = crypto.randomUUID();
  db.addComment({ id, event_id: req.params.id, author_name: author_name.trim(), content: content.trim() });
  res.json({ ok: true });
});

// ════════════════════════════════════════════════════════════════
//  起動
// ════════════════════════════════════════════════════════════════
app.listen(PORT, () => {
  console.log(`✅  イベント管理アプリ起動 → http://localhost:${PORT}`);
});
