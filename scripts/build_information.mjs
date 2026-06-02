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
  console.log(`Generated ${OUTPUT_PATH} (${normalized.length} items)`);
}

main().catch((error) => {
  console.error('Failed to build information JSON:', error);
  process.exit(1);
});
