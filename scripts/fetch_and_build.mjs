import { createClient } from 'microcms-js-sdk';
import fs from 'fs';
import path from 'path';

// --- 設定値 ---
const BASE_URL = 'https://kokuban-base.com'; // サイトのドメイン (末尾スラッシュなし)
const COLUMNS_DIR = path.resolve(process.cwd(), 'columns');
const TEMPLATE_PATH = path.resolve(COLUMNS_DIR, 'template.html');
const JSON_OUTPUT_PATH = path.resolve(COLUMNS_DIR, 'index.json');
const SITEMAP_OUTPUT_PATH = path.resolve(process.cwd(), 'sitemap.xml');
const ARTICLE_HTML_PATH = path.resolve(process.cwd(), 'article.html');

// --- 環境変数からAPIキーを取得 ---
const { MICROCMS_SERVICE_DOMAIN, MICROCMS_API_KEY } = process.env;

if (!MICROCMS_SERVICE_DOMAIN || !MICROCMS_API_KEY) {
  console.error('エラー: 環境変数 MICROCMS_SERVICE_DOMAIN と MICROCMS_API_KEY が設定されていません。');
  process.exit(1);
}

// --- microCMS クライアント初期化 ---
const client = createClient({
  serviceDomain: MICROCMS_SERVICE_DOMAIN,
  apiKey: MICROCMS_API_KEY,
});

/**
 * HTML文字列からプレーンテキストを抽出し、指定文字数で丸める
 */
function extractDescription(html, maxLength = 120) {
  if (!html) return '';
  let text = html.replace(/<("[^"]*"|'[^']*'|[^'">])*>/g, '');
  text = text.replace(/(\r\n|\n|\r|\s\s+)/gm, ' ').trim();
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + '...';
  }
  return text;
}

/**
 * プレーンテキスト化（タグ除去＆エンティティ変換）
 */
function escapeHtmlSimple(str) {
  if (!str) return '';
  let text = str.replace(/<("[^"]*"|'[^']*'|[^'">])*>/g, '');
  return text.replace(/[&<>"']/g, function (match) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[match];
  });
}

/**
 * 特殊文字をHTMLエンティティに変換 (JSON-LDやmeta description用)
 */
function escapeHtml(str) {
  if (!str) return '';
  return escapeHtmlSimple(str);
}

/**
 * タイトル用のHTMLエスケープ。
 * <br>タグを見つけ、それ以降を <span class="subtitle"> で囲む
 */
function allowBrTags(str) {
  if (!str) return '';
  const parts = str.split(/<br\s*\/?>/gi);
  const mainTitle = escapeHtmlSimple(parts[0]);
  if (parts.length > 1) {
    const subtitle = parts.slice(1).map(s => escapeHtmlSimple(s)).join('<br>');
    return `${mainTitle}<br><span class="subtitle">${subtitle}</span>`;
  } else {
    return mainTitle;
  }
}

/**
 * アイキャッチ画像のHTMLを生成
 */
function createEyecatchHtml(eyecatch, alt) {
  if (!eyecatch || !eyecatch.url) return '';
  const width = eyecatch.width || 1200;
  const height = eyecatch.height || 675;
  const altText = escapeHtml(alt);
  const optimizedUrl = `${eyecatch.url}?fit=crop&w=1200&h=675&q=80`;
  return `<img src="${optimizedUrl}" alt="${altText}" width="${width}" height="${height}" class="w-full h-auto object-cover rounded-lg mb-8 shadow-md" loading="eager" fetchpriority="high">`;
}

/**
 * 全記事を取得 (ページング対応)
 */
async function fetchAllArticles() {
  console.log('microCMSから記事データを取得開始...');
  const allContents = [];
  let offset = 0;
  const limit = 50;
  const now = new Date().toISOString();

  try {
    while (true) {
      const response = await client.get({
        endpoint: 'news',
        queries: {
          fields: 'id,slug,title,body,eyecatch,publishedAt,updatedAt,description,category',
          limit: limit,
          offset: offset,
          orders: '-publishedAt',
          filters: `publishedAt[less_than]${now}`
        }
      });

      if (response.contents.length === 0) break;

      allContents.push(...response.contents);
      offset += response.contents.length;

      if (offset >= response.totalCount) break;
    }
    console.log(`合計 ${allContents.length} 件の記事データを取得しました。`);
    return allContents;
  } catch (err) {
    console.error('記事データの取得に失敗しました:', err);
    throw err;
  }
}

/**
 * サイトマップ (sitemap.xml) を生成
 */
