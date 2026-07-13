import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const COLUMNS_DIR = path.join(ROOT, 'columns');

const SITE_PAGES = {
  '/lease/': {
    title: '電子黒板のリース | 月額定額・初期費用を抑えて導入 - Kokuban BASE',
    description: '電子黒板を月額定額で導入したい方向けに、リースの仕組み・費用・相談方法を案内しています。',
    image: 'https://kokuban-base.com/assets/ogp-lease.png',
  },
  '/lineup/': {
    title: '電子黒板の比較・おすすめラインナップ｜主要5ブランドの特徴 - Kokuban BASE',
    description: 'Kokuban BASEが取り扱う電子黒板5ブランドを一覧で比較。サイズ・特徴・選び方の基準を分かりやすく紹介します。',
    image: 'https://kokuban-base.com/assets/ogp-lineup.png',
  },
  '/denshikokuban/': {
    title: '電子黒板とは？仕組み・できること・選び方・価格を分かりやすく解説 - Kokuban BASE',
    description: '電子黒板の仕組み、基本機能、できること、サイズ、価格、選び方を初めての方にも分かりやすく解説します。',
    image: 'https://kokuban-base.com/assets/ogp-denshikokuban.png',
  },
  '/check/': {
    title: '電子黒板の選び方診断｜30秒で分かる無料チェック | Kokuban BASE',
    description: '5つの質問に答えるだけで、教室に合う電子黒板ブランド・サイズ・リース目安月額が分かる無料診断です。',
    image: 'https://kokuban-base.com/assets/ogp-check.png',
  },
};

