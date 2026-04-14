# Next.jsにおけるキャッシングと再検証

## 1. データ取得におけるキャッシング戦略

### fetch APIによる制御

- デフォルトでは `fetch` リクエストはキャッシュされない
- `cache: 'force-cache'` を指定することでキャッシュ有効化
- fetchをキャッシュしない設定でもNext.jsはルートをプリレンダリングしHTMLをキャッシュする
  - 完全に動的なルートにしたい場合は `connection` APIを使う

### 時間ベースの再検証

```ts
fetch('https://...', { next: { revalidate: 3600 } })
```

---

## 2. 任意の非同期関数のキャッシング：unstable_cache

DBクエリや外部ライブラリなど、fetchを使わない非同期処理をキャッシュする場合に使用。

```ts
unstable_cache(
  async () => { /* キャッシュ対象の関数 */ },
  ['cache-key'],         // キャッシュキー（一意に識別するための配列）
  {
    tags: ['tag-name'],  // 再検証用タグ
    revalidate: 3600,    // 有効期限（秒）
  }
)
```

---

## 3. オンデマンド再検証

### revalidateTag

タグベースでキャッシュエントリを再検証する。

| モード | 動作 |
|---|---|
| `profile="max"`（推奨） | SWR：バックグラウンドで新データ取得中、古いコンテンツを提供 |
| 引数なし（非推奨） | キャッシュを即時期限切れにする従来の動作 |

`fetch`（`next.tags`経由）と `unstable_cache`（`tags`オプション経由）の両方が対象。

### revalidatePath

特定のパスに紐づくキャッシュを再検証する。Route HandlerまたはServer Action内で使用。

---

## 4. updateTag：即時期限切れと整合性の確保

Server Action内での「自分の書き込み直後の読み取り（read-after-write）」に特化したAPI。

- キャッシュエントリを**即時**期限切れにする
- **Server Action内でのみ**使用可能
- 作成直後のデータをすぐにUIに反映したい場合に適している

### revalidateTag vs updateTag

| 機能 | revalidateTag | updateTag |
|---|---|---|
| 主な利用場所 | Server Action / Route Handler | Server Action のみ |
| 再検証の動作 | SWR（profile="max"）をサポート | 即時期限切れ |
| 主なユースケース | バックグラウンドでのデータ更新 | 自身の書き込み直後の整合性確保 |

---

## 5. 実装上の留意事項

- **タグの再利用**：複数の関数で同じタグを共有することで、一回の `revalidateTag` で関連するキャッシュをまとめて更新できる
- **APIの選択**：Server Action内での即時性が必要な更新には `updateTag`、それ以外には `revalidateTag` の `profile="max"` を使う
- **動的ルートの保証**：ルート全体を動的に保ちたい場合は `connection` APIを併用してプリレンダリングを制御する
