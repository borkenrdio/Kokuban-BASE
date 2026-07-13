import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const COLUMNS_DIR = path.join(ROOT, 'columns');
const BASE_URL = 'https://kokuban-base.com';

const RELATED_BY_SLUG = {
  '65inch': ['inch', 'price', 'install-work'],
  'inch': ['65inch', 'price', 'install-work'],
  'os': ['spec', 'memory', 'cpu'],
  'memory': ['spec', 'cpu', 'os'],
  'cpu': ['spec', 'memory', 'os'],
  'spec': ['os', 'price', 'warranty'],
  'price': ['lease-guide', 'warranty', 'taiyo-nensu'],
  'lease-guide': ['price', 'warranty', 'pressrelease-lease'],
  'pressrelease-lease': ['lease-guide', 'price', 'warranty'],
  'warranty': ['taiyo-nensu', 'lease-guide', 'install-work'],
  'taiyo-nensu': ['warranty', 'price', 'spec'],
  'install-work': ['stand', 'price', 'warranty'],
  'stand': ['install-work', '65inch', 'price'],
  'monitor-or-denshikokuban': ['projector', 'whiteboard-chigai', 'denshikokuban-gakushujuku'],
  'projector': ['monitor-or-denshikokuban', 'whiteboard-chigai', 'price'],
  'whiteboard-chigai': ['monitor-or-denshikokuban', 'bansho', 'price'],

  'BenQBoard': ['benq-ideaspot-education-talk', 'benQboard-NFC', 'spec'],
  'benq-ideaspot-education-talk': ['BenQBoard', 'benQboard-NFC', 'Gemini'],
  'benQboard-NFC': ['BenQBoard', 'benq-ideaspot-education-talk', 'microsoft-teams-chat'],
  'miraitouch': ['miraitouch-ideaspot-education-talk', 'spec', 'miraitouch-direct'],
  'MIRAI TOUCH': ['miraitouch', 'spec', 'miraitouch-direct'],
  'miraitouch-direct': ['miraitouch', 'miraitouch-ideaspot-education-talk', 'spec'],
  'miraitouch-ideaspot-education-talk': ['miraitouch', 'miraitouch-direct', 'denshikokuban-gakushujuku'],
  'sharp-bigpad': ['sharp-ideaspot-education-talk', 'spec', 'price'],
  'sharp-ideaspot-education-talk': ['sharp-bigpad', 'BenQBoard', 'Starboard'],
  'Starboard': ['starboard-ideaspot-education-talk', 'BenQBoard', 'miraitouch'],
  'starboard-ideaspot-education-talk': ['Starboard', 'sharp-bigpad', 'BenQBoard'],

  'bansho': ['qrcode', 'cloud', 'whiteboard-chigai'],
  'qrcode': ['bansho', 'cloud', 'screenshot'],
  'cloud': ['qrcode', 'bansho', 'onenote'],
  'screenshot': ['pdf', 'qrcode', 'camera-cloud'],
  'pdf': ['screenshot', 'PowerPoint', 'gamenbunkatsu'],
  'gamenbunkatsu': ['pdf', 'PowerPoint', 'bansho'],
  'PowerPoint': ['pdf', 'doga', 'screenshot'],
  'doga': ['PowerPoint', 'pdf', 'screenshot'],
  'camera-cloud': ['camera1', 'screenshot', 'pdf'],
  'camera1': ['digital-gene', 'camera-cloud', 'install-work'],
  'onenote': ['cloud', 'pdf', 'qrcode'],
  'microsoft-teams-chat': ['groupwork', 'benQboard-NFC', 'spec'],
  'groupwork': ['microsoft-teams-chat', 'cloud', 'bansho'],

  'AI-education': ['Gemini', 'microsoft-teams-chat', 'denshikokuban-gakushujuku'],
  'Gemini': ['AI-education', 'kokugo-idea', 'spec'],
  'kokugo-idea': ['kokugo-kanji-denshikokuban', 'Gemini', 'bansho'],
  'kokugo-kanji-denshikokuban': ['kokugo-idea', 'digital-gene', 'bansho'],
  'listening': ['PowerPoint', 'microsoft-teams-chat', 'bansho'],
  'chromemusiclab': ['doga', 'groupwork', 'PowerPoint'],
  'shakaika-kiso': ['google-earth', 'ifp-lesson-lab-googlemap', 'whiteboard-chigai'],
  'google-earth': ['googleearth-Flight-simulator', 'ifp-lesson-lab-googlemap', 'shakaika-kiso'],
  'googleearth-Flight-simulator': ['google-earth', 'ifp-lesson-lab-googlemap', 'whiteboard-chigai'],
  'ifp-lesson-lab-googlemap': ['google-earth', 'shakaika-kiso', 'onagawa-denshikokuban'],
  'onagawa-denshikokuban': ['shakaika-kiso', 'google-earth', 'ifp-lesson-lab-googlemap'],
  'digital-gene': ['camera1', 'javalab', 'kokugo-kanji-denshikokuban'],
  'javalab': ['seiza-rika', 'digital-gene', 'camera1'],
  'seiza-rika': ['javalab', 'google-earth', 'denshikokuba-taiiku'],
  'denshikokuba-taiiku': ['seiza-rika', 'groupwork', 'doga'],
  'denshikokuban-gakushujuku': ['lease-guide', 'AI-education', 'Gemini'],
};

