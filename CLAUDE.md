# CLAUDE.md

## リポジトリ概要

Next.js 公式ドキュメントの学習リポジトリ。

- `1_learn/` — 学習ノート（編集しない）
- `my-app/` — 実践用 Next.js アプリ（主な作業対象）

## my-app での作業

`my-app/` には `CLAUDE.md` → `AGENTS.md` が存在する。  
**コードを書く前に必ず `my-app/AGENTS.md` を読むこと。**

> このバージョンの Next.js はトレーニングデータと異なる破壊的変更を含む。  
> `node_modules/next/dist/docs/` 内のガイドを参照してからコードを書くこと。

## よく使うコマンド

```bash
cd my-app

npm run dev       # 開発サーバー起動
npm run build     # ビルド
npm run lint      # Lint チェック
npm run lint:fix  # Lint 自動修正
```

## ファイル編集の注意

- `1_learn/` 内のノートは学習記録のため、勝手に書き換えない
- `my-app/README.md` は `create-next-app` 生成のまま維持する
