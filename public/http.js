/* ═══════════════════════════════════════════════════════════════
   http.js — XMLHttpRequest ラッパー（全ページ共通）
═══════════════════════════════════════════════════════════════ */

/**
 * XHR を Promise でラップした軽量 HTTP クライアント
 * @param {string} url
 * @param {{ method?: string, body?: object }} [opts]
 * @returns {Promise<{ ok: boolean, status: number, data: any }>}
 */
function http(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(opts.method || 'GET', url);

    if (opts.body !== undefined) {
      xhr.setRequestHeader('Content-Type', 'application/json');
    }

    xhr.onload = function () {
      let data = {};
      try { data = JSON.parse(xhr.responseText); } catch (_) { /* ignore */ }
      resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, data });
    };

    xhr.onerror = function () {
      reject(new Error('ネットワークエラーが発生しました'));
    };

    xhr.send(opts.body !== undefined ? JSON.stringify(opts.body) : null);
  });
}

/* ─── 共通ユーティリティ ─────────────────────────────────────── */

/** Toast 通知 */
function showToast(msg, duration) {
  const ms = duration || 2500;
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function () { t.classList.remove('show'); }, ms);
}

/** HTMLエスケープ */
function esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 日時フォーマット */
function fmtDateTime(dateStr, timeStr) {
  if (!dateStr) return '—';
  var iso = dateStr + (timeStr ? 'T' + timeStr : 'T00:00');
  var d = new Date(iso);
  var opts = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' };
  var datePart = d.toLocaleDateString('ja-JP', opts);
  return timeStr ? datePart + ' ' + timeStr : datePart;
}

/** 申込期限のバッジ情報 */
function deadlineBadge(deadline) {
  var now = new Date();
  var d = new Date(deadline);
  var diffH = (d - now) / 3600000;
  if (diffH <= 0)  return { cls: 'badge-closed', text: '締切済み' };
  if (diffH <= 24) return { cls: 'badge-soon',   text: '残り24時間以内' };
  return              { cls: 'badge-open',   text: '参加受付中' };
}

/** URLクエリパラメータ取得 */
function qp(name) {
  return new URLSearchParams(location.search).get(name);
}
