# Next.js 画像インポートまとめ

## 静的インポート

```tsx
import ProfileImage from './profile.png'
```

`'./profile.png'` は**そのソースファイル自身のディレクトリからの相対パス**を参照する。

```
src/
  app/
    profile/
      page.tsx        ← このファイルに書いた場合
      profile.png     ← ここを参照する
```

### パスの書き方バリエーション

| 記述 | 参照先 |
|------|--------|
| `'./profile.png'` | 同ディレクトリ |
| `'../assets/profile.png'` | 一つ上の `assets/` |
| `'@/assets/profile.png'` | `tsconfig.json` の `paths` で設定したエイリアス |

静的インポートした画像は `src`, `width`, `height` などを持つオブジェクトになるので、`next/image` にそのまま渡せる。

```tsx
<Image src={ProfileImage} alt="..." />
```

---

## public ディレクトリの画像

`public/` 内のファイルは**静的インポート不可**。文字列パスで直接参照する。

```tsx
// NG
import ProfileImage from '/public/profile.png'

// OK
<Image src="/profile.png" alt="..." width={100} height={100} />
```

`public/` 以下のファイルはビルド後にルート (`/`) として配信されるため、`/profile.png` と書けば `public/profile.png` を指す。

---

## 静的インポート vs public の使い分け

| | 静的インポート | public ディレクトリ |
|---|---|---|
| パス指定 | ファイル相対パス | `/` から始まる絶対パス |
| width/height の自動取得 | ✅ | ❌（手動指定が必要） |
| ビルド時の最適化 | ✅ | △ |
| 外部から直接URLアクセス | ❌ | ✅ |
| OGP画像など絶対URLが必要なもの | 不向き | 向いてる |

**基本方針：**
- コンポーネント内で使う画像 → 静的インポート
- OGP・favicon など外部参照が必要なもの → `public/`

---

## よくあるエラー

```
Module not found: Can't resolve './public/next.svg'
```

`public/` 内のファイルを静的インポートしようとした場合に発生。

### 解決策

**① `public/` から出して静的インポートする**

```
src/
  assets/
    next.svg
  app/
    page.tsx
```

```tsx
import NextLogo from '../assets/next.svg'
```

**② `public/` に置いたまま文字列参照する**

```tsx
<Image src="/next.svg" alt="Next.js" width={100} height={100} />
```
