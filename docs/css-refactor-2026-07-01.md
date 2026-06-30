# styles.css リファクタリング調査・作業レポート（2026-07-01）

## 1. ゴールと制約
- 目的: 見た目を**一切変えず**、`styles.css`（約11,000行）の保守性を上げる。
- 制約: クラス名変更なし／HTML構造変更なし／コミット・プッシュ禁止（変更は Git の Changes に残すのみ）。

## 2. 調査でわかったこと（重要）
このファイルは「重複だらけで減量できる」想定とは**逆**でした。

1. **完全一致する重複ルールは全体でわずか1件**（4行）。単純な重複削除では減量できません。
2. 「同一セレクタが2〜3回定義」は **88件** ありますが、これは中身が異なる**歴代リデザインの上書きレイヤー**（`Top feature redesign` → `refinements` → `final balance` 等）。
   並べ替え・統合すると**カスケード（適用順・詳細度）が崩れて見た目が変わる**ため、安全に統合できません。
3. **未使用に見えるCSSの多くは inline JS が実行時に文字列連結で生成**しており、静的解析（grep / `includes`）では検出できません。実証例:
   - `index.html`: `'column-thumb column-thumb-0' + ((index % 3) + 1)` → `column-thumb-01/02/03`
   - `information/index.html`: `'information-tag information-tag--' + categoryType(category)` → `information-tag--event` 等
   - `index.html`: 新着の種別 → `'news-cat news-cat-event'` 等
   これらは完全な文字列がソースに存在しないため、`grep` でも `includes()` でも「未使用」と**誤検知**されます。
   → **静的解析だけでの一括削除は破壊リスクが高い**と判断し、行いませんでした。

### その他の環境メモ
- 文字コード: UTF-8 / 改行: **CRLF**。一部の既存コメントには**文字化け（U+FFFD）が元から焼き込み済み**（今回は触れていません）。
- styles.css を**読み込まないページ**（Tailwind CDN 利用）: `column`(一覧), `Kokubanlease`, `reservation`, `on-line-reservation`, `online-consultation`, `privacy`, `team/*`。
- JS で動的付与されるクラス: `is-menu-open`, `is-active`（site.js）, `is-success/is-error/is-loading`（contact, `is-${type}`）, `hidden`/`overflow-hidden` 等（Tailwind系ページ）, lineup タブの `is-active`。

## 3. このパスで実施した変更（`styles.css` のみ・見た目への影響なし）
1. **目次（TOC）コメントを先頭に追加** … 11,000行をエディタ検索で移動できるよう、各セクションに「検索アンカー」を併記。
2. **完全重複ルール1件を除去** … `@media (max-width:1180px)` 内の
   `.lineup-brand-guide … .lineup-guide-spec-hero { grid-template-columns:1fr }`。
   同一メディアクエリの**後方**で同じ宣言が再定義されているため、計算結果は不変。
3. **末尾に MAINTENANCE NOTES を追記** … 上記の経緯・上書きレイヤー・未使用候補一覧・削除厳禁リストを記録。

物理的な並べ替え・上書きレイヤーの統合・クラス削除は**一切していません**。

## 4. 検証（見た目が変わらないことの証明）
変更前後の `styles.css` を**ルール単位でパースして比較**しました（スクリーンショットのサンプリングより強い、全ルール網羅の検証）。
- 解析結果: ルール数 1656 → 1655、**差分は「意図した重複1件の除去」のみ**。追加・並べ替えゼロ。
- 順序付き比較でも、1件の除去を除き**完全一致**。
- 除去した値（`1fr`）は同一メディアクエリ後方で再宣言されるため、**全ページで計算結果は同一** = 見た目不変。
- ブレース対応もバランス済み（depth 0）。CRLF維持・LF混入ゼロ。

> 静的サイトかつ microCMS のコンテンツは実行時取得のため、ローカルの file:// では一覧が描画されません。
> そのため「全ページのCSS計算結果が不変であること」をルール集合の同値性で証明する方法を採用しました（サンプル目視より網羅的）。

