# Next.js Suspense & キャッシュ設計まとめ

---

## 1. Suspenseの2つの目的：守りと攻め

### 守り：ランタイムデータのためのSuspense

`cookies()`・`headers()`・`searchParams`などはリクエスト時にしか存在しないランタイムデータ。これらを使うコンポーネントがあると、**ページ全体がSSR（毎回オリジン生成）扱い**になる。

Suspenseで切り離すことで、静的部分をCDNキャッシュ可能なまま保てる。

```tsx
export default function Page() {
  return (
    <>
      {/* 静的シェル：ビルド時にHTMLとして生成済み */}
      <StaticHeader />
      <StaticContent />

      {/* 動的部分だけSuspenseで切り離す */}
      <Suspense fallback={<Spinner />}>
        <UserGreeting /> {/* 内部でcookies()を使う */}
      </Suspense>
    </>
  )
}
```

### 攻め：動的データのためのSuspense

`fetch()`・`db.query()`のような非同期処理をSuspenseで囲むと、Streamingが有効になる。

- Suspenseなし：データ取得完了まで何も返せない
- Suspenseあり：静的部分を先に返しながら待てる

| 目的 | Suspenseの役割 |
|---|---|
| 守り（ランタイムデータ） | 静的シェルをSSRに引きずり込まれないようにする |
| 攻め（動的データ） | StreamingでUXを改善する |

---

## 2. Streamingの仕組み

Suspenseを使うと、HTTPレスポンスは`Transfer-Encoding: chunked`で以下のように流れる。

1. リクエスト到達
2. 静的シェルのHTMLを即レスポンス開始
3. ブラウザはfallback（`<Spinner />`など）を表示しつつHTMLを受け取り続ける
4. サーバー側でSuspense内のデータフェッチが完了
5. 差分HTMLをStreamingで追加送信（クライアントからの追加リクエストは不要）
6. ブラウザがfallbackを実際のコンテンツに置き換える

差分はJSの`fetch`ではなく、**最初のHTMLレスポンスのストリームに乗ってくる**。単一のHTTPリクエストで完結するのがポイント。

### タイムアウト

Streamingの差分生成が長引いた場合は複数レイヤーでタイムアウトが発生する。

| レイヤー | 設定例 |
|---|---|
| アプリ側 | `Promise.race`で明示的に制御（推奨） |
| CDN / プロキシ | nginx: `proxy_read_timeout`（デフォルト60s） |
| Next.js（Vercel） | `route.maxDuration`（Proは300s） |

インフラ側のタイムアウトに任せるより、**アプリ側で先に制御してErrorBoundaryに落とす**のが行儀がいい。

---

## 3. `use cache`ディレクティブ

関数やコンポーネントの結果をキャッシュする宣言。引数がキャッシュキーに自動で含まれる。

```tsx
async function getProducts(categoryId: string) {
  'use cache'
  cacheLife('hours')
  const data = await db.query('SELECT * FROM products WHERE category = ?', [categoryId])
  return data
}
```

### 制約：引数はシリアライズ可能である必要がある

キャッシュキーの生成とキャッシュ値の永続化のために、引数と戻り値はシリアライズ可能である必要がある。

- ✅ プリミティブ、プレーンオブジェクト、配列
- ❌ 関数、クラスインスタンス、`Date`インスタンスなど

TypeScriptで型として防ぐには`Serializable`型を自前定義する。

```tsx
type Serializable =
  | string
  | number
  | boolean
  | null
  | undefined
  | Serializable[]
  | { [key: string]: Serializable }
```

### イントロスペクションなしであればシリアライズ不可能な値も受け取れる

中身を見ない（キャッシュキーに使わない）なら渡せる。`children`を受け取るレイアウトコンポーネントが典型例。

```tsx
async function CachedLayout({ children }: { children: React.ReactNode }) {
  'use cache'
  cacheLife('hours')
  return (
    <div className="layout">
      <Header />
      {children} {/* そのまま流すだけ。キャッシュキーに使っていない */}
    </div>
  )
}
```

---

## 4. Suspense と `use cache` の使い分け

`use cache`のないコンポーネントでSuspenseもない非同期処理があるとエラーになる。これはページ全体をブロックしてしまう状況をNext.jsが強制的に防ぐ仕組み。

