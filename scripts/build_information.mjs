import { createClient } from 'microcms-js-sdk';
import fs from 'fs';
import path from 'path';
import {
  buildInformationArtifacts,
  escapeHtml,
  formatDateDotJST,
  getCategoryName,
} from './information_lib.mjs';

const BASE_URL = 'https://kokuban-base.com';

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

function newsCategoryClass(category) {
  const name = String(category || '');
  if (name.includes('イベント')) return 'news-cat news-cat-event';
  if (name.includes('メディア') || name.includes('取材')) return 'news-cat news-cat-media';
  return 'news-cat';
}

function updateHomeLatestNews(items) {
  if (!fs.existsSync(HOME_PATH)) return;

  const html = fs.readFileSync(HOME_PATH, 'utf8');
  const rows = items
    .slice(0, 5)
    .map((item) => {
      const dateSource = item.publishedAt || item.date || '';
      const category = getCategoryName(item.category);
      const href = item.url || 'information/';
      // サイト内の記事ページは同一タブ、外部リンクのみ別タブで開く
      const isExternal = /^https?:\/\//i.test(href) && !href.startsWith(BASE_URL);
      const targetAttr = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
      return '<li class="news-item"><a href="' + escapeHtml(href) + '"' + targetAttr + '>' +
        '<time datetime="' + escapeHtml(dateSource) + '">' + escapeHtml(formatDateDotJST(dateSource)) + '</time>' +
        '<span class="' + newsCategoryClass(category) + '">' + escapeHtml(category) + '</span>' +
        '<span class="news-title">' + escapeHtml(item.title || '') + '</span>' +
        '</a></li>';
    })
    .join('\n        ');

  const newsInner = rows || '<li class="news-item"><a href="information/"><span class="news-title">最新NEWSを一覧で見る</span></a></li>';
  const nextList = '<ul id="latest-news-list" class="news-list"><!-- BUILD:TOP-NEWS -->\n        ' +
    newsInner +
    '\n      <!-- /BUILD:TOP-NEWS --></ul>';
  const nextHtml = html.replace(/<ul id="latest-news-list"[^>]*>[\s\S]*?<\/ul>/, nextList);

  if (nextHtml !== html) {
    fs.writeFileSync(HOME_PATH, nextHtml);
    console.log(`Updated ${HOME_PATH} latest news (${Math.min(items.length, 5)} items)`);
  }
}

async function main() {
  const items = await buildInformationArtifacts({
    client,
    endpoint: ENDPOINT,
    baseUrl: BASE_URL,
  });
  updateHomeLatestNews(items);
}

main().catch((error) => {
  console.error('Failed to build information content:', error);
  process.exit(1);
});
