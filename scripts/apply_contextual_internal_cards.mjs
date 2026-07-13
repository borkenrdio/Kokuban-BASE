import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const COLUMNS_DIR = path.join(ROOT, 'columns');
const SITE_ORIGIN = 'https://kokuban-base.com';

const additions = [
  // Price cluster
  { source: 'price', target: '/columns/install-work/', section: '設置費用｜', description: '組み立てに必要な人数や壁補強の要否など、設置工事の実際の流れを解説しています。' },
  { source: 'price', target: '/columns/warranty/', section: '保証は「5年の延長保証」', description: '延長保証を実際に付けるべきかどうかを、導入7年目の実体験から解説しています。' },
  { source: 'price', target: '/columns/taiyo-nensu/', section: '保証は「5年の延長保証」', description: '何年使えるのか・買い替えの目安はいつかを、7年目の実機の状態から整理しています。' },
  { source: 'price', target: '/columns/lease-guide/', section: 'まとめ：65インチ1台', beforeCard: '/columns/pressrelease-lease/', description: '月額の仕組み・5年契約の理由・購入との違いを解説した、リースの基本記事です。' },
  { source: 'price', target: '/columns/65inch/', section: '本体価格の相場' },
  { source: 'price', target: '/check/', section: 'まとめ：65インチ1台' },
  { source: 'lease-guide', target: '/lease/', section: 'リースとは？' },
  { source: 'lease-guide', target: '/columns/price/', section: '結論：リースと購入' },
  { source: 'lease-guide', target: '/check/', section: 'まとめ：リースは' },
  { source: 'taiyo-nensu', target: '/columns/price/', placement: 'article-end' },
  { source: 'taiyo-nensu', target: '/columns/lease-guide/', placement: 'article-end' },
  { source: 'install-work', target: '/columns/stand/', placement: 'article-end' },
  { source: 'install-work', target: '/columns/price/', placement: 'article-end' },
  { source: 'stand', target: '/columns/install-work/', section: 'おすすめの導入ステップ', description: '設置方式を決めたあとの、工事・組み立ての進め方と費用を解説しています。' },
  { source: 'pressrelease-lease', target: '/columns/lease-guide/', placement: 'article-end' },

  // Comparison cluster
  { source: 'whiteboard-chigai', target: '/columns/projector/', section: 'まとめ：毎日の板書授業' },
  { source: 'whiteboard-chigai', target: '/columns/monitor-or-denshikokuban/', section: 'まとめ：毎日の板書授業' },
  { source: 'whiteboard-chigai', target: '/denshikokuban/', section: 'まとめ：毎日の板書授業' },
  { source: 'projector', target: '/columns/whiteboard-chigai/', section: 'まとめ：日常の授業', description: 'もう一つの定番の比較、アナログのホワイトボードとの違いを4点で整理しています。' },
  { source: 'projector', target: '/lineup/', section: 'まとめ：日常の授業' },
  { source: 'monitor-or-denshikokuban', target: '/columns/projector/', section: 'まとめ：学校・塾での選び方' },
  { source: 'monitor-or-denshikokuban', target: '/columns/whiteboard-chigai/', section: 'まとめ：学校・塾での選び方', description: 'アナログのホワイトボードとの違いを、コストと健康面まで含めて比較しています。' },
  { source: 'monitor-or-denshikokuban', target: '/lineup/', section: 'まとめ：学校・塾での選び方' },

  // Specification cluster
  { source: 'spec', target: '/columns/os/', section: 'OS（オペレーティングシステム）の見方' },
  { source: 'spec', target: '/columns/memory/', section: 'メモリ（RAM）の見方' },
  { source: 'spec', target: '/columns/cpu/', section: 'CPU（プロセッサー）の見方' },
  { source: 'spec', target: '/denshikokuban/', section: 'スペック選びの結論' },
  { source: 'os', target: '/columns/spec/', section: 'バージョン選びの結論' },
  { source: 'cpu', target: '/columns/spec/', section: 'まとめ：CPU欄' },
  { source: 'memory', target: '/columns/spec/', section: 'まとめ' },

  // Size cluster
  { source: 'inch', target: '/columns/65inch/', section: 'まとめ：インチの仕組み' },
  { source: '65inch', target: '/columns/inch/', section: 'まとめ：電子黒板のサイズ' },
  { source: '65inch', target: '/columns/price/', section: 'まとめ：電子黒板のサイズ' },

  // Brand introductions and interviews
  { source: 'Starboard', target: '/columns/starboard-ideaspot-education-talk/', placement: 'article-end' },
  { source: 'Starboard', target: '/lineup/', placement: 'article-end' },
  { source: 'starboard-ideaspot-education-talk', target: '/columns/Starboard/', placement: 'article-end' },
  { source: 'starboard-ideaspot-education-talk', target: '/lineup/', placement: 'article-end' },
  { source: 'miraitouch', target: '/columns/miraitouch-ideaspot-education-talk/', placement: 'article-end' },
  { source: 'miraitouch', target: '/columns/miraitouch-direct/', placement: 'article-end' },
  { source: 'miraitouch', target: '/lineup/', placement: 'article-end' },
  { source: 'miraitouch-ideaspot-education-talk', target: '/columns/miraitouch/', placement: 'article-end' },
  { source: 'miraitouch-ideaspot-education-talk', target: '/lineup/', placement: 'article-end' },
  { source: 'miraitouch-direct', target: '/columns/miraitouch/', placement: 'article-end' },
  { source: 'miraitouch-direct', target: '/columns/miraitouch-ideaspot-education-talk/', placement: 'article-end' },
  { source: 'miraitouch-direct', target: '/lineup/', placement: 'article-end' },
  { source: 'sharp-bigpad', target: '/columns/sharp-ideaspot-education-talk/', placement: 'article-end' },
  { source: 'sharp-bigpad', target: '/lineup/', placement: 'article-end' },
  { source: 'sharp-ideaspot-education-talk', target: '/columns/sharp-bigpad/', placement: 'article-end' },
  { source: 'sharp-ideaspot-education-talk', target: '/lineup/', placement: 'article-end' },
  { source: 'BenQBoard', target: '/columns/benq-ideaspot-education-talk/', placement: 'article-end' },
  { source: 'BenQBoard', target: '/lineup/', placement: 'article-end' },
  { source: 'benq-ideaspot-education-talk', target: '/columns/BenQBoard/', placement: 'article-end' },
  { source: 'benq-ideaspot-education-talk', target: '/columns/benQboard-NFC/', placement: 'article-end' },
  { source: 'benq-ideaspot-education-talk', target: '/lineup/', placement: 'article-end' },
  { source: 'benQboard-NFC', target: '/columns/BenQBoard/', placement: 'article-end' },
  { source: 'benQboard-NFC', target: '/lineup/', placement: 'article-end' },

  // Feature hub and adjacent-use clusters
  { source: 'bansho', target: '/columns/cloud/', placement: 'article-end' },
  { source: 'bansho', target: '/columns/qrcode/', placement: 'article-end' },
  { source: 'bansho', target: '/columns/gamenbunkatsu/', placement: 'article-end' },
  { source: 'bansho', target: '/columns/screenshot/', placement: 'article-end' },
  { source: 'bansho', target: '/denshikokuban/', placement: 'article-end' },
  { source: 'cloud', target: '/columns/bansho/', placement: 'article-end' },
  { source: 'cloud', target: '/denshikokuban/', placement: 'article-end' },
  { source: 'qrcode', target: '/columns/bansho/', placement: 'article-end' },
  { source: 'qrcode', target: '/denshikokuban/', placement: 'article-end' },
  { source: 'screenshot', target: '/columns/bansho/', placement: 'article-end' },
  { source: 'screenshot', target: '/denshikokuban/', placement: 'article-end' },
  { source: 'gamenbunkatsu', target: '/columns/bansho/', placement: 'article-end' },
  { source: 'gamenbunkatsu', target: '/denshikokuban/', placement: 'article-end' },
  { source: 'pdf', target: '/columns/bansho/', placement: 'article-end' },
  { source: 'pdf', target: '/columns/screenshot/', placement: 'article-end' },
  { source: 'pdf', target: '/denshikokuban/', placement: 'article-end' },
  { source: 'screenshot', target: '/columns/pdf/', placement: 'article-end' },
  { source: 'AI-education', target: '/columns/Gemini/', placement: 'article-end' },
  { source: 'AI-education', target: '/denshikokuban/', placement: 'article-end' },
  { source: 'Gemini', target: '/columns/AI-education/', placement: 'article-end' },
  { source: 'Gemini', target: '/denshikokuban/', placement: 'article-end' },
  { source: 'camera-cloud', target: '/columns/camera1/', placement: 'article-end' },
  { source: 'camera-cloud', target: '/columns/miraitouch/', placement: 'article-end' },
  { source: 'camera-cloud', target: '/denshikokuban/', placement: 'article-end' },
  { source: 'camera1', target: '/columns/camera-cloud/', placement: 'article-end' },
  { source: 'camera1', target: '/columns/miraitouch/', placement: 'article-end' },
  { source: 'camera1', target: '/denshikokuban/', placement: 'article-end' },
];

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function plainText(value = '') {
  return value.replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim();
}