const ADDITIONS = [
  // Priority 1: A系価格クラスター
  ['price', '/columns/install-work/', '保証は「5年の延長保証」'],
  ['price', '/columns/taiyo-nensu/', '送料｜都度見積もり'],
  ['price', '/columns/lease-guide/', 'まとめ：65インチ1台の予算'],
  ['price', '/check/', 'この記事の執筆・監修'],
  ['lease-guide', '/check/', 'よくある質問'],
  ['stand', '/columns/install-work/', 'おすすめの導入ステップ'],
  ['pressrelease-lease', '/columns/lease-guide/', 'この記事の執筆・監修'],

  // Priority 2: 比較3部作と親ページ
  ['whiteboard-chigai', '/columns/projector/', 'まとめ：毎日の板書授業なら電子黒板'],
  ['whiteboard-chigai', '/columns/monitor-or-denshikokuban/', 'まとめ：毎日の板書授業なら電子黒板'],
  ['whiteboard-chigai', '/denshikokuban/', 'よくある質問'],
  ['projector', '/columns/whiteboard-chigai/', 'まとめ：日常の授業なら電子黒板'],
  ['projector', '/lineup/', 'この記事の執筆・監修'],
  ['monitor-or-denshikokuban', '/columns/projector/', 'まとめ：学校・塾での選び方'],
  ['monitor-or-denshikokuban', '/columns/whiteboard-chigai/', 'まとめ：学校・塾での選び方'],
  ['monitor-or-denshikokuban', '/lineup/', 'この記事の執筆・監修'],

  // Priority 3: スペック系
  ['spec', '/denshikokuban/', 'この記事の執筆・監修'],
  ['os', '/columns/spec/', 'バージョン選びの結論'],
  ['cpu', '/columns/spec/', 'まとめ：CPU欄はもう怖くない'],
  ['memory', '/columns/spec/', 'まとめ'],

  // Priority 4: サイズ系
  ['inch', '/columns/65inch/', 'まとめ：インチの仕組み'],
  ['65inch', '/columns/price/', 'まとめ：電子黒板のサイズ'],

  // Priority 5: ブランド系
  ['Starboard', '/lineup/', 'この記事の執筆・監修'],
  ['starboard-ideaspot-education-talk', '/columns/Starboard/', 'この記事の執筆・監修'],
  ['starboard-ideaspot-education-talk', '/lineup/', 'この記事の執筆・監修'],
  ['miraitouch', '/columns/miraitouch-ideaspot-education-talk/', 'まとめ：MIRAI TOUCH'],
  ['miraitouch', '/columns/miraitouch-direct/', 'まとめ：MIRAI TOUCH'],
  ['miraitouch', '/lineup/', 'この記事の執筆・監修'],
  ['miraitouch-ideaspot-education-talk', '/columns/miraitouch/', 'この記事の執筆・監修'],
  ['miraitouch-ideaspot-education-talk', '/lineup/', 'この記事の執筆・監修'],
  ['miraitouch-direct', '/columns/miraitouch/', 'この記事の執筆・監修'],
  ['miraitouch-direct', '/columns/miraitouch-ideaspot-education-talk/', 'この記事の執筆・監修'],
  ['miraitouch-direct', '/lineup/', 'この記事の執筆・監修'],
  ['sharp-bigpad', '/lineup/', 'この記事の執筆・監修'],
  ['sharp-ideaspot-education-talk', '/columns/sharp-bigpad/', 'この記事の執筆・監修'],
  ['sharp-ideaspot-education-talk', '/lineup/', 'この記事の執筆・監修'],
  ['BenQBoard', '/lineup/', 'この記事の執筆・監修'],
  ['benq-ideaspot-education-talk', '/columns/BenQBoard/', 'この記事の執筆・監修'],
  ['benq-ideaspot-education-talk', '/columns/benQboard-NFC/', 'この記事の執筆・監修'],
  ['benq-ideaspot-education-talk', '/lineup/', 'この記事の執筆・監修'],
  ['benQboard-NFC', '/columns/BenQBoard/', 'まとめ'],
  ['benQboard-NFC', '/lineup/', 'この記事の執筆・監修'],

  // Priority 6: D系活用記事
  ['bansho', '/columns/gamenbunkatsu/', 'メリット①'],
  ['bansho', '/columns/screenshot/', 'メリット②'],
  ['bansho', '/denshikokuban/', 'この記事の執筆・監修'],
  ['cloud', '/columns/bansho/', 'まとめ：一枚の板書'],
  ['cloud', '/denshikokuban/', 'この記事の執筆・監修'],
  ['qrcode', '/columns/bansho/', 'まとめ：板書を「写す」'],
  ['qrcode', '/denshikokuban/', 'この記事の執筆・監修'],
  ['screenshot', '/columns/bansho/', 'まとめ：スクリーンショット'],
  ['screenshot', '/columns/pdf/', 'まとめ：スクリーンショット'],
  ['screenshot', '/denshikokuban/', 'この記事の執筆・監修'],
  ['gamenbunkatsu', '/columns/bansho/', 'まとめ：画面分割機能'],
  ['gamenbunkatsu', '/denshikokuban/', 'この記事の執筆・監修'],
  ['pdf', '/denshikokuban/', 'この記事の執筆・監修'],
  ['AI-education', '/columns/Gemini/', 'まとめ：AIは'],
  ['AI-education', '/denshikokuban/', 'この記事の執筆・監修'],
  ['Gemini', '/columns/AI-education/', 'まとめ：AIで'],
  ['Gemini', '/denshikokuban/', 'この記事の執筆・監修'],
  ['camera-cloud', '/columns/camera1/', '方法③：書画カメラ'],
  ['camera-cloud', '/columns/miraitouch/', 'まとめ：紙資料は'],
  ['camera-cloud', '/denshikokuban/', 'この記事の執筆・監修'],
  ['camera1', '/columns/camera-cloud/', 'まとめ：図形を描く時間'],
  ['camera1', '/columns/miraitouch/', 'MIRAI TOUCHなら'],
  ['camera1', '/denshikokuban/', 'この記事の執筆・監修'],
];

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[ch]));
}

function extractMeta(html, name) {
  const prop = new RegExp(`<meta property="${name}" content="([^"]*)"`, 'i').exec(html);
  if (prop) return prop[1];
  const named = new RegExp(`<meta name="${name}" content="([^"]*)"`, 'i').exec(html);
  return named ? named[1] : '';
}

function stripBrand(title = '') {
  return title.replace(/｜Kokuban BASE$/, '').replace(/ - Kokuban BASE$/, '').replace(/ \\| Kokuban BASE$/, '').trim();
}

