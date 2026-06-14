# 📦 全アウトプットファイルの関係性マップ

このドキュメントは、これまでに生成された全ファイルが**どこに配置されるか**、**どう連携しているか**を一目で把握するための索引です。

---

## 📁 出力ファイル一覧と配置先

`/mnt/user-data/outputs/` にある各ファイルを、**Kokuban-BASE-main リポジトリ内のどこに置くか**を整理します。

### 🎯 デプロイ手順

各ファイルを以下の場所に配置 → GitHubにcommit & push → GitHub Actionsが自動デプロイ

| 出力ファイル | 配置先(リポジトリ内) | 種別 |
|---|---|---|
| `index.html` | `/index.html`(ルート直下) | 静的ページ |
| `article.html` | `/article.html`(ルート直下) | 静的(ビルド時注入) |
| `Kokubanlease.html` | `/Kokubanlease.html`(ルート直下) | 静的ページ |
| `contact.html` | `/contact.html`(ルート直下) | 静的ページ |
| `information.html` | `/information.html`(ルート直下) | 静的(ビルド時注入) |
| `on-line-reservation.html` | `/on-line-reservation.html`(ルート直下) | 静的ページ |
| `privacy.html` | `/privacy.html`(ルート直下) | 静的(noindex) |
| `reservation.html` | `/reservation.html`(ルート直下) | 静的ページ |
| `terms.html` | `/terms.html`(ルート直下) | 静的(noindex) |
| `whatissmrtboard.html` | `/whatissmrtboard.html`(ルート直下) | 静的(ビルド時注入) |
| `template.html` | `/columns/template.html`(columnsディレクトリ) | コラム記事の雛形 |
| `fetch_and_build.mjs` | `/scripts/fetch_and_build.mjs`(scriptsディレクトリ) | ビルドスクリプト |
| `deploy.yml` | `/.github/workflows/deploy.yml`(GitHub Actions) | デプロイ設定 |

### 📚 ドキュメント類(リポジトリ外管理推奨)

| ファイル | 用途 | 保存先(推奨) |
|---|---|---|
| `PROJECT_ARCHITECTURE.md` | プロジェクト全体の設計書 | NotionやGitHub Wiki、社内ドキュメント |
| `seo-report.md` | SEO診断レポート | 同上 |
| `article-rewrite-sample-seiza-rika.md` | 記事リライトサンプル | 同上 |

---

## 🗺️ ファイル関係性のシステム図

```
                                       ┌──────────────────────┐
                                       │   microCMS           │
                                       │  (記事データソース)    │
                                       └──────┬───────────────┘
                                              │ API取得
                                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  scripts/fetch_and_build.mjs                     │
│                  (メインビルドスクリプト)                         │
│                                                                  │
│  入力:                                                            │
│    ・microCMS API(コラム記事データ)                              │
│    ・columns/template.html(雛形)                                │
│    ・article.html(一覧用テンプレ)                               │
│    ・whatissmrtboard.html(入門ページ用テンプレ)                 │
│                                                                  │
│  処理:                                                            │
│    1. 全記事取得                                                  │
│    2. 内部リンク自動生成 (KNOWN_TOOLS から)                       │
│    3. 目次自動生成 (h2/h3 から)                                   │
│    4. 読了時間計算                                                │
│    5. 更新日 (revisedAt) 判定                                     │
│    6. 各記事に template.html を適用                               │
│    7. 執筆者ページ生成 (AUTHORS から)                             │
│    8. sitemap.xml 生成                                            │
│                                                                  │
│  出力:                                                            │
│    ・columns/{slug}/index.html × 全記事数                         │
│    ・columns/index.json (一覧JSON)                                │
│    ・team/index.html, team/{slug}/index.html × 3名                │
│    ・article.html (注入版)                                        │
│    ・whatissmrtboard.html (注入版)                                │
│    ・sitemap.xml                                                  │
└─────────────────────────────────────────────────────────────────┘
                                              │
                                              ↓
                              ┌────────────────────────┐
                              │   GitHub Actions       │
                              │   (deploy.yml が制御)   │
                              └─────────┬──────────────┘
                                        │ force_orphan で push
                                        ↓
                              ┌────────────────────────┐
                              │  gh-pages branch       │
                              │  (静的ファイル群)        │
                              └─────────┬──────────────┘
                                        │ 配信
                                        ↓
                              ┌────────────────────────┐
                              │   GitHub Pages         │
                              │  kokuban-base.com      │
                              └────────────────────────┘
```

---

## 🔗 ファイル相互の依存関係

### `fetch_and_build.mjs` が参照するもの