function generateSitemap(articles) {
  console.log('sitemap.xml を生成中...');
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  xml += `  <url>\n    <loc>${BASE_URL}/</loc>\n    <priority>1.0</priority>\n    <changefreq>daily</changefreq>\n  </url>\n`;

  // 記事一覧ページもサイトマップに追加
  xml += `  <url>\n    <loc>${BASE_URL}/article</loc>\n    <priority>0.9</priority>\n    <changefreq>daily</changefreq>\n  </url>\n`;

  const staticPages = ['contact.html', 'reservation.html', 'privacy.html'];
  staticPages.forEach(page => {
    xml += `  <url>\n    <loc>${BASE_URL}/${page}</loc>\n    <priority>0.8</priority>\n    <changefreq>monthly</changefreq>\n  </url>\n`;
  });

  articles.forEach(article => {
    const url = `${BASE_URL}/columns/${article.slug}/`;
    const lastMod = new Date(article.updatedAt).toISOString().split('T')[0];
    xml += `  <url>\n    <loc>${url}</loc>\n    <lastmod>${lastMod}</lastmod>\n    <priority>0.6</priority>\n    <changefreq>weekly</changefreq>\n  </url>\n`;
  });

  xml += `</urlset>\n`;

  try {
    fs.writeFileSync(SITEMAP_OUTPUT_PATH, xml);
    console.log(`sitemap.xml を ${SITEMAP_OUTPUT_PATH} に保存しました。`);
  } catch (err) {
    console.error('sitemap.xml の保存に失敗しました:', err);
  }
}

/**
 * カテゴリが「対談記事」かどうかを判定
 */
function isInterview(article) {
  const rawCat = article.category;
  const cats = Array.isArray(rawCat) ? rawCat : [rawCat];
  return cats.some(c => {
    if (!c) return false;
    if (typeof c === 'string') return ['interview', 'taidan', '対談記事'].includes(c);
    if (typeof c === 'object' && c.id) return c.id === 'interview';
    return false;
  });
}

/**
 * 記事カードのHTMLを生成（article.html の静的生成用）
 */
