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
    const url = escapeHtml(item.url || 'information/');
    let categoryClass = 'news-cat';
    if (category.includes('イベント')) categoryClass += ' news-cat-event';
    else if (category.includes('メディア') || category.includes('取材')) categoryClass += ' news-cat-media';

    return `        <li class="news-item">
          <a href="${url}">
            <time datetime="${escapeHtml(dateSource || '')}">${escapeHtml(date)}</time>
            <span class="${categoryClass}">${escapeHtml(category)}</span>
            <span class="news-title">${title}</span>
          </a>
        </li>`;
  }).join('\n');
}

function updateHomeLatestNews(items) {
  if (!fs.existsSync(HOME_PATH)) return;

  const html = fs.readFileSync(HOME_PATH, 'utf8');
  const latestHtml = buildLatestNewsHtml(items);
  const nextHtml = html.replace(
    /<ul id="latest-news-list"[^>]*>[\s\S]*?<\/ul>/,
    `<ul id="latest-news-list" class="news-list">\n${latestHtml}\n      </ul>`
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