function absoluteUrl(target) {
  return target.startsWith('http') ? target : `${SITE_ORIGIN}${target}`;
}

function localFileFor(target) {
  const pathname = new URL(absoluteUrl(target)).pathname;
  return path.join(ROOT, pathname.replace(/^\//, ''), 'index.html');
}

function extractMeta(html, property) {
  const match = new RegExp(`<meta property="${property}" content="([^"]*)"`, 'i').exec(html);
  return match ? match[1] : '';
}

function targetMeta(target) {
  const file = localFileFor(target);
  if (!fs.existsSync(file)) return null;
  const html = fs.readFileSync(file, 'utf8');
  return {
    title: extractMeta(html, 'og:title').replace(/(?:｜|\|| - )Kokuban BASE$/, '').trim(),
    description: extractMeta(html, 'og:description'),
    image: extractMeta(html, 'og:image') || `${SITE_ORIGIN}/assets/ogp.png`,
  };
}

function cardHtml(item) {
  const meta = targetMeta(item.target);
  if (!meta) return '';
  const href = absoluteUrl(item.target);
  const title = escapeHtml(item.title || meta.title);
  const description = escapeHtml(item.description || meta.description || '');
  const image = escapeHtml(meta.image);
  return `<blockquote class="contextual-internal-card"><p>あわせて読みたい</p><p>${title}<br><a href="${href}" class="internal-link-card" aria-label="${title}">
    <span class="internal-link-card__image"><img src="${image}" alt="${title}" loading="lazy" decoding="async"></span>
    <span class="internal-link-card__body">
      <span class="internal-link-card__title">${title}</span>
      <span class="internal-link-card__description">${description}</span>
    </span>
  </a></p></blockquote>`;
}

function removeGeneratedCards(html) {
  return html.replace(/\n?<!-- contextual-link: .*?-->\s*<blockquote class="contextual-internal-card">[\s\S]*?<\/blockquote>\s*/g, '');
}

function hasCard(html, target) {
  const pathname = new URL(absoluteUrl(target)).pathname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const card = new RegExp(`<a\\s+[^>]*href="(?:https://kokuban-base\\.com)?${pathname}"[^>]*class="[^"]*internal-link-card`, 'i');
  return card.test(html);
}

function headings(html) {
  return [...html.matchAll(/<h2\b[^>]*>[\s\S]*?<\/h2>/gi)].map((match) => ({ index: match.index, text: plainText(match[0]) }));
}

function contentEnd(html) {
  const editorialAt = html.indexOf('<!-- 執筆・監修');
  if (editorialAt >= 0) {
    const articleBodyClose = html.lastIndexOf('</div>', editorialAt);
    if (articleBodyClose >= 0) return articleBodyClose;
  }
  const candidates = [
    html.indexOf('<!-- 関連記事'),
    html.indexOf('<!-- 著者'),
    html.indexOf('<section class="related'),
    html.indexOf('<div class="share-buttons'),
  ].filter((index) => index >= 0);
  return candidates.length ? Math.min(...candidates) : html.lastIndexOf('</article>');
}

function insertIndex(html, item) {
  const list = headings(html);
  if (item.section) {
    const current = list.findIndex((heading) => heading.text.includes(item.section));
    if (current === -1) return -1;
    const end = current + 1 < list.length ? list[current + 1].index : contentEnd(html);
    if (item.beforeCard) {
      const pathname = new URL(absoluteUrl(item.beforeCard)).pathname;
      const absoluteHref = `href="${absoluteUrl(pathname)}"`;
      const relativeHref = `href="${pathname}"`;
      const linkAt = [html.indexOf(absoluteHref, list[current].index), html.indexOf(relativeHref, list[current].index)]
        .filter((index) => index >= 0 && index < end)
        .sort((a, b) => a - b)[0];
      if (linkAt !== undefined) {
        const quoteAt = html.lastIndexOf('<blockquote', linkAt);
        if (quoteAt > list[current].index) return quoteAt;
      }
    }
    return end;
  }
  const faq = list.find((heading) => heading.text.includes('よくある質問'));
  return faq ? faq.index : contentEnd(html);
}

function unwrapMatchingLinks(html, rules) {
  return html.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (whole, attrs, inner) => {
    if (/internal-link-card/.test(attrs)) return whole;
    const href = (/href="([^"]+)"/i.exec(attrs) || [])[1] || '';
    const text = plainText(inner);
    const matches = rules.some((rule) => absoluteUrl(href).replace(/\/$/, '') === absoluteUrl(rule.href).replace(/\/$/, '') && text.includes(rule.text));
    return matches ? text : whole;
  });
}

