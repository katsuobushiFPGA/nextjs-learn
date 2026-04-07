# Next.js の仕組みまとめ

## 1. プリフェッチ

### 概要
ユーザーがリンクをクリックする前に、バックグラウンドで次のルートのデータを先読みする仕組み。

### 通常のナビゲーション vs プリフェッチ

```
【通常】
クリック → リクエスト送信 → サーバー処理 → レスポンス受信 → 画面更新
         ←────── この時間がローディングになる ──────→

【プリフェッチあり】
リンクが画面に見える → バックグラウンドで先読み開始
       ↓
    データがキャッシュに溜まる
       ↓
  クリック → 既にデータがある → 即座に画面更新
```

### 主語はクライアント
プリフェッチは**クライアント主導**の動き。サーバーはリクエストが来たら返すだけで、プリフェッチかどうかすら知らない。

```
クライアント:「このリンクが見えた、プリフェッチしよう」← クライアントの判断
　↓
クライアント: リクエスト送信（fetch API）
　↓
サーバー: 「リクエスト来たから返す」← プリフェッチかどうか関係ない
```

### タイミング
現在のページの表示が終わったあと、`requestIdleCallback` などを使ってブラウザの空き時間に実行される。初回表示を邪魔しない。

### 静的ルートと動的ルートの違い

| ルートの種類 | プリフェッチの内容 |
|---|---|
| 静的（Static） | ページ全体を先読み |
| 動的（Dynamic） | レイアウト部分だけ先読み（データは先読みしない） |

### サーバー負荷への対策
- ビューポートに入ったリンクだけプリフェッチ
- 同じURLへの重複リクエストはまとめる
- 静的/動的で先読み範囲を制限

### 無効化
```tsx
<Link href="/heavy-page" prefetch={false}>
  重いページ
</Link>
```

### ホバー時のみプリフェッチ（リソース節約）
```tsx
'use client'
import Link from 'next/link'
import { useState } from 'react'

function HoverPrefetchLink({ href, children }) {
  const [active, setActive] = useState(false)

  return (
    <Link
      href={href}
      prefetch={active ? null : false}
      onMouseEnter={() => setActive(true)}
    >
      {children}
    </Link>
  )
}
```

### プリフェッチの識別
DevToolsのNetworkタブでヘッダーを確認できる：

| ヘッダー | 意味 |
|---|---|
| `next-router-prefetch` | プリフェッチのリクエストだという印 |
| `rsc` | RSC Payloadを要求している |
| `next-router-state-tree` | 現在のルーター状態をサーバーに伝える（差分だけ返してもらうため） |
| `next-router-segment-prefetch` | セグメント単位のプリフェッチ |

### エラー時の挙動
```
プリフェッチ → 404/503
      ↓
キャッシュなし
      ↓
ユーザーがクリック → 普通にリクエスト → そこで初めてエラー画面を表示
```
現在のページへの影響はない。

---

## 2. ストリーミング

### 概要
1つのページのHTMLを分割して送る仕組み。準備できたものから順番にクライアントへ流し込む。

### 動的ルートでのプリフェッチ＋ストリーミング

```
プリフェッチで先に取得するもの
├── 共有レイアウト（header, sidebarなど）
└── loading.tsx のフォールバックUI（スケルトン）

クリック後に初めて取得するもの
└── page.tsx の実際のコンテンツ（データが必要な部分）
```

```
クリック
  ↓
レイアウト＋スケルトンを即表示（プリフェッチ済みのもの）
  ↓（バックグラウンドでデータ取得）
コンテンツに差し替え
```

### スケルトン→コンテンツの差し替えの仕組み
サーバーはスケルトンの後にscriptタグごと送ってくる。ReactがそのDOMを書き換える。

```html
<!-- 最初に送られるもの -->
<div id="suspense-placeholder">スケルトンUI</div>

<!-- データ準備後に追加で送られるもの -->
<template id="real-content">実際のコンテンツ</template>
<script>
  placeholder.replaceWith(realContent)
</script>
```

### 通信の仕組み：Chunked Transfer Encoding

```
クライアント: GET /page リクエスト

サーバー: HTTP/1.1 200 OK
          Transfer-Encoding: chunked  ← 分割送信の宣言

          [chunk1] レイアウト+スケルトン → 送信
          ...接続はまだ閉じない...
          [chunk2] 実際のコンテンツ+script → 送信
          [chunk終了の合図] → 接続クローズ
```

- 1リクエスト・1レスポンス（ただし分割して届く）
- 再接続でも再利用でもなく**1本つなぎっぱなし**
- ステートレスの原則とは矛盾しない（1リクエストに対して1レスポンスは変わらない）

---

## 3. クライアント側トランジション

### 概要
`<Link>` コンポーネントを使ったナビゲーションはフルリロードしない。

- 共有レイアウトとUIを保持
- 現在のページをプリフェッチ済みのコンテンツに置き換える
- SPAのような体験をSSRアプリで実現

### Next.jsが目指すもの

| | 初回表示 | SEO | 遷移体験 |
|---|---|---|---|
| 従来のSSR | 速い | 強い | フルリロードで遅い |
| 従来のSPA | 遅い | 弱い | サクサク |
| **Next.js** | **速い** | **強い** | **サクサク** |

---

## 4. Server Component と Client Component

### 境界の意識

```
Server Component（デフォルト）
├── DBアクセス・API呼び出し
├── SEOが必要なコンテンツ
└── インタラクションが不要な部分

Client Component（'use client'をつける）
├── useState / useEffect を使う部分
├── クリック・入力などのイベント処理
└── ブラウザAPIを使う部分
```