function getColumnMeta(slug) {
  const file = path.join(COLUMNS_DIR, slug, 'index.html');
  if (!fs.existsSync(file)) return null;
  const html = fs.readFileSync(file, 'utf8');
  return {
    title: stripBrand(extractMeta(html, 'og:title')),
    description: extractMeta(html, 'og:description'),
    image: extractMeta(html, 'og:image'),
  };
}

function normalizeHref(target) {
  if (target.startsWith('https://kokuban-base.com')) {
    return new URL(target).pathname;
  }
  return target;
}

function resolveTarget(target) {
  const href = normalizeHref(target);
  if (href.startsWith('/columns/')) {
    const slug = decodeURIComponent(href.replace(/^\/columns\//, '').replace(/\/$/, ''));
    const meta = getColumnMeta(slug);
    if (!meta) return null;
    return { href, ...meta, external: false };
  }
  if (SITE_PAGES[href]) {
    return { href: `https://kokuban-base.com${href}`, ...SITE_PAGES[href], external: true };
  }
  return null;
}

function cardHtml(target) {
  const meta = resolveTarget(target);
  if (!meta) return '';
  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description || '');
  const image = escapeHtml(meta.image || 'https://kokuban-base.com/assets/ogp.png');
  const site = meta.external ? '\n      <span class="internal-link-card__site">kokuban-base.com</span>' : '';
  const externalAttrs = meta.external ? ' target="_blank" rel="noopener noreferrer"' : '';
  const imageClass = meta.external ? ' internal-link-card__image--external' : '';
  const preface = meta.external ? '関連ページ' : 'あわせて読みたい';

  return `<blockquote class="contextual-internal-card"><p>${preface}</p><p>${title}<br><a href="${meta.href}" class="internal-link-card"${externalAttrs} aria-label="${title}">
    <span class="internal-link-card__image${imageClass}"><img src="${image}" alt="${title}" loading="lazy" decoding="async"></span>
    <span class="internal-link-card__body">
      <span class="internal-link-card__title">${title}</span>
      <span class="internal-link-card__description">${description}</span>${site}
    </span>
  </a></p></blockquote>`;
}

function hasBodyLink(html, target) {
  const relatedIdx = html.indexOf('<!-- 関連記事');
  const body = relatedIdx === -1 ? html : html.slice(0, relatedIdx);
  const href = normalizeHref(target);
  const exact = new RegExp(`<a href="${href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}" class="internal-link-card"`);
  const absolute = new RegExp(`<a href="https://kokuban-base\\.com${href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}" class="internal-link-card"`);
  return exact.test(body) || absolute.test(body);
}

function findInsertIndex(html, headingText) {
  const headingRegex = /<h[23][^>]*>[\s\S]*?<\/h[23]>/gi;
  let match;
  while ((match = headingRegex.exec(html)) !== null) {
    const plain = match[0].replace(/<[^>]+>/g, '');
    if (plain.includes(headingText)) return match.index;
  }
  const relatedIdx = html.indexOf('<!-- 関連記事');
  if (relatedIdx !== -1) return relatedIdx;
  const authorIdx = html.indexOf('この記事の執筆・監修');
  if (authorIdx !== -1) return authorIdx;
  return -1;
}

let added = 0;
let skipped = 0;
let missing = 0;

for (const [source, target, beforeHeading] of ADDITIONS) {
  const file = path.join(COLUMNS_DIR, source, 'index.html');
  if (!fs.existsSync(file)) {
    missing++;
    continue;
  }
  let html = fs.readFileSync(file, 'utf8');
  if (hasBodyLink(html, target)) {
    skipped++;
    continue;
  }
  const card = cardHtml(target);
  if (!card) {
    missing++;
    continue;
  }
  const insertAt = findInsertIndex(html, beforeHeading);
  if (insertAt === -1) {
    missing++;
    continue;
  }
  const marker = `\n<!-- contextual-link: ${source} -> ${normalizeHref(target)} -->\n`;
  html = `${html.slice(0, insertAt)}${marker}${card}\n${html.slice(insertAt)}`;
  fs.writeFileSync(file, html, 'utf8');
  added++;
}

console.log(`Contextual cards added: ${added}; skipped existing: ${skipped}; missing: ${missing}.`);
