import fs from 'fs';
import path from 'path';

// お知らせ(information)コンテンツの共通ビルドモジュール
//
// microCMS スキーマ:
//   title       … タイトル (テキスト)
//   publishedAt … 公開日 (日時)
//   category    … カテゴリ (コンテンツ参照。{ id, name } のオブジェクト)
//   url         … 外部リンクURL (テキスト。content が無い旧項目のリンク先)
//   photo       … 関連画像 (複数画像 = 配列)
//   content     … 本文 (リッチエディタ。あればサイト内記事ページを生成する)
//
// content があるお知らせは /information/{id}/ に静的な記事ページを生成し、
// index.json の url をサイト内URLに書き換える。content が無い項目は従来どおり
// url(外部リンク)をそのまま使う。

const INFORMATION_DIR = path.resolve(process.cwd(), 'information');
const TEMPLATE_PATH = path.resolve(INFORMATION_DIR, 'news-template.html');
const JSON_OUTPUT_PATH = path.resolve(INFORMATION_DIR, 'index.json');
// 生成ページの目印。この目印を持つディレクトリだけを掃除対象にする
const GENERATED_MARKER = '<!-- generated:news-article -->';

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const JST_DOT_FORMATTER = new Intl.DateTimeFormat('ja-JP', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function formatDateDotJST(dateLike) {
  if (!dateLike) return '';
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return '';
  return JST_DOT_FORMATTER.format(date).replace(/\//g, '.');
}

export function getCategoryName(category) {
  if (Array.isArray(category)) {
    const first = category.find(Boolean);
    if (!first) return 'お知らせ';
    return typeof first === 'object' ? (first.name || first.id || 'お知らせ') : first;
  }
  if (category && typeof category === 'object') return category.name || category.id || 'お知らせ';
  return category || 'お知らせ';
}

// information/index.html の categoryType() と同じ色分けルール
export function categoryType(name) {
  const value = String(name || '');
  if (value.includes('イベント')) return 'event';
  if (value.includes('メディア') || value.includes('取材')) return 'media';
  if (value.includes('対談')) return 'interview';
  if (value.includes('プレ')) return 'press';
  return 'default';
}

function extractDescription(html, maxLength = 120) {
  if (!html) return '';
  let text = String(html).replace(/<("[^"]*"|'[^']*'|[^'">])*>/g, '');
  text = text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length > maxLength) return `${text.substring(0, maxLength)}…`;
  return text;
}

function normalizeCategory(category) {
  if (!category) return null;
  if (Array.isArray(category)) {
    return category
      .map((item) => (item && typeof item === 'object' ? (item.name || item.id || '') : item))
      .filter(Boolean);
  }
  if (typeof category === 'object') return category.name || category.id || null;
  return category;
}

function normalizeImage(photo) {
  if (Array.isArray(photo)) {
    const found = photo.find((image) => image && image.url);
    return found ? { url: found.url, width: found.width, height: found.height } : null;
  }
  if (photo && typeof photo === 'object' && photo.url) {
    return { url: photo.url, width: photo.width, height: photo.height };
  }
  return null;
}

function normalizePhotos(photo) {
  if (Array.isArray(photo)) {
    return photo.filter((image) => image && image.url);
  }
  if (photo && typeof photo === 'object' && photo.url) return [photo];
  return [];
}

