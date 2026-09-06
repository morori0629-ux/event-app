/* ═══════════════════════════════════════════════════════════════
   cancel.js — 参加キャンセルページ (cancel.html)
   依存: http.js
═══════════════════════════════════════════════════════════════ */

var token = qp('token');

function showSection(id) {
  var ids = ['loading', 'confirm-section', 'done-section', 'error-section'];
  ids.forEach(function (s) {
    document.getElementById(s).classList.add('hidden');
  });
  document.getElementById(id).classList.remove('hidden');
}

function init() {
  if (!token) {
    document.getElementById('error-msg-text').textContent =
      'キャンセルリンクが無効です。正しいリンクからアクセスしてください。';
    showSection('error-section');
    return;
  }
  document.getElementById('confirm-msg').textContent =
    '参加登録を取り消します。この操作は元に戻せません。';
  showSection('confirm-section');
}

async function doCancel() {
  var btn = document.getElementById('cancel-btn');
  btn.disabled    = true;
  btn.textContent = 'キャンセル中...';

  try {
    var res = await http('/api/participants/' + encodeURIComponent(token), {
      method: 'DELETE'
    });

    if (!res.ok) {
      document.getElementById('error-msg-text').textContent =
        res.data.error || 'キャンセルに失敗しました';
      showSection('error-section');
      return;
    }

    document.getElementById('done-msg').textContent =
      '「' + esc(res.data.event_title) + '」への参加をキャンセルしました。またのご参加をお待ちしています。';
    showSection('done-section');

  } catch (err) {
    document.getElementById('error-msg-text').textContent =
      '通信エラーが発生しました。もう一度お試しください。';
    showSection('error-section');
    console.error(err);
  }
}

init();
