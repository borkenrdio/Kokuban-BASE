# Kokuban BASE プロジェクト構成ドキュメント

最終更新: 2026年5月14日  
対象: 開発・運用関係者 / 将来の引き継ぎ用

このドキュメントは、Kokuban BASE サイト(https://kokuban-base.com/)の**全体アーキテクチャ・ファイル関係性・デザインルール**を網羅した参照資料です。

---

## 目次

1. [プロジェクトの全体構成](#1-プロジェクトの全体構成)
2. [ファイル一覧と役割](#2-ファイル一覧と役割)
3. [ビルド・デプロイの仕組み](#3-ビルドデプロイの仕組み)
4. [microCMS との連携](#4-microcms-との連携)
5. [プレースホルダー(変数)一覧](#5-プレースホルダー変数一覧)
6. [デザインルール・スタイルガイド](#6-デザインルールスタイルガイド)
7. [URL設計](#7-url設計)
8. [構造化データ(JSON-LD)の設計](#8-構造化データjson-ldの設計)
9. [ファイル変更時の影響範囲](#9-ファイル変更時の影響範囲)
10. [運用ガイドライン](#10-運用ガイドライン)

---

## 1. プロジェクトの全体構成

### サイト概要

| 項目 | 値 |
|---|---|
| サイト名 | Kokuban BASE(電子黒板の比較体験倉庫) |
| URL | https://kokuban-base.com/ |
| 運営 | 株式会社idea spot(京都) |
| グランドオープン | 2025年11月 |

### 技術スタック

```
┌─────────────────────────────────────────┐
│           ユーザー(ブラウザ)              │
│   https://kokuban-base.com/             │
└──────────────────┬──────────────────────┘
                   │
                   ↓ HTTPSアクセス
┌─────────────────────────────────────────┐
│         GitHub Pages(配信)              │
│  ・gh-pages ブランチを静的ホスティング     │
│  ・無料・SSL自動                          │
└──────────────────┬──────────────────────┘
                   ↑ デプロイ
┌─────────────────────────────────────────┐
│         GitHub Actions(ビルド)           │
│  ・.github/workflows/deploy.yml          │
│  ・microCMSの記事 + 静的HTMLを結合        │
│  ・gh-pagesブランチに force_orphan=true   │
└─────┬─────────────────────┬─────────────┘
      │                     │
      ↓ コンテンツ取得         ↓ ソース取得
┌──────────────┐  ┌────────────────────────┐
│  microCMS    │  │  GitHub (main branch)   │
│  ・コラム記事 │  │  ・HTML テンプレ        │
│  ・お知らせ   │  │  ・ビルドスクリプト      │
│  ・執筆者情報  │  │  ・画像・動画           │
└──────────────┘  └────────────────────────┘
```

### ビルド方式: SSG(Static Site Generation)

- **メリット**:
  - ページ表示が高速(CDNから静的HTMLを配信するだけ)
  - SEO に強い(JSがなくてもコンテンツが見える)
  - サーバー不要、コストゼロ
  - APIキーがHTMLに露出しない(ビルド時のみ使用)
- **デメリット**:
  - リアルタイム更新には不向き(記事公開後、再ビルドが必要)
  - ビルド時間が記事数に比例(現状: 数十秒)

---

## 2. ファイル一覧と役割

### 📁 ルートディレクトリ構造

```
Kokuban-BASE-main/
├── index.html                  ⭐ トップページ(静的)
├── article.html                📚 コラム一覧(ビルド時に注入)
├── contact.html                📩 お問い合わせフォーム
├── reservation.html            📅 来場予約フォーム
├── on-line-reservation.html    💻 オンラインデモ予約
├── Kokubanlease.html           💰 リースサービス紹介
├── whatissmrtboard.html        ❓ 「電子黒板とは」入門ページ(ビルド時にコラム注入)
├── information.html            📢 お知らせ一覧
├── privacy.html                🔒 プライバシーポリシー (noindex)
├── terms.html                  📜 特定商取引法表記 (noindex)
│
├── columns/
│   ├── template.html           ⭐ コラム記事の雛形(ビルド時に各記事を生成)
│   ├── index.json              📋 記事一覧JSON(ビルド時生成)
│   ├── seiza-rika/
│   │   └── index.html          📄 各コラム記事(ビルド時生成)
│   ├── google-earth/
│   │   └── index.html
│   ├── ... (他のコラム記事)
│
├── team/                       👥 (ビルド時生成)執筆者ページ
│   ├── index.html              運営チーム一覧
│   ├── takeyama-junya/
│   │   └── index.html          竹山隼矢のプロフィール
│   ├── endo-koji/
│   │   └── index.html          遠藤幸治のプロフィール
│   └── yamada-masaki/
│       └── index.html          山田将生のプロフィール
│
├── information/                📢 (ビルド時生成)お知らせデータ
│   └── index.json
│
├── img/                        🖼️ 画像・動画リソース
│   ├── hero-poster.webp        ヒーロー画像(PC用)
│   ├── hero-poster-mobile.webp ヒーロー画像(モバイル用)
│   ├── top.mp4, top.webm       ヒーロー動画(PC用)
│   ├── top-mobile.mp4, .webm   ヒーロー動画(モバイル用)
│   ├── brand-1.png 〜 brand-6.png  メーカーロゴ
│   ├── product-b.jpg 〜 product-h.jpg  製品画像
│   ├── staff-a.jpg, staff-b.jpg, staff-c.jpg  スタッフ写真
│   ├── step-1.png 〜 step-4.png  利用フロー画像
│   ├── ideaspot-logo.jpg       運営会社ロゴ
│   ├── ideaspot-classroom.jpg  教室風景
│   ├── kokubanbase-map.png     アクセスマップ
│   ├── Souko.jpg, try.jpg      体験倉庫の写真
│   └── SNS.jpg, ogp.jpg        SNSシェア用画像
│
├── scripts/
│   └── fetch_and_build.mjs     ⭐⭐ メインビルドスクリプト
│
├── .github/
│   └── workflows/
│       └── deploy.yml          🚀 GitHub Actions 設定
│
├── sitemap.xml                 🗺️ ビルド時に上書き生成
├── robots.txt                  🤖 クローラ向け設定
├── favicon.ico                 🎨 ファビコン
├── apple-touch-icon.png        🍎 iOS用アイコン
└── package.json                📦 Node依存定義
```

### 🌟 重要ファイル詳細

#### `scripts/fetch_and_build.mjs`(最重要)

サイトの心臓部。**microCMSから記事を取得し、静的HTMLを生成する**スクリプト。

**主な処理**:
1. microCMS APIから全コラム記事を取得
2. 各記事に対し:
   - 本文中のキーワードを自動内部リンク化
   - 目次(h2/h3)を自動生成
   - 読了時間を計算
   - 更新日(revisedAt)の判定
   - HTMLエスケープ処理(セキュリティ重要)
3. `columns/template.html` を雛形にプレースホルダーを置換
4. `columns/{slug}/index.html` として出力
5. 一覧ページ(article.html)、whatissmrtboard.htmlにコラム一覧を注入
6. 執筆者ページ(team/...)を生成
7. sitemap.xml を生成
8. 旧slugリダイレクトページを生成(SLUG_REDIRECTS設定時)

**ビルド時にしないこと**:
- ❌ microCMS APIキーをHTMLに埋め込む(セキュリティ問題回避)
- ❌ updatedAt をdateModifiedに使う(誤更新通知防止)

---

#### `columns/template.html`(コラム雛形)

各コラム記事のHTML雛形。`{{...}}` 形式のプレースホルダーを含む。

**主要セクション**:
1. `<head>`: メタタグ、構造化データ(Article + BreadcrumbList)
2. ヘッダー: ナビゲーション
3. パンくずリスト(画面表示 + Microdata)
4. アイキャッチ画像
5. タイトルブロック(公開日・更新日・読了時間・執筆者)
6. **目次**(`{{TOC_HTML}}` - ビルド時に自動生成)
7. 本文(`{{BODY_HTML}}` - microCMSから)
8. シェアボタン
9. 関連記事
10. CTA(お問い合わせ・予約)
11. フッター

---

#### `index.html`(トップページ)

完全に静的(microCMSデータをJSで取得して表示する箇所もある)。

**主要セクション**:
- ヒーロー: 画像即表示 → 動画フェードイン
- ブランド一覧
- 最新情報(JSで取得)
- 課題提示
- 比較体験の4ポイント
- 製品ラインナップ(Swiper)
- ご利用の流れ
- 運営会社紹介
- スタッフ紹介(Swiper)
- お役立ちコラム(JSで取得)
- FAQ
- アクセス
- CTA

---

#### `.github/workflows/deploy.yml`

GitHub Actions のワークフロー定義。

**トリガー**:
- `main` ブランチへのプッシュ(`information/**`を除く)
- microCMS Webhook(`repository_dispatch`)
- 手動実行(`workflow_dispatch`)

**処理フロー**:
1. リポジトリをチェックアウト
2. Node.js 20 をセットアップ
3. `microcms-js-sdk` をインストール
4. **information サービスのビルド**(お知らせ用、別microCMSサービス)
5. **メインビルド**(`scripts/fetch_and_build.mjs`)
6. APIキー残留をgrepで確認(セキュリティ検証)
7. `gh-pages` ブランチに `force_orphan: true` でデプロイ

---

## 3. ビルド・デプロイの仕組み

### 全体フロー

```
編集者が記事を書く / 修正する
        ↓
microCMS で「公開」ボタン
        ↓
microCMS が Webhook を GitHub に送信
        ↓
GitHub Actions が deploy.yml を実行
        ↓
fetch_and_build.mjs が走る
        ↓
microCMS API から記事を取得
        ↓
columns/template.html を雛形に
全記事の static HTML を生成
        ↓
sitemap.xml, index.json も生成
        ↓
gh-pages ブランチに force_orphan で push
        ↓
GitHub Pages が新バージョンを配信開始
        ↓
ユーザーが新コンテンツを閲覧可能
```

### ビルドにかかる時間

- 通常のコラム記事追加: **約30〜60秒**
- フル再ビルド: 約1〜2分
- microCMS Webhook 受信から公開反映: **約1〜2分**

### 失敗時の確認手順

1. GitHub Actions のログを開く
2. `Run microCMS fetch and build` ステップで失敗の場合:
   - 環境変数(`MICROCMS_SERVICE_DOMAIN`、`MICROCMS_API_KEY`)の設定確認
   - microCMS の APIキーがローテーションされていないか確認
3. `Check for API key leak` で失敗の場合:
   - 生成HTMLに `X-MICROCMS-API-KEY` の文字列が含まれている → ソースのバグ
4. デプロイ自体は成功したが反映されない場合:
   - ブラウザのハードリロード(Ctrl+Shift+R)を試す
   - CDNキャッシュが切れるまで数分待つ

---

## 4. microCMS との連携

### microCMS の構成

#### サービス1: kokubanbase(メイン、コラム用)

| API | エンドポイント | 用途 |
|---|---|---|
| `news` | `https://kokubanbase.microcms.io/api/v1/news` | コラム記事(対談含む) |

**スキーマ(フィールド)**:

| フィールドID | 型 | 必須 | 説明 |
|---|---|---|---|
| `id` | 文字列 | (自動) | microCMS内部ID |
| `slug` | テキスト | ✅ | URLに使うスラッグ(例: `seiza-rika`) |
| `title` | テキスト | ✅ | 記事タイトル |
| `description` | テキスト | ⭕(任意) | 検索結果用説明文 |
| `body` | リッチエディタ | ✅ | 本文HTML |
| `eyecatch` | 画像 | ⭕(任意) | アイキャッチ画像 |
| `category` | セレクト | ⭕(任意) | カテゴリ(コラム/対談) |
| `author` | テキスト | ⭕(任意) | 執筆者名(例: `竹山 隼矢`) |
| `revisedAt` | 日時 | ⭕(任意) | **手動の更新日**(軽微な修正では入れない) |
| `publishedAt` | (自動) | (自動) | 公開日時(microCMS管理) |
| `updatedAt` | (自動) | (自動) | 自動更新日時(SEOには使わない) |

#### サービス2: information(お知らせ用)

| API | エンドポイント | 用途 |
|---|---|---|
| `information` | `https://kokubanbaseinformation.microcms.io/api/v1/information` | お知らせ・ニュース |

### microCMS の運用上の重要ルール

1. **slug は変更しない**(変更したら旧URLが404になる)
   - どうしても変える場合は `SLUG_REDIRECTS` に旧→新を追加してビルド
2. **revisedAt は実質的な更新時のみ入力**
   - 誤字脱字程度では入れない
   - Googleへの誤った「更新シグナル」を防ぐため
3. **author フィールドに執筆者名を正確に入力**
   - 執筆者ページの「執筆記事一覧」に自動反映される
   - 表記揺れに対応するため、`fetch_and_build.mjs` の `AUTHORS[].matchKeys` で複数表記を許容

### microCMS の APIキー管理

- **GitHub Secrets** に保存:
  - `MICROCMS_SERVICE_DOMAIN` = `kokubanbase`
  - `MICROCMS_API_KEY` = (実際のキー)
  - `INFORMATION_SERVICE_DOMAIN` = `kokubanbaseinformation`
  - `MICROCMS_INFORMATION_KEY` = (実際のキー)
- **絶対にHTMLに直接書かない**(過去にバグで露出した経緯あり)
- ローテーション(更新)した場合は GitHub Secrets も更新

---

## 5. プレースホルダー(変数)一覧

`columns/template.html` で使われる全プレースホルダー。
ビルド時に `fetch_and_build.mjs` が値で置換する。

### 基本情報

| プレースホルダー | 内容 | 由来 |
|---|---|---|
| `{{TITLE}}` | `[記事タイトル]｜Kokuban BASE` | article.title + 固定文字列 |
| `{{TITLE_PLAIN}}` | 記事タイトル(HTMLエスケープ済み) | article.title |
| `{{TITLE_HTML}}` | `<br>` 対応版タイトル(画面表示用) | article.title |
| `{{DESCRIPTION}}` | meta description用テキスト | article.description or 本文先頭 |
| `{{CANONICAL_URL}}` | 正規URL | `https://kokuban-base.com/columns/[slug]/` |
| `{{OG_IMAGE_URL}}` | OGP用画像URL | article.eyecatch.url + クロップパラメータ |

### 日付関連

| プレースホルダー | 内容 | 由来 |
|---|---|---|
| `{{PUBLISHED_AT_ISO}}` | 公開日(ISO 8601) | article.publishedAt |
| `{{PUBLISHED_AT_FORMATTED}}` | 公開日(日本語表記) | 整形した article.publishedAt |
| `{{DATE_MODIFIED_ISO}}` | 構造化データ用更新日 | revisedAt があればそれ、なければ publishedAt |
| `{{UPDATED_AT_ISO}}` | 旧互換用(= DATE_MODIFIED_ISO) | 同上 |
| `{{REVISED_AT_ISO}}` | 手動更新日(ISO) | article.revisedAt |
| `{{REVISED_AT_FORMATTED}}` | 手動更新日(日本語表記) | 整形した article.revisedAt |
| `{{REVISED_AT_BLOCK}}` | **更新日の表示HTML**(値があれば自動表示) | ビルド時生成 |

### 機能ブロック

| プレースホルダー | 内容 | 由来 |
|---|---|---|
| `{{BODY_HTML}}` | 本文(内部リンク + ID付与済み) | article.body + 加工 |
| `{{EYECATCH_HTML}}` | アイキャッチ画像のHTML | article.eyecatch |
| `{{TOC_HTML}}` | **目次HTML**(h2/h3が2個以上の時のみ) | ビルド時自動生成 |
| `{{READING_TIME_HTML}}` | **読了時間ブロック** | 本文文字数から計算(450字/分) |
| `{{READING_MINUTES}}` | 読了時間の数値のみ | 同上 |
| `{{AUTHOR}}` | 執筆者名 | article.author or デフォルト |
| `{{author}}` | 同上(旧テンプレ互換) | 同上 |
| `{{RELATED_POSTS_HTML}}` | 関連記事HTML | 他の公開記事から自動選定 |

### シェア用

| プレースホルダー | 内容 |
|---|---|
| `{{SHARE_URL_TWITTER}}` | Twitter共有URL |
| `{{SHARE_URL_FACEBOOK}}` | Facebook共有URL |
| `{{SHARE_URL_LINE}}` | LINE共有URL |

### 検証ロジック

ビルド時に**未置換のプレースホルダー**(`{{XXX}}` 形式が残存)を検出して警告ログを出す。

```
⚠️ 警告: [slug] に未置換プレースホルダーが残存: {{XXX}}
```

---

## 6. デザインルール・スタイルガイド

### カラーパレット

| 色 | HEX | 用途 | Tailwindクラス |
|---|---|---|---|
| **メインブルー** | `#103f99` | ヘッダー背景、ブランド色、見出し | `bg-customBlue`, `text-customBlue` |
| **アクセントピンク** | `#ed5b8c` / `pink-500` | CTA、強調、ホバー | `bg-pink-500`, `text-pink-500` |
| **CTAグリーン** | `#22c55e` / `green-500` | オンライン予約CTA | `bg-green-500` |
| ベースグレー(背景) | `#f9fafb`, `#fafafa` | セクション背景 | `bg-gray-50` |
| 通常テキスト | `#333`, `#1f2937` | 本文 | `text-gray-800` |
| 補助テキスト | `#6b7280` | 公開日・補助情報 | `text-gray-500` |
| 境界線 | `#e5e7eb` | カード境界 | `border-gray-200` |
| 黄色ハイライト | `#fef3c7` | 強調アンダーライン | (カスタム) |

### Tailwind設定

各HTMLの`<script>tailwind.config = {...}</script>` で `customBlue: '#103f99'` を定義。

```javascript
tailwind.config = {
    theme: {
        extend: {
            colors: {
                customBlue: '#103f99'
            }
        }
    }
};
```

### フォント

| 種類 | フォント名 | 用途 |
|---|---|---|
| 欧文 | **Inter** | 数字・英語 |
| 和文 | **Noto Sans JP** | 日本語 |
| 太さ | 400 / 500 / 700 / 900 | 通常 / 中太 / 太字 / 極太 |

CSSでの指定:
```css
font-family: 'Inter', 'Noto Sans JP', sans-serif;
```

外部読み込み(Google Fonts):
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Noto+Sans+JP:wght@400;500;700;900&display=swap" rel="stylesheet">
```

### CSS外部ライブラリ

| ライブラリ | バージョン | 用途 | 読み込み方式 |
|---|---|---|---|
| Tailwind CSS | (CDN) | 全体スタイル | `<script>` |
| Font Awesome | 6.5.1 | アイコン | `<link>` + 非同期 |
| Swiper | 11 | カルーセル(製品/スタッフ) | `<link>` + `<script defer>` |

**非同期読み込みの実装**:
```html
<link rel="stylesheet" href="..." media="print" onload="this.media='all'">
```

### コンポーネントのデザイン規則

#### ボタン

| 種類 | 背景 | 文字 | 用途 |
|---|---|---|---|
| プライマリ(白) | `bg-white` | `text-customBlue` | お問い合わせ等 |
| アクセント(ピンク) | `bg-pink-500` | `text-white` | 来場予約(主要CTA) |
| CTA緑 | `bg-green-500` | `text-white` | オンラインデモ予約 |

**共通スタイル**:
- 高さ: `h-[58px]` (大ボタン) or `py-3 px-6` (中ボタン)
- 角丸: `rounded-full`(主要CTA)、`rounded-md`(セカンダリ)
- シャドウ: `shadow-md` / `shadow-lg`
- ホバー: `hover:scale-105 transform`

#### カード

```css
.card {
    background: white;
    border-radius: 0.75rem;       /* rounded-xl */
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);   /* shadow-md */
    transition: shadow 0.3s;
}
.card:hover {
    box-shadow: 0 25px 50px rgba(0,0,0,0.15); /* shadow-2xl */
    transform: translateY(-4px);
}
```

#### 見出し階層

| レベル | サイズ | 太さ | 色 | 用途 |
|---|---|---|---|---|
| h1 | text-4xl 〜 text-6xl | font-black (900) | text-customBlue | ページ主タイトル |
| h2 | text-2xl 〜 text-4xl | font-bold (700) | text-customBlue | セクション見出し |
| h3 | text-xl 〜 text-2xl | font-bold (700) | text-gray-800 | サブ見出し |
| h4 | text-lg | font-bold | text-gray-800 | カード内タイトル |

### コラム記事固有のスタイル(`.article-body`)

```css
.article-body p { margin-bottom: 2em; }     /* 段落間 */
.article-body h2 { font-size: 1.5em; ... }  /* セクション見出し */
.article-body h3 { font-size: 1.25em; ... } /* サブ見出し */
.article-body img { 
    border-radius: 0.75rem;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}
.article-body blockquote {
    border-left: 4px solid #103f99;
    background-color: #f8fafc;
    padding: 1.5em;
}
.article-body a.internal-link {  /* 自動内部リンク */
    color: #103f99;
    border-bottom: 1.5px solid rgba(16,63,153,0.3);
}
```

### レスポンシブブレークポイント(Tailwind標準)

| ブレークポイント | 幅 | 用途 |
|---|---|---|
| (default) | 0〜639px | モバイル |
| `sm:` | 640px〜 | タブレット縦 |
| `md:` | 768px〜 | タブレット横 |
| `lg:` | 1024px〜 | デスクトップ |
| `xl:` | 1280px〜 | 大画面 |

### 重要なデザイン原則

1. **「電子黒板の比較体験」を視覚的にも訴求**
   - ヒーローは「教室+電子黒板を使う先生」のシーンを優先
2. **CTAを目立たせる**
   - ピンクのボタンは「来場予約」専用
   - グリーンのボタンは「オンライン予約」専用
3. **京都らしさを取り入れる**
   - フッターやマップに京都の地理情報
4. **モバイルファーストではあるがPCも美しく**
   - 検索ユーザーの大半はPC(教師・経営者)
   - ヒーローや製品比較はPCで最大限見せる

---

## 7. URL設計

### URL一覧

| URL | ファイル | 種別 | indexing |
|---|---|---|---|
| `/` | index.html | 静的 | ✅ index |
| `/article` | article.html | ビルド時に注入 | ✅ index |
| `/contact` | contact.html | 静的 | ✅ index |
| `/reservation` | reservation.html | 静的 | ✅ index |
| `/on-line-reservation` | on-line-reservation.html | 静的 | ✅ index |
| `/Kokubanlease` | Kokubanlease.html | 静的 | ✅ index |
| `/whatissmrtboard` | whatissmrtboard.html | ビルド時に注入 | ✅ index |
| `/information` | information.html | 静的 | ✅ index |
| `/privacy` | privacy.html | 静的 | 🚫 **noindex** |
| `/terms` | terms.html | 静的 | 🚫 **noindex** |
| `/columns/[slug]/` | ビルド時生成 | 動的(microCMS) | ✅ index |
| `/team/` | ビルド時生成 | 動的(AUTHORS定義) | ✅ index |
| `/team/[slug]/` | ビルド時生成 | 動的 | ✅ index |

### URLの命名規則

- ✅ `.html` 拡張子を付けない(2026年5月の修正で対応済み)
- ✅ ハイフン区切り (`on-line-reservation` ← 既存維持、本来は `online-reservation` 推奨)
- ✅ コラムは `/columns/[slug]/` 形式
- ✅ チームメンバーは `/team/[slug]/` 形式

### canonical 設定

各ページに `<link rel="canonical" href="..." />` で正規URLを明示。
- GitHub Pages は `.html` 付きと無し両方でアクセス可能 → 重複を防ぐため canonical 必須
- 例: `https://kokuban-base.com/contact`(末尾スラッシュなし)

---

## 8. 構造化データ(JSON-LD)の設計

### ページ別の構造化データ

| ページ | 構造化データの種類 |
|---|---|
| `/` | `WebSite`, `LocalBusiness`, `FAQPage` |
| `/columns/[slug]/` | `Article`, `BreadcrumbList` |
| `/team/[slug]/` | `ProfilePage` + `Person`, `BreadcrumbList` |
| `/article` | `BreadcrumbList` |

### `LocalBusiness`(トップページ)

```json
{
  "@type": "LocalBusiness",
  "name": "Kokuban BASE(コクバンベース)",
  "description": "...",
  "address": {
    "postalCode": "602-0822",
    "addressRegion": "京都府",
    "addressLocality": "京都市上京区",
    "streetAddress": "..."
  },
  "geo": { "latitude": 35.028, "longitude": 135.772 },
  "areaServed": ["京都府", "大阪府", "兵庫県", "滋賀県", "奈良県"],
  "openingHoursSpecification": [...]
}
```

### `Article`(コラム記事)

```json
{
  "@type": "Article",
  "headline": "[記事タイトル]",
  "description": "...",
  "image": ["..."],
  "datePublished": "[publishedAt]",
  "dateModified": "[revisedAt or publishedAt]",  // updatedAtは使わない
  "author": { "@type": "Organization", "name": "Kokuban BASE" },
  "publisher": { ... }
}
```

### `Person`(執筆者ページ)

```json
{
  "@type": "Person",
  "name": "竹山 隼矢",
  "alternateName": "Takeyama Junya",
  "jobTitle": "株式会社idea spot 代表取締役",
  "knowsAbout": ["中学受験算数", "電子黒板を活用したICT授業"],
  "worksFor": { 
    "@type": "Organization", 
    "name": "株式会社idea spot",
    "subOrganization": { "@type": "Organization", "name": "Kokuban BASE" }
  }
}
```

### `BreadcrumbList`(全ページ)

```json
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "position": 1, "name": "トップ", "item": "https://kokuban-base.com/" },
    { "position": 2, "name": "コラム", "item": "https://kokuban-base.com/article" },
    { "position": 3, "name": "[記事タイトル]", "item": "[canonical URL]" }
  ]
}
```

### `FAQPage`(トップページ)

トップページのFAQセクションが構造化データとして登録されており、Googleの検索結果に直接表示される可能性あり。

---

## 9. ファイル変更時の影響範囲

### 「○○を変更したい」→「どのファイルを編集するか」

| やりたいこと | 編集対象 | 反映タイミング |
|---|---|---|
| トップページのコンテンツを変える | `index.html` | GitHub push 後すぐ |
| 新しいコラム記事を書く | microCMS の管理画面 | webhook 経由でビルド(数分後) |
| コラム記事のレイアウト変更 | `columns/template.html` | GitHub push + ビルド後 |
| コラム記事の内部リンク用キーワード追加 | `scripts/fetch_and_build.mjs` の `KNOWN_TOOLS` | GitHub push + ビルド後 |
| 執筆者プロフィール変更 | `scripts/fetch_and_build.mjs` の `AUTHORS` | GitHub push + ビルド後 |
| ヒーロー画像の差し替え | `img/hero-poster.webp` & `hero-poster-mobile.webp` | GitHub push 後すぐ |
| メーカーロゴ追加 | `img/brand-N.png` + `index.html` の `brands` 配列 | GitHub push 後すぐ |
| 製品ラインナップ変更 | `index.html` の `products` 配列 | GitHub push 後すぐ |
| スタッフ写真の差し替え | `img/staff-X.jpg` | GitHub push 後すぐ |
| お問い合わせフォーム変更 | `contact.html` | GitHub push 後すぐ |
| プライバシーポリシー変更 | `privacy.html` | GitHub push 後すぐ |
| 来場予約フォーム変更 | `reservation.html` | GitHub push 後すぐ |

### 影響範囲が大きい変更

⚠️ 以下を変更する際は、影響範囲をよく確認してください。

| 変更内容 | 影響範囲 |
|---|---|
| `scripts/fetch_and_build.mjs` | **全コラム記事 + 一覧 + 執筆者ページ**が再生成される |
| `columns/template.html` | **全コラム記事**のデザインが変わる |
| `deploy.yml` | ビルドプロセス全体に影響 |
| LocalBusinessの住所(`index.html`) | 検索結果の表示に影響 |
| canonical URL | 検索順位に影響(原則変更しない) |

### 変更してはいけないもの

🚫 以下は意図的に変更しないでください。

- microCMS のスキーマ(特に `slug` を必須から外す等)
- `revisedAt` の意味(自動更新ではなく手動更新であること)
- canonical URL の構造(`.html` を付けるなど)
- gh-pages ブランチの直接編集(force_orphan で毎回作り直しされる)

---

## 10. 運用ガイドライン

### microCMSで新コラム記事を書く時のチェックリスト

#### 必須項目
- [ ] `slug` を設定(英数とハイフン、例: `denshikokuban-rika`)
- [ ] `title` を設定(タイトル先頭にキーワードを置く)
- [ ] `body` を入力(冒頭でリード文を書く)

#### 推奨項目
- [ ] `description` を 100〜130 字で書く(検索結果に表示される)
- [ ] `eyecatch` を設定(SNSシェア時に表示)
- [ ] `category` を設定(コラム/対談)
- [ ] `author` を執筆者本人の名前にする(`竹山 隼矢` など)
- [ ] 本文の画像すべてに `alt` 属性をキーワード入りで設定
- [ ] 見出し(h2/h3)を 2 つ以上使う(目次が自動生成される)

#### 更新時
- [ ] 実質的な更新の場合: `revisedAt` に今日の日付を設定
- [ ] 軽微な修正(誤字脱字)の場合: `revisedAt` は変更しない

### サイト更新時のチェックリスト

新機能や大きな変更後:
- [ ] ローカルでビルドエラーがないか確認
- [ ] GitHub Actions のログでエラーがないか確認
- [ ] ライブで実際にアクセスして見た目を確認
- [ ] 主要ページのSearch Consoleで「URL検査」を実行
- [ ] Lighthouseでスコアを確認(可能なら)

### サブメンバーへの引き継ぎ手順

新しく運用に参加する人がいる場合:
1. このドキュメント全体を読んでもらう
2. microCMS の管理画面アクセス権を付与
3. GitHub リポジトリへのアクセス権を付与
4. 最低 1 つのテスト記事を書く練習をしてもらう
5. デプロイ完了を見届けてもらう
6. SEOレポート(`seo-report.md`)を読んでもらう
7. 強化推奨記事のリライトサンプル(`article-rewrite-sample-seiza-rika.md`)を見て、編集パターンを学んでもらう

---

## 📚 関連ドキュメント

| ドキュメント | 内容 |
|---|---|
| `seo-report.md` | SEO対策の進捗・残課題レポート |
| `article-rewrite-sample-seiza-rika.md` | 記事リライトのサンプル(seiza-rika) |
| (このファイル) | プロジェクト全体のアーキテクチャ |

---

## 🔧 トラブルシューティング

### Q: 記事を公開したが、ライブに反映されない
A: 以下を順に確認:
1. GitHub Actions の最新ビルドが成功しているか
2. ビルド完了から3分以上待ったか(CDNキャッシュ)
3. ブラウザのハードリロード(Ctrl+Shift+R)を試したか

### Q: 内部リンクが本文に挿入されない
A: 以下を確認:
1. `scripts/fetch_and_build.mjs` の `KNOWN_TOOLS` に該当キーワードが入っているか
2. 本文中にそのキーワードが文字列として登場しているか
3. すでに `<a>` タグ内にあるテキストは無視される仕様
4. 1記事あたり最大3リンクの上限あり

### Q: 目次が表示されない
A: 以下を確認:
1. 本文に h2 または h3 が**2個以上**あるか(1個以下では出ない仕様)
2. h2/h3 の中身が空でないか

### Q: 執筆者ページに記事が表示されない
A: 以下を確認:
1. microCMS の各記事の `author` フィールドに、正確な執筆者名が入っているか
2. `AUTHORS[].matchKeys` に該当する表記が含まれているか
   - 例: 「竹山 隼矢」「竹山隼矢」「Takeyama Junya」すべて対応

### Q: SNSシェアした時にタイトルが途中で切れる
A: タイトルにダブルクオート `"` が含まれていないか確認。
- 解決策: 「`時間旅行`」のような全角クオートに置き換える
- または: `fetch_and_build.mjs` の `escapeHtml` が正しく動作しているか確認(2026年5月の修正で対応済み)

---

## 🚀 今後の拡張ポイント

### 短期(数週間以内)
- 強化推奨記事のリライト(タイトル・リード・FAQ)
- 既存記事の画像 alt 属性バックフィル

### 中期(2〜3ヶ月)
- コラムにカテゴリ・タグ機能を追加
- 「電子黒板とは」ハブページの大幅拡充
- ローカルSEO強化(Googleビジネスプロフィール登録)

### 長期(半年以上)
- 多言語対応(英語ページ追加)
- 動画コンテンツの追加(YouTube埋め込みなど)
- ユーザーレビュー機能

---

**最終更新者**: SEO/サイト改修プロジェクト  
**最終更新日**: 2026年5月14日
