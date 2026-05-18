# Kokuban BASE 改修ファイル一式

このzipには、Kokuban BASE サイトのSEO改修と機能追加で生成された全ファイルが含まれます。

## 📁 ディレクトリ構造

```
kokuban-base-bundle/
├── README.md                            ← このファイル
├── index.html                           ← トップページ
├── article.html                         ← コラム一覧
├── Kokubanlease.html                    ← リース紹介(canonical修正)
├── contact.html
├── information.html
├── on-line-reservation.html             ← description追加
├── privacy.html                         ← description + noindex追加
├── reservation.html
├── terms.html                           ← description + noindex追加
├── whatissmrtboard.html                 ← SEO最適化
│
├── columns/
│   └── template.html                    ← コラム記事の雛形
│
├── scripts/
│   └── fetch_and_build.mjs              ← メインビルドスクリプト
│
├── .github/
│   └── workflows/
│       └── deploy.yml                   ← GitHub Actions設定
│
└── docs/                                ← ドキュメント類
    ├── PROJECT_ARCHITECTURE.md          全体設計書
    ├── FILES_RELATIONSHIP_MAP.md        ファイル関係性マップ
    ├── seo-report.md                    SEO診断レポート
    └── article-rewrite-sample-seiza-rika.md  記事リライトサンプル
```

## 🚀 配置手順

このzipを展開すると、リポジトリ(Kokuban-BASE-main)に対応するディレクトリ構造になっています。
各ファイルを既存のリポジトリの**同じ場所に上書きコピー**してください。

ただし、`docs/` フォルダの中身はリポジトリには入れず、**Notion / Google ドライブ / Wikiなど**で管理することを推奨します。

## ⚠️ デプロイ前の確認事項

1. **`fetch_and_build.mjs`の `AUTHORS` 配列**にある執筆者情報が正しいか確認してください。
2. **microCMSのスキーマに `revisedAt` フィールドを追加**してから、本ファイルをデプロイしてください。
3. **GitHub Secrets**に `MICROCMS_SERVICE_DOMAIN`、`MICROCMS_API_KEY` が正しく設定されているか確認してください。

## 🎯 推奨デプロイ順序

詳細は `docs/FILES_RELATIONSHIP_MAP.md` を参照してください。

### Stage 1: コアファイル(全コラム記事に影響)
1. `scripts/fetch_and_build.mjs`
2. `columns/template.html`
3. `.github/workflows/deploy.yml`

### Stage 2: トップページと主要ランディング
4. `index.html`
5. `article.html`
6. `Kokubanlease.html`

### Stage 3: 集客ページ
7. `whatissmrtboard.html`
8. `on-line-reservation.html`
9. `contact.html`、`reservation.html`、`information.html`

### Stage 4: ポリシー類
10. `privacy.html`、`terms.html`

## 📚 ドキュメント

- **PROJECT_ARCHITECTURE.md** — プロジェクト全体の設計書(必読)
- **FILES_RELATIONSHIP_MAP.md** — ファイル関係性マップ(実務向け)
- **seo-report.md** — SEO診断レポート(現状と残課題)
- **article-rewrite-sample-seiza-rika.md** — 記事リライトの実例

## 📞 サポート

問題や質問は、運営チーム(株式会社idea spot)までご連絡ください。

最終更新: 2026年5月14日
