/* ═══════════════════════════════════════════════════════════════
   app.js — イベント一覧ページ (index.html)
   依存: http.js
═══════════════════════════════════════════════════════════════ */

async function loadEvents() {
  var loading = document.getElementById('loading');
  var list    = document.getElementById('event-list');
  var emptyEl = document.getElementById('empty');

  try {
    var res    = await http('/api/events');
    var events = res.data;

    loading.classList.add('hidden');

    if (!events || !events.length) {
      emptyEl.classList.remove('hidden');
      return;
    }

    // 開催予定 / 開催済み に分類
    var now      = new Date();
    var upcoming = events.filter(function (e) {
      return new Date(e.date) >= now || new Date(e.deadline) >= now;
    });
    var past = events.filter(function (e) {
      return new Date(e.date) < now && new Date(e.deadline) < now;
    });

    list.innerHTML = '';

    if (upcoming.length) {
      list.insertAdjacentHTML('beforeend', '<p class="section-label">開催予定</p>');
      upcoming.forEach(function (e) {
        list.insertAdjacentHTML('beforeend', renderCard(e));
      });
    }
    if (past.length) {
      list.insertAdjacentHTML('beforeend', '<p class="section-label mt-12">開催済み</p>');
      past.forEach(function (e) {
        list.insertAdjacentHTML('beforeend', renderCard(e));
      });
    }

    list.classList.remove('hidden');

  } catch (err) {
    loading.textContent = 'データの読み込みに失敗しました。ページを再読み込みしてください。';
    console.error(err);
  }
}

function renderCard(ev) {
  var badge  = deadlineBadge(ev.deadline);
  var dt     = fmtDateTime(ev.date, ev.time);
  var cnt    = ev.participant_count || 0;
  var dlDate = new Date(ev.deadline);
  var dlText = dlDate.toLocaleString('ja-JP', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  return '<a class="event-card-link" href="event.html?id=' + esc(ev.id) + '">' +
    '<div class="event-card-header">' +
      '<span class="event-card-title">' + esc(ev.title) + '</span>' +
      '<span class="badge ' + badge.cls + '">' + badge.text + '</span>' +
    '</div>' +
    '<div class="event-card-body">' +
      '<div class="event-card-meta">' +
        '<span>📅 ' + esc(dt) + '</span>' +
        (ev.location ? '<span>📍 ' + esc(ev.location) + '</span>' : '') +
      '</div>' +
      '<div class="event-card-footer">' +
        '<span>⏰ 期限: ' + dlText + '</span>' +
        '<span>👥 ' + cnt + ' 名</span>' +
      '</div>' +
    '</div>' +
  '</a>';
}

loadEvents();
