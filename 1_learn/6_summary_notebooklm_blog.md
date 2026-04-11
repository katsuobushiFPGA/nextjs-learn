# Next.js 16が変える「静的 vs 動的」：Cache Components と PPR

---

## 1. 背景：「全か無か」という制約

従来のWeb開発では、ページのレンダリング戦略は二択だった。

| 選択 | メリット | デメリット |
|---|---|---|
| 静的 | 高速な初期表示 | パーソナライズ・リアルタイムデータに欠ける |
| 動的 | 最新データを表示できる | リクエストごとのレンダリングで初期表示が遅い |

Cache ComponentsとPPRはこの対立構造を解体し、単一ページ内で静的と動的を共存させる。

---

## 2. 「デフォルトで動的」への転換

従来のNext.jsは「デフォルトで静的」だった。意図しない静的化によるバグを防ぐため、Next.js 16では**デフォルトで動的**が標準となった。

| 以前 | Next.js 16 |
|---|---|
| 意図せずキャッシュされる不安がある | 明示的に`use cache`を宣言した箇所だけキャッシュされる |
| `dynamic`・`fetchCache`などの複雑な設定が必要 | これらの設定は不要・非推奨になる |

---

## 3. Partial Prerendering（PPR）の仕組み

ページを「静的なシェル（外殻）」と「動的なホール（穴）」に分けて共存させる。

### 処理の流れ

```
1. ユーザーアクセス
   └ エッジネットワークから静的シェルを即座に返す

2. シェル表示中
   └ サーバー側で動的パーツをレンダリング開始

3. ストリーミング
   └ 準備できた動的パーツを同じコネクションで流し込む

4. 完成
   └ fallback UIが最新の動的コンテンツに置き換わる
```

### 単一HTTPリクエストで完結する点が重要

従来は静的な外枠の後に追加のラウンドトリップが発生していた。PPRでは静的HTMLと動的データが**1リクエスト内で完結**する。ブラウザはアイドル時間なしに画像・フォントのダウンロードを開始でき、同じコネクションを通じて動的チャンクが流れ込んでくる。

---

## 4. `use cache`：fetchを超えたキャッシュ制御

`use cache`はキャッシングの対象を「通信（fetch）」から「ロジック（関数）」へ拡張した。データベースクエリや複雑な計算処理そのものをコンポーネント単位でキャッシュできる。

```tsx
async function getHotels(city: string) {
  'use cache'
  cacheLife('hours')
  cacheTag('hotels')
  return await db.query('SELECT * FROM hotels WHERE city = ?', [city])
}
```

### キャッシュの更新

```tsx
// イベント駆動の即時更新
await updateTag('hotels')   // ミューテーション発生時にキャッシュを即破棄

// Stale-While-Revalidate（遅延更新）
revalidateTag('hotels')     // 次のリクエスト時に再生成
```

### 引数のシリアライズ制約

引数はシリアライズ可能（プリミティブ・プレーンオブジェクト・配列）である必要がある。これは「純粋なデータ」に基づくキャッシュであることを保証するガードレール。

---

## 5. Suspense境界の強制：エラーは味方

動的API（`cookies()`・`headers()`など）をSuspense境界の外で使うと開発時にエラーが出る。

```
Uncaught Error: Accessed a cached data outside of a <Suspense> boundary.
```

これは不便な制約ではなく、**ページ全体のレンダリングをブロックしてPPRの恩恵を失わせる実装ミスを防ぐ安全装置**。

### エラーへの対処

```tsx
// ① Suspenseでラップ（リクエスト固有のデータの場合）
<Suspense fallback={<Skeleton />}>
  <UserGreeting />  {/* cookies()を使う */}
</Suspense>

// ② use cacheに移動（リクエスト固有でないデータの場合）
async function getHotels() {
  'use cache'
  return await db.query(...)
}
```

Next.jsはこのエラーを通じて「常に高速なWebサイト」という約束をアーキテクチャレベルで強制している。

---

## 6. まとめ

Cache ComponentsとPPRにより「静的か動的か」という二択は消滅した。

- **静的と動的は対立概念ではなく、単一ページ内で調和する要素になった**
- `use cache`で必要な部分だけ静的化し、残りはStreamingで動的に返す
- Suspense境界の強制により、高速な初期表示がアーキテクチャとして保証される

`next.config.ts`で`cacheComponents: true`を有効にするだけで、コンポーネントごとに最適なレンダリング戦略を選択できる環境が整う。