## 5. 未使用候補（削除せず・要手動確認）
以下は**現リポジトリのマークアップに静的には現れない**クラスですが、旧デザイン残骸の可能性が高いものの、
**実行時生成・microCMS由来HTML・各ページの inline script** で使われている可能性が残るため、**削除していません**。
削除する場合は、必ず本番のレンダリング済みDOMと各ページの `<script>` を確認し、確証が取れたものだけにしてください。

### 5-1. 削除厳禁（静的には未使用に見えるが、実行時生成で実際は使用中）
`column-thumb-01`, `column-thumb-02`, `column-thumb-03`,
`information-tag--event`, `information-tag--media`, `information-tag--interview`, `information-tag--press`,
`information-thumb--empty`, `news-cat-event`, `news-cat-media`

### 5-2. 未使用候補（旧デザイン残骸の可能性・125件）
旧「selection」トップ機能デザイン、旧 hero、旧 lease スライダー、旧 contact フォーム、旧 voices/online/guide 等のレイヤーが中心です。

```
board-visual-02 board-visual-03 board-visual-04 board-visual-05 btn-hero btn-white card-grid
contact-actions contact-checkbox-grid contact-choice contact-choice-grid contact-fieldset
contact-fieldset-compact contact-form-card contact-form-grid contact-form-section contact-intro
contact-panel contact-privacy contact-section contact-submit-row
declaration declaration-icon declaration-kicker declaration-panel declaration-title
faq-cta faq-heading-icon faq-link faq-list faq-section feature-body feature-icon
firsttime-mission firsttime-mission-inner
guide-flow-figure--logo guide-grid guide-section guide-step-icon guide-step-label guide-step-num
guide-steps guide-steps-bg
hero hero-brand hero-content hero-copy hero-overlay hero-video implementation-support-brand is-price
lease-example-card lease-example-grid lease-example-note lease-example-photo lease-example-spec
lease-flow-steps lease-hero lease-hero-btn lease-hero-content lease-hero-dots lease-panel
lease-slide lease-slide-01 lease-slide-02 lease-slide-03 lease-slide-04 lease-slides
lineup-grid lineup-guide-comment lineup-guide-illustration lineup-guide-label lineup-guide-spec-summary
lineup-hero lineup-slider-head lp-hero-point-icon lp-hero-point-text lp-hero-points
online-about online-cta-figure-placeholder online-feature-grid online-feature-section
online-flow-list online-flow-section online-lead online-lead-title online-note
operator-label operator-logo operator-logo-mark page-column-list page-note partner-logo partner-logos
section-blue section-heading
selection-board selection-board-accent selection-board-line selection-card selection-card-icon
selection-card-text selection-copy selection-eyebrow selection-flow selection-lead selection-panel
selection-title-line selection-title-pink
service-concern service-section service-selection-section showroom-access
support-hero support-label support-section top-guide-visual--steps two-column
voice-avatar voice-card voice-card-grid voice-card-head voices-lead voices-note voices-section
```

> 注: 一部（`service-section`, `lineup-grid`, `two-column`, `online-lead`, `lease-example-grid` など）は
> TOC の検索アンカーにも使っています。CSS定義自体は存在するためアンカーとしては機能します。

## 6. 安全に減量を進めたい場合の次の手順（推奨）
1. 本番サイトを開き、DevTools の Coverage（未使用CSS）と、各テンプレHTML＋inline scriptを突き合わせる。
2. `selection-*`（旧トップ機能デザイン）など、**コンポーネント単位で丸ごと未使用**と確認できた塊から、
   1ブロックずつ削除 →（できれば）本番同等環境で目視 → コミット、を繰り返す。
3. 上書きレイヤー（5-2の selection/lineup-spec 等）は、computed style が一致するか個別検証してから統合する。

## 7. 残っているリスク・未対応
- 上書きレイヤーの統合（行数削減の主因）は**未実施**（安全に自動化できないため）。
- 未使用候補の削除は**未実施**（実行時生成の誤検知リスクがあるため）。
- 文字化けコメントの修復は**未対応**（原文が失われており推測修復は避けた）。