```
fetch_and_build.mjs
    │
    ├── 読み込み: columns/template.html
    │   └── テンプレ内のプレースホルダー({{TITLE}} など)を置換
    │
    ├── 読み込み: article.html
    │   └── id="all-articles-grid" 部分にコラム一覧を注入
    │
    ├── 読み込み: whatissmrtboard.html
    │   └── id="kokuban-columns-grid" 部分にコラム一覧を注入
    │
    ├── API取得: microCMS(news エンドポイント)
    │   └── 環境変数 MICROCMS_SERVICE_DOMAIN, MICROCMS_API_KEY を使用
    │
    ├── 書き込み: columns/{slug}/index.html
    ├── 書き込み: columns/index.json
    ├── 書き込み: team/index.html, team/{slug}/index.html
    ├── 書き込み: article.html(上書き)
    ├── 書き込み: whatissmrtboard.html(上書き)
    └── 書き込み: sitemap.xml
```

### `template.html` が依存するもの

```
columns/template.html
    │
    ├── 必須プレースホルダー(ビルド時に置換される):
    │   ├── {{TITLE}}, {{TITLE_PLAIN}}, {{TITLE_HTML}}
    │   ├── {{DESCRIPTION}}, {{CANONICAL_URL}}, {{OG_IMAGE_URL}}
    │   ├── {{PUBLISHED_AT_ISO}}, {{PUBLISHED_AT_FORMATTED}}
    │   ├── {{REVISED_AT_BLOCK}}, {{DATE_MODIFIED_ISO}}
    │   ├── {{TOC_HTML}}, {{READING_TIME_HTML}}
    │   ├── {{BODY_HTML}}, {{EYECATCH_HTML}}
    │   ├── {{AUTHOR}}, {{RELATED_POSTS_HTML}}
    │   └── {{SHARE_URL_TWITTER}}, {{SHARE_URL_FACEBOOK}}, {{SHARE_URL_LINE}}
    │
    ├── 外部CSSライブラリ:
    │   ├── Tailwind CSS(CDN)
    │   ├── Font Awesome 6.5.1(CDN、非同期)
    │   └── Google Fonts (Inter + Noto Sans JP)
    │
    └── 共通色定義: tailwind.config の customBlue: '#103f99'
```

### `index.html` が依存するもの

```
index.html (トップページ)
    │
    ├── JS で動的取得:
    │   ├── columns/index.json (お役立ちコラム表示用)
    │   └── information/index.json (お知らせ表示用)
    │
    ├── 画像参照:
    │   ├── img/hero-poster.webp(LCP用、PCサイズ)
    │   ├── img/hero-poster-mobile.webp(LCP用、モバイル)
    │   ├── img/top.mp4 / top.webm(ヒーロー動画 PC)
    │   ├── img/top-mobile.mp4 / .webm(ヒーロー動画 モバイル)
    │   ├── img/brand-1.png〜brand-6.png(メーカーロゴ)
    │   ├── img/product-b.jpg〜product-h.jpg(製品)
    │   ├── img/staff-a.jpg / staff-b.jpg / staff-c.jpg(スタッフ)
    │   ├── img/step-1.png〜step-4.png(利用フロー)
    │   ├── img/Souko.jpg, img/try.jpg(体験倉庫)
    │   ├── img/ideaspot-logo.jpg, ideaspot-classroom.jpg(運営会社)
    │   └── img/kokubanbase-map.png(アクセスマップ)
    │
    └── 外部CSSライブラリ:
        ├── Tailwind CSS(CDN)
        ├── Font Awesome(非同期)
        └── Swiper 11(製品 & スタッフカルーセル用)
```

---

## 🎨 デザイン共通要素

すべてのHTMLファイルで以下を**統一して使う**ことを推奨。

### カラー(必須統一)

```javascript
// 全HTMLの tailwind.config で同じ定義をする
tailwind.config = {
    theme: { extend: { colors: { customBlue: '#103f99' } } }
};
```

| 用途 | クラス |
|---|---|
| メインブルー | `bg-customBlue` / `text-customBlue` / `bg-[#103f99]` |
| アクセントピンク | `bg-pink-500` / `text-pink-500` |
| CTAグリーン | `bg-green-500` |

### フォント(必須統一)

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Noto+Sans+JP:wght@400;500;700;900&display=swap" rel="stylesheet">

<style>
  body { font-family: 'Inter', 'Noto Sans JP', sans-serif; }
</style>
```

### ヘッダー(全ページ共通の構造)

```html
<header class="bg-[#103f99] sticky top-0 z-20">
    <!-- 左: ロゴ + ナビ -->
    <!-- 右: お問い合わせ / オンラインデモ予約 / 来場予約のCTA -->
