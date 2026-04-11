# Next.js 16：Cache Components と Partial Prerendering (PPR)

---

## エグゼクティブ・サマリー

Next.js 16 は「Cache Components」を導入し、レンダリングとキャッシングの設計思想を根本的に転換した。

| 以前 | Next.js 16 |
|---|---|
| デフォルトで静的 | **デフォルトで動的** |
| ルート単位のキャッシュ制御 | コンポーネント・関数単位の細かい制御 |
| 全か無かのレンダリング選択 | 静的シェル + 動的ストリーミングの併用 |

`use cache`ディレクティブと`Suspense`境界を組み合わせることで、キャッシュする部分とストリーミングする部分を細かく制御できる。

---

## 1. レンダリングを制御する3つのツール

### 1-1. ランタイムデータのための Suspense（守り）

`cookies()`・`headers()`・`searchParams`など、リクエスト時にしか判明しない情報を使うコンポーネントをSuspenseでラップする。それ以外の部分を静的シェルとして事前レンダリングできる。

```tsx
export default function Page() {
  return (
    <>
      <StaticHeader />   {/* 静的シェルとして事前レンダリング */}
      <Suspense fallback={<Spinner />}>
        <UserGreeting />  {/* cookies()を使う動的部分 */}
      </Suspense>
    </>
  )
}
```

### 1-2. 動的データのための Suspense（攻め）

`fetch()`・`db.query()`など、リクエスト間で変化するがユーザー固有ではないデータをSuspenseでラップすると、データ準備ができ次第ストリーミングされる。

```tsx
export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <HotelList />  {/* db.queryを内部で使う */}
    </Suspense>
  )
}
```

### 1-3. `use cache`によるキャッシング

関数やコンポーネントに`use cache`を追加すると、その出力がキャッシュされ静的シェルに含まれる。`cacheLife`でライフタイムを制御する。

```tsx
async function getCategories() {
  'use cache'
  cacheLife('hours')
  return await db.query('SELECT * FROM categories')
}
```

> **注意**：`use cache`スコープ内では`cookies()`などのランタイムAPIは使用不可。

---

## 2. Partial Prerendering (PPR) のメカニズム

PPRはCache Componentsの基盤インフラストラクチャ。独立した機能ではなく、`use cache`と`Suspense`によって実現される。

### 処理の流れ

```
ビルド時
  └ Suspense外の静的コンテンツ + fallback UIを静的シェルとしてプリレンダリング

ユーザーアクセス時
  └ 1. 静的シェルを即座に送信（単一HTTPリクエスト）
    2. ブラウザがシェルを表示・アセットをダウンロード
    3. サーバーが動的セグメントをレンダリング（ストリーミング）
    4. fallback UIが最新の動的コンテンツに置き換わる
```

### パフォーマンス上のメリット

- **単一HTTPリクエスト**：静的HTMLと動的要素を1リクエストで送信（`Transfer-Encoding: chunked`）
- **ラウンドトリップ削減**：追加のfetchや接続の張り直しが不要
- **エッジからの即時応答**：静的シェルはCDNから返却される

---

## 3. `use cache`の制約

| 項目 | 詳細 |
|---|---|
| 引数のシリアライズ | プリミティブ・プレーンオブジェクト・配列のみ渡せる |
| 動的入力の制限 | `cookies()`・`headers()`の値を直接引数に渡せない |
| シリアライズ不可能な値 | 中身を見ない（イントロスペクションしない）なら`children`として受け取れる |
| ライフタイム管理 | `cacheLife`で有効期間を定義する |

### シリアライズ可能な型を自前で定義する

```tsx
type Serializable =
  | string
  | number
  | boolean
  | null
  | undefined
  | Serializable[]
  | { [key: string]: Serializable }

async function getHotels(filter: Serializable) {
  'use cache'
  // ...
}
```

---

## 4. キャッシュの更新と再検証

### タグ付けと無効化

```tsx
// タグ付け
async function getHotels() {
  'use cache'
  cacheTag('hotels')
  return await db.query('SELECT * FROM hotels')
}

// 即時無効化
await updateTag('hotels')   // 呼んだ瞬間にキャッシュ消去

// 遅延無効化（Stale-While-Revalidate）
revalidateTag('hotels')     // 次のリクエスト時に再生成
```

