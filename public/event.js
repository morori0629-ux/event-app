/* ═══════════════════════════════════════════════════════════════
   event.js — イベント詳細ページ (event.html)
   依存: http.js
═══════════════════════════════════════════════════════════════ */

var eventId   = qp('id');
var eventData = null;   // グローバルにイベント情報を保持
var cancelUrl = '';     // 登録完了後のキャンセルリンク

/* ─── 初期化 ─────────────────────────────────────────────────── */
async function init() {
  if (!eventId) {
    document.getElementById('loading').textContent = 'イベントIDが指定されていません。';
    return;
  }

  try {
    var r1 = await http('/api/events/'          + eventId);
    var r2 = await http('/api/events/' + eventId + '/participants');
    var r3 = await http('/api/events/' + eventId + '/comments');

    if (!r1.ok) {
      document.getElementById('loading').textContent =
        r1.data.error || 'イベントが見つかりません。';
      return;
    }

    eventData = r1.data;
    renderEvent(eventData);
    renderParticipants(r2.data || []);
    renderComments(r3.data || []);

    document.getElementById('loading').classList.add('hidden');
    document.getElementById('event-content').classList.remove('hidden');

  } catch (err) {
    document.getElementById('loading').textContent =
      'データの読み込みに失敗しました。ページを再読み込みしてください。';
    console.error(err);
  }
}

/* ─── イベント詳細レンダリング ─────────────────────────────────── */
function renderEvent(ev) {
  document.getElementById('header-title').textContent = ev.title;
  document.title = ev.title + ' | イベント管理';

  // バッジ
  var badge = deadlineBadge(ev.deadline);
  var badgeEl = document.getElementById('deadline-badge');
  badgeEl.textContent = badge.text;
  badgeEl.className   = 'badge ' + badge.cls;

  // 各フィールド
  document.getElementById('ev-datetime').textContent  = fmtDateTime(ev.date, ev.time);
  document.getElementById('ev-location').textContent  = ev.location  || '未定';
  document.getElementById('ev-organizer').textContent = ev.organizer_name;

  var dlDate = new Date(ev.deadline);
  document.getElementById('ev-deadline').textContent = dlDate.toLocaleString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  // 説明文
  var descEl = document.getElementById('ev-description');
  if (ev.description) {
    descEl.className   = 'event-description';
    descEl.textContent = ev.description;
  }

  // 参加ボタン or 期限切れバナー
  var now = new Date();
  if (new Date(ev.deadline) > now) {
    document.getElementById('participate-section').classList.remove('hidden');
    document.getElementById('modal-event-title').textContent = ev.title;
  } else {
    document.getElementById('deadline-banner').classList.remove('hidden');
  }
}