</header>
```

### フッター(全ページ共通の構造)

```html
<footer class="bg-custom-blue text-gray-200">
    <!-- メニュー / サポート / 会社情報の3カラム -->
    <!-- &copy; 2025 株式会社idea spot -->
</footer>
```

---

## 🚀 デプロイの優先順位

新しいファイルを反映する際の推奨順序:

### Stage 1: コアファイル(優先度: 最高)

| 順序 | ファイル | 配置先 |
|---|---|---|
| 1 | `fetch_and_build.mjs` | `scripts/` |
| 2 | `template.html` | `columns/` |
| 3 | `deploy.yml` | `.github/workflows/` |

これらは**全コラム記事**に影響する。最初にデプロイすべき。

### Stage 2: トップページ & 主要ランディング(優先度: 高)

| 順序 | ファイル | 配置先 |
|---|---|---|
| 4 | `index.html` | ルート |
| 5 | `article.html` | ルート |
| 6 | `Kokubanlease.html` | ルート(canonical 修正済み) |

### Stage 3: 集客ページ(優先度: 中)

| 順序 | ファイル | 配置先 |
|---|---|---|
| 7 | `whatissmrtboard.html` | ルート |
| 8 | `on-line-reservation.html` | ルート |
| 9 | `contact.html` | ルート |
| 10 | `reservation.html` | ルート |
| 11 | `information.html` | ルート |

### Stage 4: ポリシー類(優先度: 低)

| 順序 | ファイル | 配置先 |
|---|---|---|
| 12 | `privacy.html` | ルート |
| 13 | `terms.html` | ルート |

---

## 📝 引き継ぎチェックリスト

新しい運用担当者に引き継ぐ場合:

### アクセス権の付与

- [ ] GitHubリポジトリへの招待
- [ ] microCMS(2サービス分)への招待
- [ ] GitHub Secrets の確認(APIキーが正しく設定されているか)
- [ ] Google Search Console のプロパティ共有
- [ ] Google Analytics(GA4)のプロパティ共有

### ドキュメントの共有

- [ ] `PROJECT_ARCHITECTURE.md` を読んでもらう
- [ ] `seo-report.md` を読んでもらう
- [ ] `article-rewrite-sample-seiza-rika.md` を読んでもらう
- [ ] このファイル(関係性マップ)を読んでもらう

### 実地練習

- [ ] microCMS でテスト記事を1本書いてもらう
- [ ] 公開からデプロイ反映まで見届けてもらう
- [ ] revisedAtの使い方を体感してもらう

---

## ⚠️ 重要な注意事項

### セキュリティ

🚫 **絶対にやらないこと**:
- microCMS APIキーをHTMLに直接書く
- GitHub の Public リポジトリに `config.js` 等のキー設定ファイルをcommit
- `.env` ファイルをcommit(.gitignore で除外済み)

### URL設計

🚫 **やらないこと**:
- 既存記事の `slug` を変更する(404の原因)
- canonical URL を変更する
- どうしても変更する場合は `SLUG_REDIRECTS` で旧→新のリダイレクトを設定

### コラム記事の更新

✅ **やること**:
- 軽微な修正: revisedAt は触らない
- 実質的な更新: revisedAt に今日の日付を入れる

🚫 **やらないこと**:
- 「ちょっと修正したから revisedAt を更新しよう」(誤更新通知の原因)

---

## 🆘 緊急時の対処

### サイト全体がダウンした場合

1. GitHub Pages のステータスを確認: https://www.githubstatus.com/
2. GitHub Actions の最新ビルドのステータスを確認
3. ビルドが失敗していた場合、エラーログを読む
4. それでも分からない場合は、過去の成功したコミットに `git revert`

### 特定の記事が表示されない

1. microCMS で該当記事が「公開」状態か確認
2. `slug` が正しいか確認
3. GitHub Actionsの最新ビルドが成功しているか確認
4. ブラウザのキャッシュをクリアして再アクセス

### 検索結果に表示されない

1. Google Search Console の「URL検査」で原因を特定
2. 「インデックス登録をリクエスト」を実行
3. 通常、新規記事は数日〜数週間でインデックスされる
4. 長期間されない場合は、コンテンツ品質に問題がある可能性

---

## 📞 連絡先・サポート

| 担当 | 連絡先 |
|---|---|
| プロジェクト全体 | 株式会社idea spot |
| microCMS の問題 | microCMS サポート(https://microcms.io/contact) |
| GitHub Pages の問題 | GitHub Support(https://support.github.com/) |
| Google Search Console | Google Search Central(https://support.google.com/webmasters) |

---

**最終更新**: 2026年5月14日
