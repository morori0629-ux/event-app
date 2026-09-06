/* ═══════════════════════════════════════════════════════════════
   edit.js — イベント編集ページ (edit.html)
   依存: http.js
═══════════════════════════════════════════════════════════════ */

var eventId    = qp('id');
var passphrase = qp('pass');  // event.html の合言葉フォームから渡される

/* ── 初期化 ──────────────────────────────────────────────────── */
async function init() {
  if (!eventId) {
    location.href = '/';
    return;
  }

  document.getElementById('back-link').href = '/event.html?id=' + eventId;
  document.getElementById('back-btn').onclick = function () {
    location.href = '/event.html?id=' + eventId;
  };

  // 合言葉フィールドに event.html から渡された値をセット
  if (passphrase) {
    document.getElementById('f-passphrase').value = decodeURIComponent(passphrase);
  }

  try {
    var res = await http('/api/events/' + eventId);
    if (!res.ok) { location.href = '/'; return; }
    var ev = res.data;
    populate(ev);
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('form-section').classList.remove('hidden');
  } catch (e) {
    location.href = '/';
  }
}

/* ── フォームにデータをセット ─────────────────────────────────── */
function populate(ev) {
  document.getElementById('f-title').value          = ev.title          || '';
  document.getElementById('f-date').value           = ev.date           || '';
  document.getElementById('f-time').value           = ev.time           || '';
  document.getElementById('f-location').value       = ev.location       || '';
  document.getElementById('f-description').value    = ev.description    || '';
  document.getElementById('f-organizer-name').value = ev.organizer_name || '';
  document.getElementById('f-organizer-email').value= ev.organizer_email|| '';

  // deadline: "2025-06-01 18:00:00" → "2025-06-01T18:00"
  if (ev.deadline) {
    var dl = ev.deadline.replace(' ', 'T').substring(0, 16);
    document.getElementById('f-deadline').value = dl;
  }
}

/* ── 保存 ────────────────────────────────────────────────────── */
async function submitEdit() {
  var title          = document.getElementById('f-title').value.trim();
  var date           = document.getElementById('f-date').value;
  var time           = document.getElementById('f-time').value;
  var location       = document.getElementById('f-location').value.trim();
  var description    = document.getElementById('f-description').value.trim();
  var deadline       = document.getElementById('f-deadline').value;
  var organizerName  = document.getElementById('f-organizer-name').value.trim();
  var organizerEmail = document.getElementById('f-organizer-email').value.trim();
  var pass           = document.getElementById('f-passphrase').value;

  var errEl = document.getElementById('form-error');
  errEl.classList.add('hidden');

  if (!title || !date || !deadline || !organizerName || !organizerEmail || !pass) {
    errEl.textContent = '必須項目（*）をすべて入力してください';
    errEl.classList.remove('hidden');
    return;
  }

  var btn = document.getElementById('submit-btn');
  btn.disabled    = true;
  btn.textContent = '保存中...';

  try {
    var res = await http('/api/events/' + eventId, {
      method: 'PUT',
      body: JSON.stringify({
        title, date, time, location, description,
        deadline:       deadline.replace('T', ' '),
        organizer_name: organizerName,
        organizer_email: organizerEmail,
        passphrase: pass,
      }),
    });

    if (!res.ok) {
      errEl.textContent = res.data.error || '保存に失敗しました';
      errEl.classList.remove('hidden');
      btn.disabled    = false;
      btn.textContent = '変更を保存する';
      return;
    }

    document.getElementById('form-section').classList.add('hidden');
    document.getElementById('done-section').classList.remove('hidden');

  } catch (e) {
    errEl.textContent = '通信エラーが発生しました';
    errEl.classList.remove('hidden');
    btn.disabled    = false;
    btn.textContent = '変更を保存する';
  }
}

init();