/* ─── 参加者リスト ─────────────────────────────────────────────── */
function renderParticipants(list) {
  var ul  = document.getElementById('participant-list');
  var cnt = document.getElementById('participant-count');
  cnt.textContent = list.length;

  if (!list.length) {
    ul.innerHTML = '<li class="empty-list-msg">まだ参加者はいません</li>';
    return;
  }

  ul.innerHTML = list.map(function (p, i) {
    var initial = (p.name || '?').charAt(0);
    var regDate = new Date(p.registered_at).toLocaleString('ja-JP', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    return '<li class="participant-item">' +
      '<div class="p-avatar" style="background:' + avatarColor(i) + '">' + esc(initial) + '</div>' +
      '<div class="p-info">' +
        '<div class="p-name">' + esc(p.name) + '</div>' +
        '<div class="p-date">' + regDate + ' 登録</div>' +
      '</div>' +
    '</li>';
  }).join('');
}

function avatarColor(i) {
  var colors = ['#4f46e5','#7c3aed','#0ea5e9','#10b981','#f59e0b','#ef4444'];
  return colors[i % colors.length];
}

/* ─── コメント ─────────────────────────────────────────────────── */
function renderComments(list) {
  var ul  = document.getElementById('comment-list');
  var cnt = document.getElementById('comment-count');
  cnt.textContent = list.length;

  if (!list.length) {
    ul.innerHTML = '<li class="empty-list-msg">コメントはまだありません</li>';
    return;
  }

  ul.innerHTML = list.map(function (c) {
    var initial  = (c.author_name || '?').charAt(0);
    var cDate    = new Date(c.created_at).toLocaleString('ja-JP', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    return '<li class="comment-item">' +
      '<div class="c-avatar">' + esc(initial) + '</div>' +
      '<div class="c-bubble">' +
        '<div class="c-header">' +
          '<span class="c-author">' + esc(c.author_name) + '</span>' +
          '<span class="c-date">'   + cDate + '</span>' +
        '</div>' +
        '<div class="c-text">' + esc(c.content) + '</div>' +
      '</div>' +
    '</li>';
  }).join('');
}

async function postComment() {
  var author  = document.getElementById('comment-author').value.trim();
  var content = document.getElementById('comment-content').value.trim();
  var errEl   = document.getElementById('comment-error');

  errEl.classList.add('hidden');
  if (!author || !content) {
    errEl.textContent = '名前とコメントを入力してください';
    errEl.classList.remove('hidden');
    return;
  }

  try {
    var res = await http('/api/events/' + eventId + '/comments', {
      method: 'POST',
      body: { author_name: author, content: content }
    });

    if (!res.ok) {
      errEl.textContent = res.data.error || 'コメントの投稿に失敗しました';
      errEl.classList.remove('hidden');
      return;
    }

    document.getElementById('comment-author').value  = '';
    document.getElementById('comment-content').value = '';
    showToast('コメントを投稿しました');

    // コメント一覧を再取得
    var r = await http('/api/events/' + eventId + '/comments');
    renderComments(r.data || []);

  } catch (err) {
    errEl.textContent = '通信エラーが発生しました';
    errEl.classList.remove('hidden');
    console.error(err);
  }
}

/* ─── タブ切り替え ─────────────────────────────────────────────── */
function switchTab(name) {
  var tabs = ['participants', 'comments'];
  tabs.forEach(function (t) {
    var content = document.getElementById('tab-' + t);
    var btn     = document.getElementById('tab-btn-' + t);
    if (t === name) {
      content.classList.remove('hidden');
      btn.classList.add('active');
    } else {
      content.classList.add('hidden');
      btn.classList.remove('active');
    }
  });
}

/* ─── 参加登録モーダル ────────────────────────────────────────── */
function openParticipateModal() {
  document.getElementById('p-name').value  = '';
  document.getElementById('p-email').value = '';
  document.getElementById('participate-error').classList.add('hidden');
  document.getElementById('modal-participate').classList.remove('hidden');
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

async function submitParticipation() {
  var name   = document.getElementById('p-name').value.trim();
  var email  = document.getElementById('p-email').value.trim();
  var errEl  = document.getElementById('participate-error');

  errEl.classList.add('hidden');
  if (!name) {
    errEl.textContent = 'お名前を入力してください';
    errEl.classList.remove('hidden');
    return;
  }

  try {
    var res = await http('/api/events/' + eventId + '/participants', {
      method: 'POST',
      body: { name: name, email: email }
    });

    if (!res.ok) {
      errEl.textContent = res.data.error || '登録に失敗しました';
      errEl.classList.remove('hidden');
      return;
    }

    cancelUrl = res.data.cancelUrl;

    // 参加登録モーダルを閉じてキャンセルリンクモーダルを開く
    closeModal('modal-participate');
    document.getElementById('cancel-link-url').textContent = cancelUrl;
    document.getElementById('cancel-link-url').href        = cancelUrl;
    document.getElementById('modal-cancel-link').classList.remove('hidden');

    // 参加者リストを再取得
    var r = await http('/api/events/' + eventId + '/participants');
    renderParticipants(r.data || []);

  } catch (err) {
    errEl.textContent = '通信エラーが発生しました';
    errEl.classList.remove('hidden');
    console.error(err);
  }
}

function closeCancelLinkModal() {
  closeModal('modal-cancel-link');
  showToast('参加登録が完了しました 🎉');
}

function copyCancelLink() {
  if (navigator.clipboard && cancelUrl) {
    navigator.clipboard.writeText(cancelUrl)
      .then(function () { showToast('リンクをコピーしました 📋'); })
      .catch(function () { fallbackCopy(cancelUrl); });
  } else {
    fallbackCopy(cancelUrl);
  }
}

function fallbackCopy(text) {
  var ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity  = '0';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
  showToast('リンクをコピーしました 📋');
}

/* ─── イベント編集（幹事用） ─────────────────────────────────── */
function toggleEditForm() {
  var form = document.getElementById('edit-form');
  form.classList.toggle('hidden');
  // 削除フォームが開いていたら閉じる
  document.getElementById('delete-form').classList.add('hidden');
}

function goToEdit() {
  var pass  = document.getElementById('edit-passphrase').value;
  var errEl = document.getElementById('edit-passphrase-error');
  errEl.classList.add('hidden');
  if (!pass) {
    errEl.textContent = '合言葉を入力してください';
    errEl.classList.remove('hidden');
    return;
  }
  // 合言葉をクエリパラメータで渡す（edit.jsでフォームにセット）
  location.href = '/edit.html?id=' + encodeURIComponent(eventId) +
                  '&pass=' + encodeURIComponent(pass);
}

/* ─── イベント削除（幹事用） ─────────────────────────────────── */
function toggleDeleteForm() {
  var form = document.getElementById('delete-form');
  form.classList.toggle('hidden');
}

async function deleteEvent() {
  var passphrase = document.getElementById('delete-passphrase').value;
  var errEl      = document.getElementById('delete-error');

  errEl.classList.add('hidden');
  if (!passphrase) {
    errEl.textContent = '合言葉を入力してください';
    errEl.classList.remove('hidden');
    return;
  }

  if (!confirm('このイベントを完全に削除しますか？\n参加者リスト・コメントもすべて削除されます。')) {
    return;
  }

  try {
    var res = await http('/api/events/' + eventId, {
      method: 'DELETE',
      body: { passphrase: passphrase }
    });

    if (!res.ok) {
      errEl.textContent = res.data.error || '削除に失敗しました';
      errEl.classList.remove('hidden');
      return;
    }

    showToast('イベントを削除しました');
    setTimeout(function () { location.href = '/'; }, 1000);

  } catch (err) {
    errEl.textContent = '通信エラーが発生しました';
    errEl.classList.remove('hidden');
    console.error(err);
  }
}

/* ─── 起動 ──────────────────────────────────────────────────── */
init();
