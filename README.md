# 📅 グループイベント管理アプリ

社外グループメンバー向けのスマホ対応イベント管理Webアプリです。

---

## ✨ 機能一覧

| 機能 | 説明 |
|------|------|
| イベント作成 | タイトル・日時・場所・説明・申込期限・合言葉・幹事情報を登録 |
| 参加登録 | 名前（＋任意のメール）を入力するだけで参加申し込み |
| 参加キャンセル | 登録時に発行されるリンクからキャンセル可能 |
| コメント機能 | イベントページで質問・連絡をやり取り |
| 複数イベント管理 | 1つのURLで複数イベントを一元管理 |
| 申込期限管理 | 期限切れはバッジで表示、ボタンも自動で非表示に |
| メール通知 | 参加登録時に幹事へ通知メール（SMTP設定時） |

---

## 🚀 セットアップ手順

### 1. Node.js のインストール
[Node.js](https://nodejs.org/) v18以上をインストールしてください。

### 2. 依存パッケージのインストール
```bash
cd event-app
npm install
```

### 3. 環境変数の設定（メール通知を使う場合）

`.env` ファイルを作成して以下を設定します：

```
PORT=3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
```

> **Gmail を使う場合のポイント**
> - Google アカウントで「2段階認証」を有効にする
> - 「アプリパスワード」を発行して `SMTP_PASS` に設定する
> - メール通知が不要な場合は `.env` を作成しなくてもアプリは動作します

### 4. アプリを起動
```bash
npm start
```

ブラウザで `http://localhost:3000` を開いてください。

---

## 📱 スマホで使う方法

1. PCとスマホを同じWi-Fiに接続する
2. PCのIPアドレスを確認（例：`192.168.1.10`）
3. スマホのブラウザで `http://192.168.1.10:3000` にアクセス

**外部公開（インターネット経由）する場合は [Railway](https://railway.app/) や [Render](https://render.com/) などのホスティングサービスを利用してください。**

---

## 📁 ファイル構成

```
event-app/
├── server.js          # Expressサーバー・APIルート
├── db.js              # SQLiteデータベース設定
├── mailer.js          # メール通知（Nodemailer）
├── package.json
├── events.db          # データベースファイル（自動生成）
└── public/
    ├── index.html     # イベント一覧ページ
    ├── event.html     # イベント詳細ページ
    ├── create.html    # イベント作成ページ
    ├── cancel.html    # 参加キャンセルページ
    ├── style.css      # 共通スタイル（スマホ最適化）
    ├── http.js        # 共通HTTPクライアント・ユーティリティ
    ├── app.js         # 一覧ページ JavaScript
    ├── event.js       # 詳細ページ JavaScript
    ├── create.js      # 作成ページ JavaScript
    └── cancel.js      # キャンセルページ JavaScript
```

---

## 🔒 セキュリティについて

- イベント作成には **合言葉（パスフレーズ）** が必要です（SHA-256ハッシュで保存）
- 参加キャンセルは登録時に発行される **ランダムトークン付きURL** からのみ可能
- イベント削除も合言葉が必要です

---

## 🌐 外部公開（Railway を使った例）

```bash
# Railwayにデプロイ
npm install -g @railway/cli
railway login
railway init
railway up
```

デプロイ後、Railway のダッシュボードから環境変数（SMTP設定など）を設定してください。

---

## 📝 使い方

1. **グループメンバーに URL を共有する**
2. **誰でもイベントを作成できる**（合言葉を設定して幹事のみが管理可能）
3. **参加したいイベントをタップ** → 名前を入力して参加登録
4. **キャンセルリンク** を保存しておく（メールでも受け取れる）
5. **コメント欄** で質問・連絡を共有