const DEFAULT_RELATED = ['spec', 'price', 'bansho'];

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[ch]));
}

function stripBrand(title = '') {
  return title.replace(/｜Kokuban BASE$/, '').trim();
}

function extractMeta(html, name) {
  const prop = new RegExp(`<meta property="${name}" content="([^"]*)"`, 'i').exec(html);
  if (prop) return prop[1];
  const tw = new RegExp(`<meta name="${name}" content="([^"]*)"`, 'i').exec(html);
  return tw ? tw[1] : '';
}

function getAllColumnMetadata() {
  const map = new Map();
  for (const entry of fs.readdirSync(COLUMNS_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const slug = entry.name;
    const file = path.join(COLUMNS_DIR, slug, 'index.html');
    if (!fs.existsSync(file)) continue;

    const html = fs.readFileSync(file, 'utf8');
    const title = extractMeta(html, 'og:title');
    const description = extractMeta(html, 'og:description');
    const image = extractMeta(html, 'og:image');
    const published = /<meta property="article:published_time" content="([^"]*)"/i.exec(html)?.[1] || '';
    map.set(slug, { slug, title: stripBrand(title), description, image, published });
  }
  return map;
}

function imageForCard(url = '') {
  if (!url) return 'https://placehold.jp/24/103f99/ffffff/600x338.png?text=Kokuban%20BASE';
  if (url.includes('images.microcms-assets.io')) {
    const cleanUrl = url.replace(/&amp;/g, '&').split('?')[0];
    return `${cleanUrl}?fit=crop&w=600&h=338&q=80`;
  }
  return url;
}

function formatDate(dateLike) {
  if (!dateLike) return '';
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date).replace(/\//g, '.');
}

function relatedCard(meta) {
  const title = escapeHtml(meta.title || '関連記事');
  const date = formatDate(meta.published);
  const image = escapeHtml(imageForCard(meta.image));
  const href = `/columns/${encodeURIComponent(meta.slug)}/`;

  return `
    <a href="${href}" class="related-card group flex flex-col h-full bg-white transition-all">
        <div class="relative aspect-video overflow-hidden rounded-xl bg-gray-100 mb-4">
            <img src="${image}" alt="${title}" class="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" loading="lazy">
        </div>
        <div class="flex flex-col flex-grow">
            <h4 class="text-lg font-bold text-gray-900 group-hover:text-customBlue transition-colors line-clamp-2 leading-snug mb-3">
                ${title}
            </h4>
            <div class="mt-auto flex items-center justify-between text-[11px] font-bold tracking-widest uppercase">
                <time class="text-gray-400">${date}</time>
                <span class="text-gray-500 flex items-center">
                    <i class="fas fa-user-edit mr-1 text-gray-300"></i>
                    Kokuban BASE編集部
                </span>
            </div>
        </div>
    </a>`;
}

function replaceRelatedSection(html, cardsHtml) {
  const marker = '<div id="related-posts-container"';
  const start = html.indexOf(marker);
  if (start === -1) return { html, changed: false };

  const openEnd = html.indexOf('>', start);
  const tagRegex = /<\/?div\b[^>]*>/gi;
  tagRegex.lastIndex = start;
  let depth = 0;
  let closeStart = -1;
  let match;
  while ((match = tagRegex.exec(html)) !== null) {
    if (match[0].startsWith('</')) {
      depth--;
      if (depth === 0) {
        closeStart = match.index;
        break;
      }
    } else {
      depth++;
    }
  }
  if (closeStart === -1) return { html, changed: false };

  const next = `${html.slice(0, openEnd + 1)}
${cardsHtml}
${html.slice(closeStart)}`;
  return { html: next, changed: true };
}

function main() {
  const metadata = getAllColumnMetadata();
  let updated = 0;
  let skipped = 0;

  for (const [slug] of metadata) {
    const file = path.join(COLUMNS_DIR, slug, 'index.html');
    let html = fs.readFileSync(file, 'utf8');
    const relatedSlugs = RELATED_BY_SLUG[slug] || DEFAULT_RELATED;
    const cards = relatedSlugs
      .filter((target) => target !== slug && metadata.has(target))
      .slice(0, 3)
      .map((target) => relatedCard(metadata.get(target)))
      .join('\n');

    if (!cards) {
      skipped++;
      continue;
    }

    let changed = false;
    const relatedResult = replaceRelatedSection(html, cards);
    html = relatedResult.html;
    changed = changed || relatedResult.changed;

    if (changed) {
      fs.writeFileSync(file, html, 'utf8');
      updated++;
    } else {
      skipped++;
    }
  }

  console.log(`Updated ${updated} column pages; skipped ${skipped}.`);
}

main();
