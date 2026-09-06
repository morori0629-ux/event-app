/* ═══════════════════════════════════════════════════════════════
   create.js — イベント作成ページ (create.html)
   依存: http.js
═══════════════════════════════════════════════════════════════ */

window.addEventListener('DOMContentLoaded', function () {
  // 今日以降の日付のみ選択可能
  var today = new Date().toISOString().split('T')[0];
  document.getElementById('date').min = today;

  // 申込期限のデフォルト値（1週間後）
  var oneWeek = new Date(Date.now() + 7 * 86400000);
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var def = oneWeek.getFullYear() + '-' +
            pad(oneWeek.getMonth() + 1) + '-' +
            pad(oneWeek.getDate()) + 'T' +
            pad(oneWeek.getHours()) + ':' +
            pad(oneWeek.getMinutes());
  document.getElementById('deadline').value = def;
});

function showFormError(msg) {
  var el = document.getElementById('error-msg');
  el.textContent = msg;
  el.classList.remove('hidden');
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideFormError() {
  document.getElementById('error-msg').classList.add('hidden');
}

async function submitCreate() {
  hideFormError();

  var title          = document.getElementById('title').value.trim();
  var date           = document.getElementById('date').value;
  var time           = document.getElementById('time').value;
  var location       = document.getElementById('location').value.trim();
  var description    = document.getElementById('description').value.trim();
  var deadline       = document.getElementById('deadline').value;
  var organizer_name = document.getElementById('organizer_name').value.trim();
  var org_email      = document.getElementById('organizer_email').value.trim();
  var passphrase     = document.getElementById('passphrase').value;

  if (!title)          return showFormError('タイトルを入力してください');
  if (!date)           return showFormError('開催日を選択してください');
  if (!deadline)       return showFormError('申込期限を設定してください');
  if (!organizer_name) return showFormError('幹事名を入力してください');
  if (!org_email)      return showFormError('幹事メールアドレスを入力してください');
  if (!passphrase)     return showFormError('合言葉を入力してください');
  if (passphrase.length < 4) return showFormError('合言葉は4文字以上にしてください');

  var btn = document.getElementById('submit-btn');
  btn.disabled    = true;
  btn.textContent = '作成中...';

  try {
    var res = await http('/api/events', {
      method: 'POST',
      body: {
        title, date, time, location, description, deadline,
        organizer_name: organizer_name,
        organizer_email: org_email,
        passphrase
      }
    });

    if (!res.ok) {
      showFormError(res.data.error || '作成に失敗しました');
      btn.disabled    = false;
      btn.textContent = 'イベントを作成する';
      return;
    }

    showToast('イベントを作成しました 🎉');
    setTimeout(function () {
      location.href = 'event.html?id=' + res.data.id;
    }, 800);

  } catch (err) {
    showFormError('通信エラーが発生しました。もう一度お試しください。');
    btn.disabled    = false;
    btn.textContent = 'イベントを作成する';
    console.error(err);
  }
}