| 状況 | 対処 |
|---|---|
| `cookies()`・`params`などリクエストごとに変わるデータ | **Suspense**一択（`use cache`はランタイムAPI使用不可） |
| 誰が叩いても同じ結果のデータ | **`use cache`**が望ましい（静的シェルに含まれるので速い） |
| 同上だがキャッシュしたくない | **Suspense** |

---

## 5. Next.jsの4つのキャッシュ層

| キャッシュ | 対象 | 寿命 | 無効化方法 |
|---|---|---|---|
| Router Cache | クライアント側のページ履歴 | 数分〜セッション | セッション終了・revalidate |
| Request Memoization | 同一リクエスト内の重複fetch | 1リクエスト | 自動クリア |
| Data Cache | fetch・`use cache`の結果 | TTL次第（永続も可） | TTL・revalidateTag・revalidatePath |
| Full Route Cache | ページHTML丸ごと | デプロイまで | デプロイ・revalidate |

---

## 6. タグ付けと再検証

```tsx
// タグ付け
async function getHotels() {
  'use cache'
  cacheTag('hotels')
  return await db.query('SELECT * FROM hotels')
}

// 即時無効化（updateTag）
await updateTag('hotels') // 呼んだ瞬間にキャッシュ消去

// 遅延無効化（revalidateTag）
revalidateTag('hotels') // 次のリクエスト時に再生成
```

### Stale-While-Revalidate（SWR）

`revalidateTag`はSWR動作をする。「古いデータをとりあえず返しながら、裏で新しいデータを取得する」戦略。

```
1回目 → キャッシュなし → DBアクセス → 返す＆キャッシュ保存
2回目 → 古いデータを即返す ＋ 裏でDB再取得
3回目 → 新しいデータを返す
```

| | revalidateTag（SWR） | updateTag |
|---|---|---|
| 呼んだ直後 | 古いデータが返る | キャッシュ消去 |
| ユーザー体験 | 速いが一瞬古い | 遅いが常に新しい |

---

## 7. キャッシュ戦略の設計指針

### データの重要性で判断する

「古いデータを見せたときに実害があるか」が判断基準。

| データ種別 | 例 | 戦略 |
|---|---|---|
| 多少古くても問題ない | カテゴリ、エリア情報 | `use cache` + 長めのTTL + `revalidateTag` |
| 更新したらすぐ反映したい | 会場の空き状況、料金 | `use cache` + 短いTTL + `updateTag` |
| 絶対に古いデータを返したくない | 決済情報、予約確定 | キャッシュしない |

### TTLの考え方

変更頻度が低いデータは長いTTLでいい。`revalidateTag`で更新時に即無効化できるなら、TTLはあくまで保険。

- マスターデータ（カテゴリ等） → 24時間〜1週間
- 更新機能あり → TTL長め（24時間） + `revalidateTag`で更新時に無効化

---

## 8. インフラとのキャッシュ統合

### キャッシュの責務を層で分ける

複数のキャッシュ層を全部使おうとすると無効化の複雑さが爆発する。シンプルな設計方針：

| コンテンツ種別 | CloudFrontキャッシュ | 理由 |
|---|---|---|
| JSバンドル・CSS・画像 | ✅ 長期（永続も可） | ハッシュ付きファイル名でキャッシュバスティング自動 |
| HTML | ❌ or 極短TTL | 動的に変わるのでNext.jsに任せる |
| APIレスポンス | ❌ | Next.jsのData Cacheで管理 |

### Vercelの場合

VercelはNext.jsと同じ会社なので、`revalidateTag`を叩くとVercelのCDNキャッシュも自動で無効化される。HTMLとAPIの無効化連携が不要になる分、設定コストが大幅に下がる。

---

## 9. Cache Componentsによる設計思想の変化

| | Cache Components以前 | Cache Components以降 |
|---|---|---|
| デフォルト | 静的（オプトアウト静的） | 動的（オプトイン静的） |
| 制御の粒度 | ルート（ページ）単位 | 関数・コンポーネント単位 |
| キャッシュ対象 | `fetch`のみ | 全サーバーIO（db.query等も可） |
| ネストされたfetchの影響 | ページ全体が意図せず動的になることがある | `use cache`境界で影響範囲が明示的 |

### PPRとの関係

PPR（Partial Prerendering）はアーキテクチャの概念そのものであり、Cache Componentsはその実装手段。

```
PPR = 静的シェルを即返して動的部分をStreamingで流す仕組み
use cache + Suspense = PPRを実現するための具体的な道具
```