### Server Componentの立ち位置

```
ブラウザ（クライアント）
　↕
Next.jsサーバー ← Server Componentはここ（フロントエンドサーバー）
　↕
バックエンドサーバー（API / DB）
　↕
DB
```

Server Componentはバックエンドではなく、**バックエンドとクライアントの間にいるフロントエンドサーバー**。

---

## 5. ハイドレーション

### 概要
サーバーが生成した静的なHTMLにReactが命を吹き込む処理。

```
1. サーバーがHTMLを生成して送る（静的なHTML）
　↓
2. ブラウザがHTMLを表示（見えるけど操作できない）
　↓
3. JavaScriptが読み込まれる
　↓
4. ReactがそのHTMLを「管理下に置く」← ハイドレーション
　↓
5. クリックなどのイベントが動くようになる
```

乾燥した状態（静的HTML）に水（JavaScript）を加えて活性化させるイメージ。

### プリフェッチとの関係
`<Link>` はClient Componentのため、ハイドレーション完了前はプリフェッチが発火しない。JSバンドルが大きいとハイドレーションが遅れ、プリフェッチの恩恵を受けられるタイミングも遅くなる。

---

## 6. generateStaticParams

### 概要
動的セグメントのパラメータをビルド時に確定させて、静的ファイルとして事前生成する。

```
app/hotels/[id]/page.tsx
```

```ts
export async function generateStaticParams() {
  const hotels = await db.hotels.findMany()
  return hotels.map(hotel => ({ id: hotel.id }))
}
```

### なしとありの違い

```
【なし】
リクエスト時: ユーザーが /hotels/123 にアクセス → そのタイミングで初めてレンダリング → 遅い

【あり】
ビルド時: /hotels/1, /hotels/2, /hotels/3... を静的ファイルとして生成済み
リクエスト時: 作っておいたファイルを返すだけ → 爆速
```

「ビルド時に作れるものは作っておく、作れないものだけ実行時に作る」が基本思想。

---

## 7. リアルタイム通信の選択肢

### 比較

| 方式 | 仕組み | 向いているケース |
|---|---|---|
| ポーリング | 数秒ごとにAPIを叩き続ける | 多少の遅延が許容できる |
| SSE | サーバーからの一方向ストリーム | サーバー→クライアントだけでいい |
| WebSocket | 双方向リアルタイム通信 | 本格的なリアルタイムチャット |

### SSE（Server-Sent Events）

サーバーからクライアントへの**一方向ストリーム通信**。Chunked Transferと同じ原理。

```
Content-Type: text/event-stream
```

- ブラウザが切断時に**自動再接続**してくれる
- 実装がシンプル
- WebSocketより低負荷

### チャットでの使い方

```
送信: POST /messages（普通のAPIリクエスト）
受信待機: GET /events（SSEで繋ぎっぱなし）

Aさんがメッセージ送信
　↓
サーバーがDBに保存
　↓
SSEでBさんに通知
　↓
BさんのブラウザがAPIから取得して表示
```

ChatGPTの回答がストリームで少しずつ表示される動きもSSEで実装されている。

### WebSocketが必要なケース
ゲームのリアルタイム同期など、**双方向の通信が真に必要な場合のみ**。

### VercelとWebSocket
VercelはサーバーレスでリクエストごとにFunctionが起動・終了するため、常時接続が必要なWebSocketとは相性が悪い。WebSocketが必要な場合はFly.ioやRailwayなど常駐プロセスが動くサービスか、Pusher/Ablyなどのサービスに切り出すのが一般的。

---

## 8. Next.jsのアーキテクチャ構成

### バックエンドがPHPの場合

```
ブラウザ
　↕
Vercel（Next.js）
　↕
PHP（nginx + php-fpm）on EC2/ECSなど
　↕
DB
```

- Next.js側: 環境変数でエンドポイント管理、特別な設定不要
- Vercel側: 外部への通信は普通に通る（IPは固定ではない）
- PHP側: Client ComponentからAPIを直接叩く場合はCORS設定が必要

```nginx
add_header Access-Control-Allow-Origin "https://your-app.vercel.app";
```

Server Component → PHPの通信はサーバー間通信なのでCORS不要。

### Next.jsでバックエンドを完結させる場合（Route Handlers）

```
app/api/users/route.ts  ← APIエンドポイント
```

```ts
export async function GET() {
  const users = await db.users.findMany()
  return Response.json(users)
}
```

| やること | できるか |
|---|---|
| REST APIの作成 | ⭕ |
| DBアクセス（Prismaなど） | ⭕ |
| 認証（NextAuthなど） | ⭕ |
| バッチ処理 | △（Vercelはタイムアウト制限あり） |
| WebSocket | △（Vercelでは厳しい） |

---

## 9. ブラウザHistory API

### pushState（履歴に追加）
```ts
window.history.pushState(null, '', `?${params.toString()}`)
```
- ページリロードなしでURLを書き換える
- ブラウザバックで戻れる
- ソート・フィルターの状態をURLに反映させるのに使う

### replaceState（履歴を上書き）
```ts
window.history.replaceState(null, '', newPath)
```
- ページリロードなしでURLを書き換える
- ブラウザバックで戻れない
- ロケール切り替えなど「戻る」が不自然なケースに使う

### router.push() との違い

| | サーバーへのリクエスト | 用途 |
|---|---|---|
| `router.push()` | 発生する | ページ遷移 |
| `window.history.pushState` | 発生しない | URLだけ変えたい |