// 本文中の外部リンクに target="_blank" rel="noopener noreferrer" を付与する
function addExternalLinkAttrs(html, baseHost) {
  return String(html).replace(/<a\b[^>]*>/gi, (tag) => {
    const hrefMatch = tag.match(/\shref=(["'])(.*?)\1/i);
    if (!hrefMatch || !/^https?:\/\//i.test(hrefMatch[2])) return tag;
    try {
      const host = new URL(hrefMatch[2]).hostname.replace(/^www\./, '');
      if (host === baseHost) return tag;
    } catch {
      return tag;
    }
    let next = tag;
    if (!/\starget=/i.test(next)) next = next.replace(/>$/, ' target="_blank">');
    if (!/\srel=/i.test(next)) next = next.replace(/>$/, ' rel="noopener noreferrer">');
    return next;
  });
}

// 一覧ページ(information/index.html)のカードと同じ見た目のHTML
function buildNewsCardHtml(item) {
  const categoryName = getCategoryName(item.category);
  const date = formatDateDotJST(item.publishedAt || item.date);
  const isoDate = item.publishedAt || item.date || '';
  const external = /^https?:\/\//i.test(item.url || '');
  const href = item.url || '/information/';
  const targetAttr = external ? ' target="_blank" rel="noopener noreferrer"' : '';
  const thumb = item.image && item.image.url
    ? `<img src="${escapeHtml(item.image.url)}?fit=crop&w=480&h=270&q=80" alt="" loading="lazy" decoding="async">`
    : '<span>Kokuban BASE</span>';

  return `<article class="information-card">
          <a class="information-card-link" href="${escapeHtml(href)}"${targetAttr}>
            <figure class="information-thumb${item.image ? '' : ' information-thumb--empty'}">${thumb}</figure>
            <div class="information-card-body">
              <div class="information-meta">
                <time datetime="${escapeHtml(isoDate)}">${escapeHtml(date)}</time>
                <span class="information-tag information-tag--${categoryType(categoryName)}">${escapeHtml(categoryName)}</span>
              </div>
              <h2>${escapeHtml(item.title || 'お知らせ')}</h2>
              <span class="information-more">${external ? '外部サイトで見る' : '詳しく見る'}</span>
            </div>
          </a>
        </article>`;
}

function buildNewsArticlePage({ raw, item, allItems, templateHtml, baseUrl, log }) {
  const baseHost = new URL(baseUrl).hostname.replace(/^www\./, '');
  const canonicalUrl = `${baseUrl}/information/${item.id}/`;
  const categoryName = getCategoryName(item.category);
  const publishedAtISO = item.publishedAt ? new Date(item.publishedAt).toISOString() : '';
  const dateModifiedISO = raw.revisedAt ? new Date(raw.revisedAt).toISOString() : publishedAtISO;
  const description = item.description || `${item.title} - Kokuban BASEからのお知らせです。`;

  const photos = normalizePhotos(raw.photo);
  const heroPhoto = photos[0] || null;
  const ogImageUrl = heroPhoto
    ? `${heroPhoto.url}?fit=crop&w=1200&h=630&q=80`
    : `${baseUrl}/assets/ogp.png`;

  const heroImageHtml = heroPhoto
    ? `<figure class="news-detail-hero"><img src="${escapeHtml(heroPhoto.url)}?w=1200&q=80" alt="${escapeHtml(item.title)}" width="${heroPhoto.width || 1200}" height="${heroPhoto.height || 675}" loading="eager" fetchpriority="high" decoding="async"></figure>`
    : '';

  const galleryPhotos = photos.slice(1);
  const galleryHtml = galleryPhotos.length
    ? `<div class="news-detail-gallery" role="group" aria-label="関連画像">
        ${galleryPhotos.map((photo) => `<figure><img src="${escapeHtml(photo.url)}?w=800&q=80" alt="" loading="lazy" decoding="async"></figure>`).join('\n        ')}
      </div>`
    : '';

  const bodyHtml = addExternalLinkAttrs(raw.content || '', baseHost);

  const relatedHtml = allItems
    .filter((other) => other.id !== item.id)
    .slice(0, 3)
    .map(buildNewsCardHtml)
    .join('\n        ')
    || '<p class="information-state">最新情報は順次更新しています。</p>';

  const jsonLdSafe = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c');

  const newsJsonLd = jsonLdSafe({
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: item.title,
    description,
    image: [ogImageUrl],
    datePublished: publishedAtISO,
    dateModified: dateModifiedISO,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
    author: { '@type': 'Organization', name: 'Kokuban BASE', url: `${baseUrl}/` },
    publisher: {
      '@type': 'Organization',
      name: 'Kokuban BASE',
      url: `${baseUrl}/`,
    },
  });

  const breadcrumbJsonLd = jsonLdSafe({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Kokuban BASE', item: `${baseUrl}/` },
      { '@type': 'ListItem', position: 2, name: 'お知らせ・ニュース', item: `${baseUrl}/information/` },
      { '@type': 'ListItem', position: 3, name: item.title, item: canonicalUrl },
    ],
  });

  const html = templateHtml
    .replace(/\{\{TITLE\}\}/g, escapeHtml(`${item.title}｜お知らせ｜Kokuban BASE`))
    .replace(/\{\{TITLE_PLAIN\}\}/g, escapeHtml(item.title))
    .replace(/\{\{DESCRIPTION\}\}/g, escapeHtml(description))
    .replace(/\{\{CANONICAL_URL\}\}/g, canonicalUrl)
    .replace(/\{\{OG_IMAGE_URL\}\}/g, escapeHtml(ogImageUrl))
    .replace(/\{\{PUBLISHED_AT_ISO\}\}/g, publishedAtISO)
    .replace(/\{\{PUBLISHED_AT_FORMATTED\}\}/g, formatDateDotJST(item.publishedAt))
    .replace(/\{\{CATEGORY_NAME\}\}/g, escapeHtml(categoryName))
    .replace(/\{\{CATEGORY_CLASS\}\}/g, `information-tag--${categoryType(categoryName)}`)
    .replace(/\{\{HERO_IMAGE_HTML\}\}/g, heroImageHtml)
    .replace(/\{\{BODY_HTML\}\}/g, bodyHtml)
    .replace(/\{\{GALLERY_HTML\}\}/g, galleryHtml)
    .replace(/\{\{RELATED_NEWS_HTML\}\}/g, relatedHtml)
    .replace(/\{\{NEWS_JSONLD\}\}/g, newsJsonLd)
    .replace(/\{\{BREADCRUMB_JSONLD\}\}/g, breadcrumbJsonLd);

  const unreplaced = html.match(/\{\{[A-Z_]+\}\}/g);
  if (unreplaced && unreplaced.length > 0) {
    log.warn(`⚠️ 警告: information/${item.id} に未置換プレースホルダーが残存: ${[...new Set(unreplaced)].join(', ')}`);
  }

  const articleDir = path.resolve(INFORMATION_DIR, item.id);
  fs.mkdirSync(articleDir, { recursive: true });
  fs.writeFileSync(path.resolve(articleDir, 'index.html'), html);
}

// 公開停止・削除されたお知らせの生成済みディレクトリを削除する
// (GENERATED_MARKER を持つ生成ページだけを対象にし、手作業のページは触らない)
function cleanupStaleArticleDirs(activeIds, log) {
  let entries;
  try {
    entries = fs.readdirSync(INFORMATION_DIR, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (!entry.isDirectory() || activeIds.has(entry.name)) continue;
    const htmlPath = path.resolve(INFORMATION_DIR, entry.name, 'index.html');
    try {
      if (!fs.existsSync(htmlPath)) continue;
      const html = fs.readFileSync(htmlPath, 'utf8');
      if (!html.includes(GENERATED_MARKER)) continue;
      fs.rmSync(path.resolve(INFORMATION_DIR, entry.name), { recursive: true, force: true });
      log.log(`公開対象外になったお知らせページを削除しました: information/${entry.name}/`);
    } catch (err) {
      log.warn(`information/${entry.name}/ の掃除に失敗しました: ${err.message}`);
    }
  }
}

/**
 * お知らせを取得して index.json と記事詳細ページ(/information/{id}/)を生成する
 * @returns 正規化済みお知らせ一覧 (新しい順)
 */
export async function buildInformationArtifacts({ client, endpoint = 'information', baseUrl, log = console }) {
  log.log('お知らせ(information)データを取得開始...');

  const allContents = [];
  const limit = 50;
  let offset = 0;
  const now = new Date().toISOString();

  while (true) {
    const response = await client.get({
      endpoint,
      queries: {
        fields: 'id,title,publishedAt,revisedAt,category,url,photo,content',
        limit,
        offset,
        orders: '-publishedAt',
        filters: `publishedAt[less_than]${now}`,
      },
    });

    if (!response.contents || response.contents.length === 0) break;
    allContents.push(...response.contents);
    offset += response.contents.length;
    if (offset >= response.totalCount) break;
  }

  log.log(`合計 ${allContents.length} 件のお知らせを取得しました。`);

  // コラム記事由来の項目(旧運用)は NEWS 扱いにしない
  const newsContents = allContents.filter(
    (item) => String(item.url || '').indexOf('/columns/') === -1 && !item.slug
  );

  const normalized = newsContents
    .map((item) => {
      const hasContent = Boolean(item.content && String(item.content).trim());
      return {
        id: item.id,
        title: item.title || '',
        publishedAt: item.publishedAt || null,
        date: item.publishedAt || null,
        category: normalizeCategory(item.category),
        // 本文がある項目はサイト内の記事ページへ。無ければ従来の外部リンク
        url: hasContent ? `/information/${item.id}/` : (item.url || ''),
        image: normalizeImage(item.photo),
        hasContent,
        description: hasContent ? extractDescription(item.content, 120) : '',
      };
    })
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  // 記事詳細ページを生成
  const withContent = newsContents.filter((item) => item.content && String(item.content).trim());
  let templateHtml = null;
  if (withContent.length > 0) {
    try {
      templateHtml = fs.readFileSync(TEMPLATE_PATH, 'utf8');
    } catch (err) {
      log.error(`お知らせ記事テンプレート ${TEMPLATE_PATH} が読み込めないため、記事ページ生成をスキップします:`, err.message);
    }
  }

  if (templateHtml) {
    let generatedCount = 0;
    for (const raw of withContent) {
      const item = normalized.find((entry) => entry.id === raw.id);
      if (!item) continue;
      try {
        buildNewsArticlePage({ raw, item, allItems: normalized, templateHtml, baseUrl, log });
        generatedCount += 1;
      } catch (err) {
        log.error(`information/${raw.id}/ の生成に失敗しました:`, err);
      }
    }
    log.log(`お知らせ記事ページを ${generatedCount} 件生成しました。`);
  }

  // 掃除の基準は「本文を持つ公開中のお知らせID」。生成に失敗しただけのページを消さない
  cleanupStaleArticleDirs(new Set(withContent.map((item) => item.id)), log);

  fs.mkdirSync(INFORMATION_DIR, { recursive: true });
  fs.writeFileSync(JSON_OUTPUT_PATH, JSON.stringify(normalized, null, 2));
  log.log(`information/index.json を保存しました(${normalized.length}件)。`);

  return normalized;
}
