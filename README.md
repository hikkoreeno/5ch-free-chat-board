# ☕ Free Chat Board

スターバックス風カフェデザインの匿名掲示板アプリケーション

![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-5.14-2D3748?logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)

## ✨ 特徴

- 🎨 **スターバックス風カフェデザイン** - 温かみのあるグリーン&クリーム配色
- 👤 **匿名投稿** - ユーザー登録不要ですぐに参加可能
- 🔐 **トリップ機能** - `名前#パスワード`で本人証明
- 🔍 **リアルタイム検索** - トピックを即座に検索
- 💬 **アンカー機能** - `>>1`でレス参照、ホバーでポップアップ表示
- 📊 **統計ダッシュボード** - トピック数、投稿数、新着数を表示
- ⬆️ **age/sage機能** - スレッド順位のコントロール

## 🚀 セットアップ

### 必要要件

- Node.js 18以上
- npm または yarn

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/YOUR_USERNAME/free-chat-board.git
cd free-chat-board

# 依存関係をインストール
npm install

# データベースをセットアップ
npx prisma generate
npx prisma db push

# 開発サーバーを起動
npm run dev
```

ブラウザで http://localhost:3000 にアクセス

## 📁 プロジェクト構成

```
├── prisma/
│   └── schema.prisma    # データベーススキーマ
├── src/
│   ├── app/
│   │   ├── api/threads/ # APIエンドポイント
│   │   ├── thread/[id]/ # スレッド詳細ページ
│   │   ├── page.tsx     # トップページ
│   │   └── globals.css  # グローバルスタイル
│   └── lib/
│       ├── bbsUtils.ts  # ユーティリティ関数
│       └── prisma.ts    # Prismaクライアント
└── package.json
```

## 🛠️ 技術スタック

| 技術 | 用途 |
|------|------|
| **Next.js 14** | Reactフレームワーク (App Router) |
| **TypeScript** | 型安全な開発 |
| **Prisma** | ORMとデータベース管理 |
| **SQLite** | 軽量データベース |
| **Tailwind CSS** | スタイリング |

## 📝 主な機能

### トピック作成
- タイトルと本文を入力して新規トピック作成
- トリップ機能で本人証明可能

### コメント投稿
- 匿名でコメント投稿
- `>>番号`でアンカーリンク作成
- sageでスレッド順位を維持

### ID生成
- IPアドレス + 日付 + 板IDからユニークID生成
- 日付変更でIDリセット

## 📜 ライセンス

MIT License

## 🤝 コントリビューション

Issue や Pull Request を歓迎します！
