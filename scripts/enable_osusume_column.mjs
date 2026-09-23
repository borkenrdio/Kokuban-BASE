/**
 * 「【2026年版】電子黒板おすすめ比較」コラムの公開スイッチ
 *
 * 新コラム（/columns/denshikokuban-osusume/）を microCMS で公開した当日に、
 *   node scripts/enable_osusume_column.mjs
 * を一度だけ実行する。サイト内の新コラムへの導線をまとめて有効化する。
 *
 * 公開前にリンクを入れてしまうと 404 になるため、公開が確認できるまで実行しないこと。
 * --check を付けると、書き換えずに適用状況だけを表示する。
 *
 * 実行内容:
 *   1. /lineup/          リード文直下のバナー、機能表の下の「比較表を見る」ボタン
 *   2. /denshikokuban/   「9. 失敗しない5つのチェックポイント」末尾の導線
 *   3. /                 「主要5ブランドを取り扱い〜」セクションのボタン
 *   4. 教育ツール記事     導線ボックスのリンク先を /lineup/ から新コラムへ切り替え
 *                        （scripts/apply_contextual_internal_cards.mjs のフラグ）
 *
 * 4 を反映するには、このスクリプトのあとに
 *   node scripts/apply_contextual_internal_cards.mjs
 * を実行する（npm run build:columns でも同じ処理が走る）。
 */

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const URL_PATH = '/columns/denshikokuban-osusume/';
const LABEL = '【2026年後期版】電子黒板おすすめ比較';
const CHECK_ONLY = process.argv.includes('--check');

/** @type {{file: string, name: string, anchor: string, html: string, where: 'after' | 'before'}[]} */
const EDITS = [
  {
    file: 'lineup/index.html',
    name: '/lineup/ リード文直下のバナー',
    where: 'after',
    anchor: '<p class="kb-lu-lead">Kokuban BASEは、電子黒板5ブランドの取扱窓口です。各ブランドの特徴とサイズ展開を一覧でご確認いただけます。学校・学習塾に合う1台選びから導入後のサポートまで、一緒に考えます。</p>',
    html: `
          <p class="kb-lu-osusume-banner"><a href="${URL_PATH}">目的別のおすすめや価格の違いは「${LABEL}」で詳しく解説しています</a></p>`,
  },
  {
    file: 'lineup/index.html',
    name: '/lineup/ 機能表の下のボタン',
    where: 'before',
    anchor: '          <a class="kb-lu-ftable-next__link is-pink" href="../contact/">比較して迷ったら無料で相談する ›</a>',
    html: `          <a class="kb-lu-ftable-next__link" href="${URL_PATH}">価格・スペックの比較表を見る ›</a>
`,
  },
  {
    file: 'denshikokuban/index.html',
    name: '/denshikokuban/ チェックポイント末尾の導線',
    where: 'after',
    anchor: '        <p class="kb-about-cutoff__note">参考：2026年時点の上位モデル（例：BenQ Boardの最新RP05シリーズ）はAndroid 15・メモリ16GB。足切りラインは「贅沢な基準」ではなく、市場の現在地から見れば標準的な水準です。</p>',
    html: `
        <p class="kb-about-cutoff__next">ブランドごとの違いは「<a href="${URL_PATH}">電子黒板おすすめ比較</a>」で解説しています。</p>`,
  },
  {
    file: 'index.html',
    name: 'トップ 5ブランドセクションのボタン',
    where: 'after',
    anchor: '        <h2>主要<span class="lp-accent">5ブランド</span>を取り扱い、まとめて比較できます。</h2>',
    html: `
        <p class="lp-osusume-link"><a href="${URL_PATH}">おすすめ比較を見る ›</a></p>`,
  },
];

const FLAG_FILE = 'scripts/apply_contextual_internal_cards.mjs';
const FLAG_OFF = 'const OSUSUME_PUBLISHED = false;';
const FLAG_ON = 'const OSUSUME_PUBLISHED = true;';

function main() {
  let applied = 0;
  let already = 0;
  let failed = 0;

  for (const edit of EDITS) {
    const file = path.join(ROOT, edit.file);
    const html = fs.readFileSync(file, 'utf8');

    // 適用済み判定は「この挿入箇所が入っているか」で見る。
    // ファイル内に URL があるかだけで判定すると、同じファイルへの2つ目の
    // 挿入が「適用済み」と誤判定されて入らない。
    if (html.includes(edit.html.trim())) {
      console.log(`  済  ${edit.name}`);
      already++;
      continue;
    }
    if (!html.includes(edit.anchor)) {
      console.log(`  NG  ${edit.name}（目印の文字列が見つかりません。手で入れてください）`);
      failed++;
      continue;
    }
    if (CHECK_ONLY) {
      console.log(`  未  ${edit.name}`);
      continue;
    }

    const next = edit.where === 'after'
      ? html.replace(edit.anchor, edit.anchor + edit.html)
      : html.replace(edit.anchor, edit.html + edit.anchor);
    fs.writeFileSync(file, next, 'utf8');
    console.log(`  OK  ${edit.name}`);
    applied++;
  }

  const flagPath = path.join(ROOT, FLAG_FILE);
  const flagSrc = fs.readFileSync(flagPath, 'utf8');
  if (flagSrc.includes(FLAG_ON)) {
    console.log('  済  導線ボックスのリンク先フラグ');
    already++;
  } else if (!flagSrc.includes(FLAG_OFF)) {
    console.log('  NG  導線ボックスのリンク先フラグ（目印が見つかりません）');
    failed++;
  } else if (!CHECK_ONLY) {
    fs.writeFileSync(flagPath, flagSrc.replace(FLAG_OFF, FLAG_ON), 'utf8');
    console.log('  OK  導線ボックスのリンク先フラグ');
    applied++;
  } else {
    console.log('  未  導線ボックスのリンク先フラグ');
  }

  console.log('');
  if (CHECK_ONLY) {
    console.log('--check のため、ファイルは変更していません。');
    return;
  }
  console.log(`適用 ${applied}件 / 適用済み ${already}件 / 失敗 ${failed}件`);
  if (applied > 0) {
    console.log('');
    console.log('続けて次を実行してください:');
    console.log('  node scripts/apply_contextual_internal_cards.mjs');
  }
  if (failed > 0) process.exitCode = 1;
}

main();