### `updateTag` vs `revalidateTag`

| | `updateTag` | `revalidateTag`（SWR） |
|---|---|---|
| 無効化タイミング | 即座 | 次のリクエスト時 |
| 呼んだ直後 | キャッシュ消去 | 古いデータが返る |
| ユーザー体験 | 遅いが常に新しい | 速いが一瞬古い |
| 向いているケース | 空き状況・料金など実害が出るデータ | カテゴリ・説明文など多少の遅延が許容できるデータ |

### 二重の安全網パターン

```
revalidateTagが正常に動いた場合 → 更新時に即反映
revalidateTagが失敗した場合     → TTLで自動回復
```

TTLはあくまで保険。変更頻度に合わせて長めに設定し、`revalidateTag`で更新時に即無効化するのがベストプラクティス。

---

## 5. データの重要性によるキャッシュ戦略

判断基準は「**古いデータを見せたときに実害があるか**」。

| データ種別 | 例 | 戦略 |
|---|---|---|
| 多少古くても問題ない | カテゴリ、エリア情報、説明文 | `use cache` + 長めTTL + `revalidateTag` |
| 更新後すぐ反映が必要 | 会場の空き状況、料金 | `use cache` + 短いTTL + `updateTag` |
| 絶対に古いデータを返したくない | 決済情報、予約確定 | キャッシュしない |

---

## 6. 設定と移行ガイド

### 有効化

```ts
// next.config.ts
const nextConfig = {
  experimental: {
    cacheComponents: true,
  },
}
```

### 既存設定からの移行

| 以前の設定 | Cache Components での扱い |
|---|---|
| `dynamic = "force-dynamic"` | **不要**（デフォルトが動的のため） |
| `dynamic = "force-static"` | **`use cache`に置換**（コンポーネント単位で適用） |
| `revalidate` | **`cacheLife`に置換**（より細かい制御が可能） |
| `fetchCache` | **不要**（`use cache`スコープ内は自動でキャッシュ） |
| `runtime = "edge"` | **非対応**（Node.jsランタイムが必要） |

---

## 7. インフラとのキャッシュ統合

複数のキャッシュ層を全部管理しようとすると複雑さが爆発する。責務を層で分けるのが現実解。

| コンテンツ種別 | CDN（CloudFront等） | 理由 |
|---|---|---|
| JSバンドル・CSS・画像 | ✅ 長期キャッシュ（永続も可） | ハッシュ付きファイル名で自動キャッシュバスティング |
| HTML | ❌ or 極短TTL | 動的に変わるのでNext.jsに任せる |
| APIレスポンス | ❌ | Next.jsのData Cacheで一元管理 |

### Vercelの場合

`revalidateTag`を叩くとVercelのCDNキャッシュも**自動で無効化**される。アプリ側とインフラ側で別々に無効化処理を書く必要がなく、設定コストが大幅に下がる。

---

## 8. エラーの強制とSuspenseの必須化

`use cache`もSuspenseもない非同期処理があるとエラーになる。ページ全体をブロックする状況をNext.jsがコンパイルレベルで防ぐ仕組み。

```
Uncaught Error: Accessed a cached data outside of a <Suspense> boundary.
```

### 修正方法

```tsx
// ① Suspenseでラップ（リクエスト固有のデータの場合）
<Suspense fallback={<Skeleton />}>
  <HotelList />
</Suspense>

// ② use cacheに移動（リクエスト固有でないデータの場合）
async function getHotels() {
  'use cache'
  return await fetch('/api/hotels')
}
```

---

## 9. Next.jsの4つのキャッシュ層（参考）

| キャッシュ | 対象 | 寿命 | 無効化方法 |
|---|---|---|---|
| Router Cache | クライアント側のページ履歴 | 数分〜セッション | セッション終了・revalidate |
| Request Memoization | 同一リクエスト内の重複fetch | 1リクエスト | 自動クリア |
| Data Cache | fetch・`use cache`の結果 | TTL次第（永続も可） | TTL・revalidateTag・revalidatePath |
| Full Route Cache | ページHTML丸ごと | デプロイまで | デプロイ・revalidate |