function buildCardHtml(article, type = 'standard') {
  const date = new Date(article.publishedAt).toLocaleDateString('ja-JP').replace(/\//g, '.');
  const url = `/columns/${article.slug}/`;
  const img = article.eyecatchUrl
    ? `${article.eyecatchUrl}?fit=crop&w=600&h=338&q=80`
    : (article.eyecatch?.url
      ? `${article.eyecatch.url}?fit=crop&w=600&h=338&q=80`
      : 'https://placehold.co/600x338?text=No+Image');
  const title = escapeHtml(article.title);

  // カテゴリラベルの解決
  let categoryId = 'column';
  let categoryName = 'コラム';
  let rawCat = article.category;
  if (Array.isArray(rawCat) && rawCat.length > 0) rawCat = rawCat[0];
  if (rawCat) {
    if (typeof rawCat === 'string') {
      categoryId = rawCat;
      categoryName = rawCat;
    } else if (typeof rawCat === 'object' && rawCat.id) {
      categoryId = rawCat.id;
      categoryName = rawCat.name || categoryId;
    }
  }
  if (['interview', '対談記事', 'taidan'].includes(categoryId)) {
    categoryId = 'interview';
    categoryName = '対談記事';
  } else if (['column', 'コラム'].includes(categoryId)) {
    categoryId = 'column';
    categoryName = 'コラム';
  }

  const categoryClass = categoryId === 'interview' ? 'bg-pink-500' : 'bg-[#103f99]';

  if (type === 'interview') {
    return `
      <article class="article-card bg-white rounded-xl shadow-sm overflow-hidden flex flex-col h-full border border-gray-100 group">
        <a href="${url}" class="block img-container relative">
          <img src="${img}" alt="${title}" class="w-full h-full object-cover" loading="lazy">
          <span class="absolute top-3 left-3 ${categoryClass} text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">${categoryName}</span>
        </a>
        <div class="p-4 flex flex-col flex-grow">
          <div class="text-[10px] text-gray-400 mb-1 flex items-center gap-1 font-bold">
            <i class="far fa-calendar-alt"></i> ${date}
          </div>
          <h3 class="text-sm font-bold mb-2 text-gray-800 line-clamp-2 group-hover:text-[#103f99] transition-colors leading-snug">
            <a href="${url}">${title}</a>
          </h3>
        </div>
      </article>`;
  } else {
    return `
      <article class="article-card bg-white rounded-lg shadow-sm overflow-hidden flex flex-col h-full group">
        <a href="${url}" class="block img-container relative">
          <img src="${img}" alt="${title}" class="w-full h-full object-cover" loading="lazy">
          <span class="absolute top-2 left-2 ${categoryClass} text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">${categoryName}</span>
        </a>
        <div class="p-5 flex flex-col flex-grow">
          <div class="text-xs text-gray-400 mb-2 font-bold">${date}</div>
          <h3 class="font-bold text-gray-800 mb-2 line-clamp-2 text-sm md:text-base group-hover:text-[#103f99] transition-colors">
            <a href="${url}">${title}</a>
          </h3>
        </div>
      </article>`;
  }
}

/**
 * 記事一覧ページ (article.html) を静的生成する
 * SEO対策: 検索エンジンがクロールできるよう、初期HTMLに記事リンクを埋め込む
 * セキュリティ対策: APIキーを含むscriptブロックを除去する
 */
async function buildArticleListPage(articles) {
  console.log('article.html を静的生成中...');

  let html;
  try {
    html = fs.readFileSync(ARTICLE_HTML_PATH, 'utf-8');
  } catch (err) {
    console.error('article.html の読み込みに失敗しました:', err);
    return;
  }

  // カテゴリ分け
  const interviewArticles = articles.filter(a => isInterview(a));
  const columnArticles = articles.filter(a => !isInterview(a));

  // 新着3件（全カテゴリから）
  const newArrivalsHtml = articles.slice(0, 3).map(a => buildCardHtml(a, 'standard')).join('\n');

  // 対談記事（全件）
  const interviewHtml = interviewArticles.length > 0
    ? interviewArticles.map(a => buildCardHtml(a, 'interview')).join('\n')
    : '<div class="col-span-full text-center text-gray-500 py-8">対談記事は現在準備中です。</div>';

  // コラム（全件）
  const columnHtml = columnArticles.length > 0
    ? columnArticles.map(a => buildCardHtml(a, 'standard')).join('\n')
    : '<div class="col-span-full text-center text-gray-500 py-8">記事が見つかりませんでした。</div>';

  // ① 新着記事セクションを置換
  html = html.replace(
    /<div id="new-arrivals-list"[\s\S]*?<\/div>\s*(?=<\/section>|<div class="mt)/,
    `<div id="new-arrivals-list" class="grid grid-cols-1 md:grid-cols-3 gap-8">\n${newArrivalsHtml}\n</div>\n`
  );

  // ② 対談記事セクションを置換
  html = html.replace(
    /<div id="interview-list"[\s\S]*?<\/div>\s*(?=\n\s*<div class="mt)/,
    `<div id="interview-list" class="grid grid-cols-2 lg:grid-cols-4 gap-6">\n${interviewHtml}\n</div>\n`
  );

  // ③ コラムセクションを置換
  html = html.replace(
    /<div id="column-list"[\s\S]*?<\/div>\s*(?=\n\s*<div class="mt)/,
    `<div id="column-list" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">\n${columnHtml}\n</div>\n`
  );

  // ④ 「もっと読み込む」系のボタンは全件表示済みなので非表示に
  html = html.replace(
    /id="interview-more-container"/g,
    'id="interview-more-container" style="display:none"'
  );
  html = html.replace(
    /id="column-more-container"/g,
    'id="column-more-container" style="display:none"'
  );

  // ⑤ APIキーを含むscriptブロックを除去（静的生成済みのため不要、セキュリティ対策）
  html = html.replace(
    /<!--\s*JavaScript Logic\s*-->\s*<script>[\s\S]*?<\/script>/,
    '<!-- Scripts removed: statically generated -->'
  );

  try {
    fs.writeFileSync(ARTICLE_HTML_PATH, html);
    console.log(`article.html の静的生成が完了しました（新着:${articles.slice(0, 3).length}件 / 対談:${interviewArticles.length}件 / コラム:${columnArticles.length}件）。`);
  } catch (err) {
    console.error('article.html の書き込みに失敗しました:', err);
  }
}

// --- メインのビルド処理 ---
async function buildStaticPages() {
  console.log('静的ページ生成プロセスを開始します。');

  // 1. 雛形HTMLを読み込む
  let templateHtml;
  try {
    templateHtml = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
  } catch (err) {
    console.error(`エラー: 雛形ファイル ${TEMPLATE_PATH} が読み込めません。`);
    return;
  }

  // 2. 全記事データをmicroCMSから取得
  const allArticles = await fetchAllArticles();

  // 3. publishedAt が null でないことを確認
  const publishedArticles = allArticles.filter(article => article.publishedAt);

  if (publishedArticles.length === 0) {
    console.warn('警告: 公開中の記事が見つかりませんでした。');
    fs.writeFileSync(JSON_OUTPUT_PATH, '[]');
    generateSitemap([]);
    return;
  }

  // 4. 各記事の静的HTMLを生成
  console.log('各記事の静的HTMLを生成中...');
  const summaryList = [];

  for (const article of publishedArticles) {
    if (!article.slug) {
      console.warn(`警告: 記事ID ${article.id} にslugがありません。スキップします。`);
      continue;
    }

    const articleDir = path.resolve(COLUMNS_DIR, article.slug);
    const outputHtmlPath = path.resolve(articleDir, 'index.html');

    if (!fs.existsSync(articleDir)) {
      fs.mkdirSync(articleDir, { recursive: true });
    }

    const rawTitle = article.title;
    const title = `${rawTitle.replace(/<br\s*\/?>/gi, ' ')}｜Kokuban BASE`;
    const titlePlain = escapeHtml(rawTitle);
    const titleHtml = allowBrTags(rawTitle);

    const description = escapeHtml(
      article.description || extractDescription(article.body, 120)
    );

    const canonicalUrl = `${BASE_URL}/columns/${article.slug}/`;
    const ogImageUrl = article.eyecatch?.url
      ? `${article.eyecatch.url}?fit=crop&w=1200&h=630`
      : `${BASE_URL}/ogp.jpg`;

    const publishedAtISO = new Date(article.publishedAt).toISOString();
    const updatedAtISO = new Date(article.updatedAt).toISOString();
    const publishedAtFormatted = new Date(article.publishedAt).toLocaleDateString('ja-JP', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    const eyecatchHtml = createEyecatchHtml(article.eyecatch, titlePlain);

    const encodedUrl = encodeURIComponent(canonicalUrl);
    const encodedTitle = encodeURIComponent(title);
    const shareUrlTwitter = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
    const shareUrlFacebook = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    const shareUrlLine = `https://social-plugins.line.me/lineit/share?url=${encodedUrl}&text=${encodedTitle}`;

    let articleHtml = templateHtml
      .replace(/{{TITLE}}/g, title)
      .replace(/{{TITLE_PLAIN}}/g, titlePlain)
      .replace(/{{TITLE_HTML}}/g, titleHtml)
      .replace(/{{DESCRIPTION}}/g, description)
      .replace(/{{CANONICAL_URL}}/g, canonicalUrl)
      .replace(/{{OG_IMAGE_URL}}/g, ogImageUrl)
      .replace(/{{PUBLISHED_AT_ISO}}/g, publishedAtISO)
      .replace(/{{UPDATED_AT_ISO}}/g, updatedAtISO)
      .replace(/{{PUBLISHED_AT_FORMATTED}}/g, publishedAtFormatted)
      .replace(/{{EYECATCH_HTML}}/g, eyecatchHtml)
      .replace(/{{BODY_HTML}}/g, article.body)
      .replace(/{{SHARE_URL_TWITTER}}/g, shareUrlTwitter)
      .replace(/{{SHARE_URL_FACEBOOK}}/g, shareUrlFacebook)
      .replace(/{{SHARE_URL_LINE}}/g, shareUrlLine);

    try {
      fs.writeFileSync(outputHtmlPath, articleHtml);
    } catch (err) {
      console.error(`${outputHtmlPath} の保存に失敗しました:`, err);
    }

    summaryList.push({
      id: article.id,
      slug: article.slug,
      title: titlePlain,
      publishedAt: article.publishedAt,
      eyecatchUrl: article.eyecatch?.url || null,
      description: description,
      category: article.category || null,
    });
  }
  console.log(`合計 ${summaryList.length} 件の静的HTMLページを生成しました。`);

  // 5. 一覧用JSON (index.json) を保存
  try {
    fs.writeFileSync(JSON_OUTPUT_PATH, JSON.stringify(summaryList, null, 2));
    console.log(`columns/index.json を ${JSON_OUTPUT_PATH} に保存しました。`);
  } catch (err) {
    console.error('columns/index.json の保存に失敗しました:', err);
  }

  // 6. サイトマップ (sitemap.xml) を生成・保存
  generateSitemap(publishedArticles);

  // 7. 記事一覧ページ (article.html) を静的生成＆APIキー除去
  await buildArticleListPage(publishedArticles);

  console.log('静的ページ生成プロセスが完了しました。');
}

// --- スクリプト実行 ---
buildStaticPages().catch(err => {
  console.error('ビルドプロセス全体でエラーが発生しました:', err);
  process.exit(1);
});
