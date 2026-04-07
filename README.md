# nextjs-learn

Next.js 公式ドキュメントを読み進めながら学習するリポジトリ。

## ディレクトリ構成

```
nextjs-learn/
├── 1_learn/          # 学習ノート（Markdown）
└── my-app/           # 実践用 Next.js アプリ
```

### `1_learn/` — 学習ノート

公式ドキュメントの各章を読んだメモ・要約・AI への質問まとめ。

| ファイル | 内容 |
|---|---|
| `1_installation.md` | インストール・初期設定 |
| `2_project-structure.md` | プロジェクト構造 |
| `3_layouts-and-pages.md` | レイアウトとページ |
| `4_linking-and-navigating.md` | リンクとナビゲーション、プリフェッチ |
| `*_summary_notebooklm.md` | NotebookLM による章まとめ |
| `*_ai_question_summary.md` | AI への質問と回答まとめ |

### `my-app/` — Next.js アプリ

学習内容を試すための実践アプリ。

- **Next.js 16.2.2** / **React 19** / **TypeScript**
- **Tailwind CSS v4** / **ESLint** / **App Router**

#### ルート構成

```
app/
├── layout.tsx               # ルートレイアウト（ナビゲーション含む）
├── page.tsx                 # トップページ（searchParams デモ）
└── blog/
    ├── layout.tsx           # ブログ共通レイアウト
    ├── page.tsx             # ブログ一覧
    └── [slug]/
        ├── page.tsx         # ブログ詳細（動的ルート）
        ├── loading.tsx      # ローディング UI（コメントアウト中）
        └── [slug2]/
            └── page.tsx     # ネストした動的ルート
```

## 開発サーバーの起動

```bash
cd my-app
npm install
npm run dev
```

`http://localhost:3000` でアクセス可能。

## 学習進捗

- [x] インストール・環境構築
- [x] プロジェクト構造
- [x] レイアウトとページ
- [x] リンクとナビゲーション
