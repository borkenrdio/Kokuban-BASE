import { createClient } from 'microcms-js-sdk';
import fs from 'fs';
import path from 'path';

const SERVICE_DOMAIN = (
  process.env.INFORMATION_SERVICE_DOMAIN ||
  process.env.MICROCMS_INFORMATION_DOMAIN ||
  process.env.MICROCMS_INFO_DOMAIN ||
  ''
).trim();

const API_KEY = (
  process.env.MICROCMS_INFORMATION_KEY ||
  process.env.INFORMATION_API_KEY ||
  process.env.MICROCMS_INFO_KEY ||
  ''
).trim();

const ENDPOINT = process.env.INFORMATION_ENDPOINT || 'information';
const OUTPUT_PATH = path.resolve(process.cwd(), 'information', 'index.json');
const HOME_PATH = path.resolve(process.cwd(), 'index.html');

if (!SERVICE_DOMAIN || !API_KEY) {
  console.error('Missing information microCMS environment variables.');
  console.error('Required: INFORMATION_SERVICE_DOMAIN and MICROCMS_INFORMATION_KEY');
  process.exit(1);
}

const client = createClient({
  serviceDomain: SERVICE_DOMAIN,
  apiKey: API_KEY,
});

function normalizeCategory(category) {
  if (!category) return null;
  if (Array.isArray(category)) {
    return category
      .map((item) => {
        if (item && typeof item === 'object') return item.name || item.id || '';
        return item;
      })
      .filter(Boolean);
  }
  if (typeof category === 'object') return category.name || category.id || null;
  return category;
}

function normalizeImage(item) {
  const fields = [item.image, item.thumbnail, item.photo, item.eyecatch];

  for (const field of fields) {
    if (!field) continue;
    if (typeof field === 'string') return field;
    if (Array.isArray(field)) {
      const found = field.find((image) => image && image.url);
      if (found) return { url: found.url, width: found.width, height: found.height };
    }
    if (typeof field === 'object' && field.url) {
      return { url: field.url, width: field.width, height: field.height };
    }
  }

  return null;
}

function normalizeItem(item) {
  const image = normalizeImage(item);
  const date = item.publishedAt || item.date || item.createdAt || null;

  return {
    ...item,
    id: item.id,
    title: item.title || '',
    publishedAt: item.publishedAt || null,
    date,
    category: normalizeCategory(item.category),
    url: item.url || '',
    image,
  };
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getCategoryName(category) {
  if (Array.isArray(category)) {
    const first = category.find(Boolean);
    if (!first) return 'その他';
    return typeof first === 'object' ? (first.name || first.id || 'その他') : first;
  }
  if (category && typeof category === 'object') return category.name || category.id || 'その他';
  return category || 'その他';
}

function formatDate(dateSource) {
  const date = new Date(dateSource || 0);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Tokyo',
  });
}

function buildLatestNewsHtml(items) {
  return items.slice(0, 5).map((item) => {
    const dateSource = item.publishedAt || item.createdAt || item.date;
    const date = formatDate(dateSource);
    const category = getCategoryName(item.category);
    const title = escapeHtml(item.title || '');
    const url = escapeHtml(item.url || `/information/${item.id}`);
    const isNew = dateSource && (Date.now() - new Date(dateSource).getTime()) / 86400000 < 14;
    const newBadge = isNew
      ? '<span class="inline-block bg-yellow-400 text-white text-[10px] font-bold px-2 py-0.5 rounded mb-1">NEW</span>'
      : '';

    let tagClass = 'bg-gray-500 text-white';
    if (category.includes('プレスリリース')) tagClass = 'bg-[#6366f1] text-white';
    else if (category.includes('イベント')) tagClass = 'bg-[#22c55e] text-white';
    else if (category.includes('対談') || category.includes('インタビュー')) tagClass = 'bg-[#ec4899] text-white';
    else if (category.includes('お知らせ')) tagClass = 'bg-[#1e40af] text-white';

    return `                                    <li class="group">
                                        <a href="${url}" class="block bg-white rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 p-5 sm:p-6 border border-gray-100">
                                            <div class="flex flex-col sm:flex-row sm:items-center gap-4">
                                                <div class="flex flex-row sm:flex-col items-center sm:items-start justify-between sm:justify-center min-w-[120px] flex-shrink-0 gap-3 sm:gap-1">
                                                    <div class="flex flex-col items-start">${newBadge}<span class="${tagClass} text-xs font-bold px-3 py-1 rounded-md shadow-sm min-w-[80px] text-center">${escapeHtml(category)}</span></div>
                                                    <time class="text-sm font-medium text-gray-500 tracking-wider font-sans">${escapeHtml(date)}</time>
                                                </div>
                                                <div class="flex-grow border-l-0 sm:border-l-2 border-gray-100 sm:pl-6 py-1">
                                                    <h3 class="text-base sm:text-lg font-bold text-gray-800 group-hover:text-[#103f99] transition-colors leading-relaxed">${title}</h3>
                                                </div>
                                                <div class="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-gray-50 text-gray-400 group-hover:bg-[#103f99] group-hover:text-white transition-all flex-shrink-0">
                                                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
                                                </div>
                                            </div>
                                        </a>
                                    </li>`;
  }).join('\n');
}

function updateHomeLatestNews(items) {
  if (!fs.existsSync(HOME_PATH)) return;

  const html = fs.readFileSync(HOME_PATH, 'utf8');
  const latestHtml = buildLatestNewsHtml(items);
  const nextHtml = html.replace(
    /<ul id="latest-news-list" class="space-y-4">[\s\S]*?<\/ul>/,
    `<ul id="latest-news-list" class="space-y-4">\n${latestHtml}\n                                </ul>`
  );

  if (nextHtml !== html) {
    fs.writeFileSync(HOME_PATH, nextHtml);
    console.log(`Updated ${HOME_PATH} latest news (${Math.min(items.length, 5)} items)`);
  }
}

async function main() {
  const allContents = [];
  const limit = 100;
  let offset = 0;

  while (true) {
    const data = await client.getList({
      endpoint: ENDPOINT,
      queries: {
        limit,
        offset,
        orders: '-publishedAt',
      },
    });

    allContents.push(...data.contents);
    offset += data.contents.length;

    if (offset >= data.totalCount || data.contents.length === 0) break;
  }

  const normalized = allContents
    .map(normalizeItem)
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(normalized, null, 2));
  updateHomeLatestNews(normalized);
  console.log(`Generated ${OUTPUT_PATH} (${normalized.length} items)`);
}

main().catch((error) => {
  console.error('Failed to build information JSON:', error);
  process.exit(1);
});