const cleanupRules = {
  'lease-guide': [
    { href: '/lease/', text: 'リースページ' },
    { href: '/lease/', text: 'リースのページ' },
    { href: '/check/', text: '30秒でわかる電子黒板選びチェック' },
  ],
  'whiteboard-chigai': [
    { href: '/columns/bansho/', text: '電子黒板の板書は消さなくていい' },
    { href: '/check/', text: '30秒でわかる電子黒板選びチェック' },
    { href: '/lineup/', text: 'ラインナップ比較' },
  ],
};

const sources = new Set(additions.map(({ source }) => source));
let added = 0;
let skipped = 0;
let missing = 0;

for (const source of sources) {
  const file = path.join(COLUMNS_DIR, source, 'index.html');
  if (!fs.existsSync(file)) continue;
  let html = removeGeneratedCards(fs.readFileSync(file, 'utf8'));
  if (cleanupRules[source]) html = unwrapMatchingLinks(html, cleanupRules[source]);

  for (const item of additions.filter((entry) => entry.source === source)) {
    if (hasCard(html, item.target)) {
      skipped++;
      continue;
    }
    const card = cardHtml(item);
    const at = insertIndex(html, item);
    if (!card || at < 0) {
      missing++;
      continue;
    }
    const marker = `\n<!-- contextual-link: ${source} -> ${new URL(absoluteUrl(item.target)).pathname} -->\n`;
    html = `${html.slice(0, at)}${marker}${card}\n${html.slice(at)}`;
    added++;
  }
  html = html.replace(/\r\n?/g, '\n').replace(/[ \t]+$/gm, '');
  fs.writeFileSync(file, html, 'utf8');
}

console.log(`Contextual cards added: ${added}; skipped existing: ${skipped}; missing: ${missing}.`);
