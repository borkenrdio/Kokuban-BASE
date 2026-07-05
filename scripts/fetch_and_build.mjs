import { createClient } from 'microcms-js-sdk';
import fs from 'fs';
import path from 'path';

// --- 設定値 ---
const BASE_URL = 'https://kokuban-base.com'; // サイトのドメイン (末尾スラッシュなし)
const COLUMNS_DIR = path.resolve(process.cwd(), 'columns');
const TEMPLATE_PATH = path.resolve(COLUMNS_DIR, 'template.html');
const JSON_OUTPUT_PATH = path.resolve(COLUMNS_DIR, 'index.json');
const SITEMAP_OUTPUT_PATH = path.resolve(process.cwd(), 'sitemap.xml');
const HOME_HTML_PATH = path.resolve(process.cwd(), 'index.html');
const ARTICLE_HTML_PATH = path.resolve(process.cwd(), 'article', 'index.html');
// 破損しない固定テンプレート（Bot は書き換えない）。これを入力に使い article/index.html を毎回生成する。
const ARTICLE_TEMPLATE_PATH = path.resolve(process.cwd(), 'article', 'index.template.html');
const WHATIS_HTML_PATH = path.resolve(process.cwd(), 'whatissmrtboard', 'index.html');
const TEAM_DIR = path.resolve(process.cwd(), 'team');
// お知らせ(information エンドポイント)の出力先
const INFORMATION_JSON_PATH = path.resolve(process.cwd(), 'information', 'index.json');

// 関連記事の表示件数
const RELATED_POSTS_COUNT = 3;
const ENABLE_AUTO_INTERNAL_LINKS = false;

// 執筆者プロフィール情報(E-E-A-T強化用)
// microCMS の article.author フィールドの値と matchKey を一致させると、
// その執筆者の記事を「執筆者ページ」で一覧化できる
const AUTHORS = [
  {
    slug: 'takeyama-junya',
    matchKeys: ['竹山 隼矢', '竹山隼矢', 'Takeyama Junya'],
    name: '竹山 隼矢',
    nameRomaji: 'Takeyama Junya',
    nameKana: 'たけやま じゅんや',
    role: '株式会社idea spot 代表取締役',
    photoUrl: '/img/staff-a.jpg',
    specialties: ['中学受験算数', '電子黒板を活用したICT授業', '教育事業マネジメント'],
    bio: '中学受験専門の現役トップ算数講師として、毎年多数の難関中学合格者を輩出。電子黒板の早期導入を決断し、ICT教材を駆使した算数授業は、生徒・保護者から高く評価されている。英俊社の塾・教育機関向けお役立ちコラムを執筆。',
    achievements: [
      '中学受験算数の現役トップ講師として10年以上の指導実績',
      '灘・東大寺・洛星・同志社女子など難関校への合格者を多数輩出',
      '英俊社の塾・教育機関向けコラムを継続執筆',
      'Kokuban BASE プロジェクト立ち上げ・全体統括',
    ],
    socialUrls: [],
  },
  {
    slug: 'endo-koji',
    matchKeys: ['遠藤 幸治', '遠藤幸治', 'Endo Koji'],
    name: '遠藤 幸治',
    nameRomaji: 'Endo Koji',
    nameKana: 'えんどう こうじ',
    role: 'Kokuban BASE 運営責任者',
    photoUrl: '/img/staff-b.jpg',
    specialties: ['電子黒板とICT教材の連携', '公教育・私教育双方への導入支援', '中学受験・中高生指導'],
    bio: '首都圏の大手学習塾で活躍し、様々なICT教材を授業に導入。電子黒板とICT教材の連携に関する知識は業界トップクラスで、公教育への導入提案にも定評あり。現在も教壇に立ち、中学受験から中高生の定期考査対策まで幅広く指導。',
    achievements: [
      '首都圏の大手学習塾でICT教材導入の最前線で活躍',
      '電子黒板×ICT教材の連携知識は業界トップクラス',
      '公教育機関への電子黒板導入提案の実績多数',
      '中学受験から中高生まで幅広い学齢の指導経験',
    ],
    socialUrls: [],
  },
  {
    slug: 'yamada-masaki',
    matchKeys: ['山田 将生', '山田将生', 'Yamada Masaki'],
    name: '山田 将生',
    nameRomaji: 'Yamada Masaki',
    nameKana: 'やまだ まさき',
    role: 'Kokuban BASE 運営担当',
    photoUrl: '/img/staff-c.jpg',
    specialties: ['中学受験社会科', '情報システム・Webサイト構築', 'ICTの教育現場導入'],
    bio: '現役で社会科のトップ講師として活躍する一方、情報システムの専門家でもある。社内の管理システムや本LPサイトの作成も一気通貫で完結させる、教育業界トップレベルのICT知識を有する。電子黒板導入にあたる、新システムの導入支援・サービス開発も相談可能。',
    achievements: [
      '現役で社会科のトップ講師として活躍',
      '情報システムの専門家として教育業界トップレベルのICT知識',
      '社内管理システム・Webサイトの構築実績',
      '新システム導入支援・サービス開発の相談対応',
    ],
    socialUrls: [],
  },
];

// 旧slug → 新slug のリダイレクトマップ
// 過去のSearch Consoleで404になっていた旧slugから、現在の新slugへのリダイレクトを定義
// 対応する記事が見つかった時点でここに追加していく
// 例: 'old-random-slug': 'new-meaningful-slug'
const SLUG_REDIRECTS = {
  // '9lqjr-y2mk': '新しいslug',
  // '8xod8yob-y': '新しいslug',
  // 'j7o2-bk2wtbw': '新しいslug',
};

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
 * 本文HTMLから読了時間(分)を計算
 * 日本語の平均読了速度を 450 字/分として算出
 * 最低 1 分を返す
 */
function calculateReadingTime(html) {
  if (!html) return 1;
  // タグ除去、空白整理
  let text = html.replace(/<("[^"]*"|'[^']*'|[^'">])*>/g, '');
  text = text.replace(/\s+/g, '');
  const charCount = text.length;
  const minutes = Math.max(1, Math.ceil(charCount / 450));
  return minutes;
}

const JST_DATE_FORMATTER_LONG = new Intl.DateTimeFormat('ja-JP', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const JST_DATE_FORMATTER_DOT = new Intl.DateTimeFormat('ja-JP', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function formatDateJST(dateLike, style = 'dot') {
  if (!dateLike) return '';
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return '';
  const formatter = style === 'long' ? JST_DATE_FORMATTER_LONG : JST_DATE_FORMATTER_DOT;
  return formatter.format(date).replace(/\//g, '.');
}

function getJSTDateKey(dateLike) {
  const formatted = formatDateJST(dateLike, 'dot');
  return formatted ? formatted.replace(/\./g, '-') : '';
}

/**
 * 目次生成のためのID用文字列を生成
 * 日本語含む見出しテキストから、URLに使える slug を作る
 */
function makeHeadingId(text, index) {
  // タグ除去
  let plain = text.replace(/<[^>]+>/g, '').trim();
  // 英数とハイフン以外をハイフンに置換
  let slug = plain
    .replace(/[\s　]+/g, '-')
    .replace(/[^\w\-\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]+/g, '')
    .substring(0, 40);
  // 空ならインデックスベースのフォールバック
  if (!slug) slug = `heading-${index}`;
  return `toc-${index}-${slug}`;
}

/**
 * 本文HTMLから目次(Table of Contents)を生成し、本文側にもID属性を追加する
 * 返り値: { tocHtml, bodyWithIds, headingCount }
 *
 * - h2/h3 を対象(h1は記事タイトル用なので除外)
 * - 見出し数が2個未満なら目次は空文字を返す(短すぎる記事には不要)
 */
function buildTocAndAnnotate(bodyHtml) {
  if (!bodyHtml) return { tocHtml: '', bodyWithIds: bodyHtml || '', headingCount: 0 };

  const headings = []; // { level, text, id }
  let headingIndex = 0;

  // h2/h3 を抽出しつつ、既存属性を保持してID属性を追加
  const bodyWithIds = bodyHtml.replace(
    /<(h[23])([^>]*)>([\s\S]*?)<\/\1>/gi,
    (match, tag, attrs, inner) => {
      const level = parseInt(tag.charAt(1));
      // 既にidが付いていればそれを使う
      const existingIdMatch = attrs.match(/\sid="([^"]+)"/i);
      let id;
      if (existingIdMatch) {
        id = existingIdMatch[1];
      } else {
        id = makeHeadingId(inner, headingIndex);
        attrs = ` id="${id}"${attrs}`;
      }
      const plainText = inner.replace(/<[^>]+>/g, '').trim();
      if (plainText) {
        headings.push({ level, text: plainText, id });
        headingIndex++;
      }
      return `<${tag}${attrs}>${inner}</${tag}>`;
    }
  );

  // 見出しが2個未満なら目次を出さない
  if (headings.length < 2) {
    return { tocHtml: '', bodyWithIds, headingCount: headings.length };
  }

  // 目次HTMLを構築
  let tocItems = '';
  headings.forEach(h => {
    const indentClass = h.level === 3 ? 'ml-5' : '';
    tocItems += `
        <li class="${indentClass}">
            <a href="#${h.id}" class="toc-link block py-1.5 text-gray-700 hover:text-customBlue transition-colors leading-snug">
                <span class="toc-bullet">${h.level === 3 ? '— ' : ''}</span>${escapeHtmlSimple(h.text)}
            </a>
        </li>`;
  });

  const tocHtml = `
<aside class="toc-container my-10 p-6 bg-gray-50 border-l-4 border-customBlue rounded-r-xl shadow-sm">
    <h2 class="toc-title text-base font-bold text-customBlue mb-3 flex items-center">
        <i class="fas fa-list-ul mr-2 text-sm" aria-hidden="true"></i>目次
    </h2>
    <nav aria-label="目次">
        <ol class="toc-list text-sm space-y-0">${tocItems}
        </ol>
    </nav>
</aside>
`;

  return { tocHtml, bodyWithIds, headingCount: headings.length };
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
  const width = 1200;
  const height = 675;
  const altText = escapeHtml(alt);
  const optimizedUrl = `${eyecatch.url}?fit=crop&w=1200&h=675&q=80`;
  return `<img src="${optimizedUrl}" alt="${altText}" width="${width}" height="${height}" class="w-full h-auto rounded-lg mb-6 shadow-md" loading="eager" fetchpriority="high">`;
}

/**
 * 関連記事のHTMLを生成（静的）
 * slugが必ず存在する記事のみを対象とし、undefined問題を根絶
 */
function buildRelatedPostsHtml(currentArticle, allArticles) {
  // slug があり、自分自身ではない記事のみを抽出
  const candidates = allArticles.filter(a => 
    a && a.slug && a.id !== currentArticle.id
  );

  // 公開日が新しい順で最大件数まで取得
  const related = candidates.slice(0, RELATED_POSTS_COUNT);

  if (related.length === 0) {
    return '<p class="text-gray-400 col-span-full text-center py-10">関連記事が見つかりませんでした。</p>';
  }

  return related.map(article => {
    const title = escapeHtml(article.title || '無題のコラム');
    const date = article.publishedAt 
      ? formatDateJST(article.publishedAt)
      : '';
    const imageUrl = article.eyecatch?.url 
      ? `${article.eyecatch.url}?fit=crop&w=600&h=338&q=80`
      : 'https://placehold.jp/24/cccccc/ffffff/800x450.png?text=No+Image';
    const linkUrl = `/columns/${article.slug}/`;
    const author = escapeHtml(article.author || 'Kokuban BASE 編集部');

    return `
    <a href="${linkUrl}" class="related-card group flex flex-col h-full bg-white transition-all">
        <div class="relative aspect-video overflow-hidden rounded-xl bg-gray-100 mb-4">
            <img src="${imageUrl}" alt="${title}" class="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" loading="lazy">
        </div>
        <div class="flex flex-col flex-grow">
            <h4 class="text-lg font-bold text-gray-900 group-hover:text-customBlue transition-colors line-clamp-2 leading-snug mb-3">
                ${title}
            </h4>
            <div class="mt-auto flex items-center justify-between text-[11px] font-bold tracking-widest uppercase">
                <time class="text-gray-400">${date}</time>
                <span class="text-gray-500 flex items-center">
                    <i class="fas fa-user-edit mr-1 text-gray-300"></i>
                    ${author}
                </span>
            </div>
        </div>
    </a>`;
  }).join('\n');
}

function getArticleSlugFromUrl(rawUrl) {
  if (!rawUrl) return '';

  let url;
  try {
    url = new URL(rawUrl, BASE_URL);
  } catch {
    return '';
  }

  const allowedHosts = new Set([
    'kokuban-base.com',
    'www.kokuban-base.com',
    new URL(BASE_URL).host,
  ]);
  if (url.host && !allowedHosts.has(url.host)) return '';

  const match = url.pathname.match(/^\/columns\/([^/?#]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : '';
}

function buildInternalLinkCardHtml(article) {
  const title = escapeHtml(article.title || '関連記事');
  const description = escapeHtml(article.description || extractDescription(article.body, 110) || '');
  const imageUrl = article.eyecatch?.url
    ? `${article.eyecatch.url}?fit=crop&w=320&h=180&q=80`
    : 'https://placehold.jp/24/103f99/ffffff/320x180.png?text=Kokuban%20BASE';
  const linkUrl = `/columns/${article.slug}/`;

  return `<a href="${linkUrl}" class="internal-link-card" aria-label="${title}">
    <span class="internal-link-card__image"><img src="${imageUrl}" alt="${title}" loading="lazy" decoding="async"></span>
    <span class="internal-link-card__body">
      <span class="internal-link-card__title">${title}</span>
      <span class="internal-link-card__description">${description}</span>
    </span>
  </a>`;
}

const externalLinkMetadataCache = new Map();
const BARE_URL_REGEX = /https?:\/\/[^\s<"'）)、。,.]+/gi;
const STATIC_EXTERNAL_LINK_METADATA = {
  'https://earth.google.com/web/': {
    title: 'Google Earth',
    description: 'ブラウザで地球上の場所を探索できる Google Earth の公式Web版です。',
    image: 'https://www.gstatic.com/earth/social/00_generic_facebook-001.jpg',
  },
  'https://kawasemi.eisyun.jp/kawasemi-lite/': {
    title: 'プリント教材作成システム「KAWASEMI Lite」のご案内',
    description: '赤本のデータベースを使って、オリジナルのプリント教材を作成できる英俊社の教材作成システムです。全国の公立高校入試を網羅し、難易度選択や小問単位での利用にも対応しています。',
    image: 'https://kawasemi.eisyun.jp/wp/wp-content/uploads/common/logo-eisyunsya.svg',
  },
};

function decodeHtmlEntities(text) {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num) => String.fromCodePoint(parseInt(num, 10)));
}

function getMetaContent(html, names) {
  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patterns = [
      new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`, 'i'),
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) return decodeHtmlEntities(match[1].trim());
    }
  }
  return '';
}

function getTitleFromHtml(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeHtmlEntities(match[1].replace(/\s+/g, ' ').trim()) : '';
}

function getRepresentativeImageFromHtml(html, pageUrl) {
  const images = [...html.matchAll(/<img\b[^>]*>/gi)]
    .map(match => match[0])
    .map((tag) => {
      const src = tag.match(/\s(?:src|data-src)=["']([^"']+)["']/i)?.[1] || '';
      const alt = tag.match(/\salt=["']([^"']*)["']/i)?.[1] || '';
      if (!src) return null;
      try {
        return {
          src: new URL(src, pageUrl).href,
          alt: decodeHtmlEntities(alt),
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  const preferred = images.find(({ src }) => {
    const lower = src.toLowerCase();
    return !lower.includes('/common/')
      && !lower.includes('logo')
      && !lower.includes('facebook')
      && !lower.includes('twitter')
      && !lower.includes('instagram')
      && !lower.endsWith('.svg');
  });

  return preferred?.src || images.find(({ src }) => !src.toLowerCase().includes('facebook'))?.src || '';
}

function isInternalColumnUrl(rawUrl) {
  return Boolean(getArticleSlugFromUrl(rawUrl));
}

async function fetchExternalLinkMetadata(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  if (!/^https?:$/.test(url.protocol) || isInternalColumnUrl(url.href)) return null;

  const normalizedUrl = url.href;
  if (externalLinkMetadataCache.has(normalizedUrl)) {
    return externalLinkMetadataCache.get(normalizedUrl);
  }

  const metadataKey = normalizedUrl.endsWith('/') ? normalizedUrl : `${normalizedUrl}/`;
  const staticMetadata = STATIC_EXTERNAL_LINK_METADATA[metadataKey] || STATIC_EXTERNAL_LINK_METADATA[normalizedUrl];
  const metadata = {
    url: normalizedUrl,
    host: url.hostname.replace(/^www\./, ''),
    title: staticMetadata?.title || url.hostname.replace(/^www\./, ''),
    description: staticMetadata?.description || normalizedUrl,
    image: staticMetadata?.image || '',
  };

  if (staticMetadata) {
    externalLinkMetadataCache.set(normalizedUrl, metadata);
    return metadata;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(normalizedUrl, {
        signal: controller.signal,
        headers: {
          'user-agent': 'Mozilla/5.0 (compatible; KokubanBASEBot/1.0; +https://kokuban-base.com/)',
          accept: 'text/html,application/xhtml+xml',
        },
      });

      const contentType = response.headers.get('content-type') || '';
      if (response.ok && contentType.includes('text/html')) {
        const html = await response.text();
        const title = getMetaContent(html, ['og:title', 'twitter:title']) || getTitleFromHtml(html);
        const description = getMetaContent(html, ['og:description', 'description', 'twitter:description']);
        const image = getMetaContent(html, ['og:image', 'twitter:image']);

        if (title) metadata.title = title;
        if (description) metadata.description = description;
        if (image) {
          try {
            metadata.image = new URL(image, normalizedUrl).href;
          } catch {
            metadata.image = image;
          }
        } else {
          metadata.image = getRepresentativeImageFromHtml(html, normalizedUrl);
        }
      }
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    console.warn(`Could not fetch external link metadata for ${normalizedUrl}: ${error.message}`);
  }

  externalLinkMetadataCache.set(normalizedUrl, metadata);
  return metadata;
}

function buildExternalLinkCardHtml(metadata) {
  const title = escapeHtml(metadata.title || metadata.host || metadata.url);
  const description = escapeHtml(metadata.description || metadata.url);
  const host = escapeHtml(metadata.host || '');
  const imageHtml = metadata.image
    ? `<img src="${escapeHtml(metadata.image)}" alt="${title}" loading="lazy" decoding="async">`
    : `<span class="flex h-full w-full items-center justify-center bg-[#e0f2fe] px-3 text-center text-xs font-black text-[#103f99]">${host || 'LINK'}</span>`;

  return `<a href="${escapeHtml(metadata.url)}" class="internal-link-card" target="_blank" rel="noopener noreferrer" aria-label="${title}">
    <span class="internal-link-card__image internal-link-card__image--external">${imageHtml}</span>
    <span class="internal-link-card__body">
      <span class="internal-link-card__title">${title}</span>
      <span class="internal-link-card__description">${description}</span>
      <span class="internal-link-card__site">${host}</span>
    </span>
  </a>`;
}

async function replaceAsync(text, regex, replacer) {
  const parts = [];
  let lastIndex = 0;
  for (const match of text.matchAll(regex)) {
    parts.push(text.slice(lastIndex, match.index));
    parts.push(await replacer(...match));
    lastIndex = match.index + match[0].length;
  }
  parts.push(text.slice(lastIndex));
  return parts.join('');
}

function getExternalLinkMetadataFromUrl(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  
  if (!/^https?:$/.test(url.protocol) || isInternalColumnUrl(url.href)) return null;

  const metadataKey = url.href.endsWith('/') ? url.href : `${url.href}/`;
  const staticMetadata = STATIC_EXTERNAL_LINK_METADATA[metadataKey] || STATIC_EXTERNAL_LINK_METADATA[url.href];

  return {
    url: url.href,
    host: url.hostname.replace(/^www\./, ''),
    title: staticMetadata?.title || url.hostname.replace(/^www\./, ''),
    description: staticMetadata?.description || url.href,
    image: staticMetadata?.image || '',
  };
}

function replaceBareUrlsInHtmlText(html, replacer) {
  const tokens = [];
  const tagRegex = /<[^>]+>/g;
  let lastIndex = 0;
  let match;

  while ((match = tagRegex.exec(html)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', content: html.slice(lastIndex, match.index) });
    }
    tokens.push({ type: 'tag', content: match[0] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < html.length) {
    tokens.push({ type: 'text', content: html.slice(lastIndex) });
  }

  let insideAnchorDepth = 0;
  return tokens.map(token => {
    if (token.type === 'tag') {
      const lower = token.content.toLowerCase();
      if (lower.startsWith('<a ') || lower === '<a>') insideAnchorDepth++;
      else if (lower.startsWith('</a>')) insideAnchorDepth = Math.max(0, insideAnchorDepth - 1);
      return token.content;
    }
    if (insideAnchorDepth > 0) return token.content;
    return token.content.replace(BARE_URL_REGEX, replacer);
  }).join('');
}

async function replaceManualInternalLinksWithCards(bodyHtml, currentSlug, allArticles) {
  if (!bodyHtml) return bodyHtml || '';

  const articleBySlug = new Map(
    allArticles
      .filter(article => article && article.slug && article.slug !== currentSlug)
      .map(article => [article.slug, article])
  );
  const cardPlaceholders = [];
  const externalMetadataByUrl = new Map();

  const collectExternalUrl = (rawUrl) => {
    let url;
    try {
      url = new URL(rawUrl);
    } catch {
      return;
    }
    if (!/^https?:$/.test(url.protocol) || isInternalColumnUrl(url.href)) return;
    externalMetadataByUrl.set(url.href, null);
  };

  for (const match of bodyHtml.matchAll(/<a\b[^>]*href=(["'])(.*?)\1[^>]*>/gi)) {
    collectExternalUrl(match[2]);
  }
  for (const match of bodyHtml.matchAll(BARE_URL_REGEX)) {
    collectExternalUrl(match[0]);
  }

  await Promise.all(
    [...externalMetadataByUrl.keys()].map(async (url) => {
      externalMetadataByUrl.set(url, await fetchExternalLinkMetadata(url));
    })
  );

  const makeCardPlaceholder = (cardHtml) => {
    const token = `@@KOKUBAN_LINK_CARD_${cardPlaceholders.length}@@`;
    cardPlaceholders.push({ token, cardHtml });
    return token;
  };

  const getCardPlaceholder = (rawUrl) => {
    const slug = getArticleSlugFromUrl(rawUrl);
    const article = slug ? articleBySlug.get(slug) : null;
    if (article) return makeCardPlaceholder(buildInternalLinkCardHtml(article));

    let normalizedUrl = '';
    try {
      normalizedUrl = new URL(rawUrl).href;
    } catch {
      return null;
    }
    const metadata = externalMetadataByUrl.get(normalizedUrl) || getExternalLinkMetadataFromUrl(rawUrl);
    return metadata ? makeCardPlaceholder(buildExternalLinkCardHtml(metadata)) : null;
  };

  const buildInlineLink = (rawUrl) => {
    let href = rawUrl;
    try {
      href = new URL(rawUrl).href;
    } catch {
      // Keep the original text if URL normalization fails.
    }
    return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(rawUrl)}</a>`;
  };

  const hasNonUrlText = (html) => html
    .replace(BARE_URL_REGEX, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim().length > 0;

  let html = bodyHtml;

  html = html.replace(
    /<p([^>]*)>\s*<a\b[^>]*href=(["'])(.*?)\2[^>]*>[\s\S]*?<\/a>\s*<\/p>/gi,
    (match, attrs, quote, href) => getCardPlaceholder(href) || match
  );

  html = html.replace(
    /<blockquote([^>]*)>([\s\S]*?)<\/blockquote>/gi,
    (match, attrs, innerHtml) => {
      let replaced = false;
      let nextInner = innerHtml.replace(
        /<a\b[^>]*href=(["'])(.*?)\1[^>]*>[\s\S]*?<\/a>/gi,
        (anchorMatch, quote, href) => {
          const card = getCardPlaceholder(href);
          if (!card) return anchorMatch;
          replaced = true;
          return card;
        }
      );

      nextInner = replaceBareUrlsInHtmlText(
        nextInner,
        (url) => {
          const card = getCardPlaceholder(url);
          if (!card) return url;
          replaced = true;
          return card;
        }
      );

      return replaced ? `<blockquote${attrs}>${nextInner}</blockquote>` : match;
    }
  );

  html = html.replace(
    /<p([^>]*)>([\s\S]*?)<\/p>/gi,
    (match, attrs, innerHtml) => {
      if (hasNonUrlText(innerHtml)) {
        const linkedHtml = replaceBareUrlsInHtmlText(innerHtml, buildInlineLink);
        return linkedHtml === innerHtml ? match : `<p${attrs}>${linkedHtml}</p>`;
      }

      let cardHtml = '';
      const textHtml = replaceBareUrlsInHtmlText(
        innerHtml,
        (url) => {
          const card = getCardPlaceholder(url);
          if (!card) return url;
          cardHtml += card;
          return '';
        }
      ).trim();

      if (!cardHtml) return match;
      return `${textHtml ? `<p${attrs}>${textHtml}</p>` : ''}${cardHtml}`;
    }
  );

  for (const { token, cardHtml } of cardPlaceholders) {
    html = html.split(token).join(cardHtml);
  }

  return html;
}

// ============================================================
// 内部リンク自動生成
// ============================================================

/**
 * 記事タイトル・slug・本文の特徴から「リンク化候補キーワード」を抽出
 * これらのキーワードが他記事の本文に出現したら、そこから自動でリンクを張る
 */
function extractKeywordsFromArticle(article) {
  const keywords = new Set();

  // 1. タイトル中の特徴的なキーワードを抽出
  const title = article.title || '';

  // タイトルから接頭辞・記号を除去した「素のキーワード」
  // 例: 〈電子黒板の活用〉Googleマップで中学受験対策― → "Googleマップで中学受験対策"
  const cleanTitle = title
    .replace(/[〈〉【】「」『』]/g, '')
    .replace(/^電子黒板の活用/, '')
    .trim();

  // 2. 既知のツール・サービス名・固有名詞リスト
  // これらが本文中に出てきたら、その記事へのリンク化候補とする
  const KNOWN_TOOLS = [
    'Stellarium', 'Google Earth', 'Googleマップ', 'Google Maps', 'Javalab', 'Java Lab',
    'Digital gene', 'kakijun.jp', 'BenQ Board', 'MIRAI TOUCH', 'ミライタッチ',
    'StarBoard', 'BIG PAD', 'MAXHUB', 'Promethean', 'NFC', 'ダイレクトボンディング',
    'Kokuban リース', 'Kokubanリース',
  ];

  // 各ツール名について、記事のタイトルか本文に出てくるなら登録
  const fullText = `${title} ${article.body || ''}`;
  KNOWN_TOOLS.forEach(tool => {
    if (fullText.includes(tool)) {
      keywords.add(tool);
    }
  });

  // 3. タイトル冒頭の特徴的なフレーズ(8-25文字程度)を1つだけ追加
  // 例: タイトル "電子黒板×Google Earthで小中学生の歴史授業を時間旅行に変える方法" の場合
  // 既存のKNOWN_TOOLS から「Google Earth」が拾えるので、ここは控えめに
  
  return Array.from(keywords);
}

/**
 * 全記事を走査して、キーワード → 記事URL の辞書を構築
 * 同じキーワードを複数記事が持つ場合は、新しい記事を優先(最新が現役)
 */
function buildKeywordIndex(allArticles) {
  const index = new Map(); // keyword(lower) → { article, originalKeyword }

  // publishedAt の新しい順にソート (前提として元から新着順だが念のため)
  const sorted = [...allArticles].sort((a, b) =>
    new Date(b.publishedAt) - new Date(a.publishedAt)
  );

  for (const article of sorted) {
    if (!article.slug) continue;
    const keywords = extractKeywordsFromArticle(article);
    for (const kw of keywords) {
      const key = kw.toLowerCase();
      // 既に登録されていれば上書きしない (新しいものを優先しないことで安定)
      // ただし、現状の article のタイトルにそのキーワードが含まれている方が「主役記事」なので優先
      const inTitle = (article.title || '').toLowerCase().includes(key);
      if (!index.has(key) || (inTitle && !index.get(key).inTitle)) {
        index.set(key, { article, originalKeyword: kw, inTitle });
      }
    }
  }

  return index;
}

/**
 * HTML文字列を安全に走査し、テキストノード(タグ外)の部分のみで
 * 指定キーワードを最大 maxReplacements 回までリンク化する
 *
 * 制約:
 * - <a> タグ内・<img> alt属性内・属性値内は触らない
 * - 同じキーワードは1回だけ置換
 * - 自分自身の記事は除外(呼び出し側で対応)
 */
function injectInternalLinks(bodyHtml, currentSlug, keywordIndex, maxReplacements = 3) {
  if (!ENABLE_AUTO_INTERNAL_LINKS) return bodyHtml || '';
  if (!bodyHtml || keywordIndex.size === 0) return bodyHtml;

  // HTMLをトークン化: タグの内部(<...>) vs テキスト の交互配列
  const tokens = [];
  const tagRegex = /<[^>]+>/g;
  let lastIdx = 0;
  let match;
  while ((match = tagRegex.exec(bodyHtml)) !== null) {
    if (match.index > lastIdx) {
      tokens.push({ type: 'text', content: bodyHtml.slice(lastIdx, match.index) });
    }
    tokens.push({ type: 'tag', content: match[0] });
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < bodyHtml.length) {
    tokens.push({ type: 'text', content: bodyHtml.slice(lastIdx) });
  }

  // <a> タグの中に入っているかを判定する深度カウンター
  let insideAnchorDepth = 0;
  // 既に処理したキーワード(重複置換防止)
  const usedKeywords = new Set();
  let replacementCount = 0;

  // キーワードを長い順に並べる(「Google Earth」を「Google」より先に処理)
  const sortedKeywords = Array.from(keywordIndex.keys())
    .sort((a, b) => b.length - a.length);

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];

    if (tok.type === 'tag') {
      const lower = tok.content.toLowerCase();
      if (lower.startsWith('<a ') || lower === '<a>') insideAnchorDepth++;
      else if (lower.startsWith('</a>')) insideAnchorDepth = Math.max(0, insideAnchorDepth - 1);
      continue;
    }

    if (insideAnchorDepth > 0) continue;
    if (replacementCount >= maxReplacements) break;

    let textContent = tok.content;
    let textChanged = false;

    for (const key of sortedKeywords) {
      if (usedKeywords.has(key)) continue;
      if (replacementCount >= maxReplacements) break;

      const entry = keywordIndex.get(key);
      if (!entry || !entry.article || entry.article.slug === currentSlug) continue;

      // 大文字小文字を区別せずに最初の出現を見つける
      const lowerText = textContent.toLowerCase();
      const pos = lowerText.indexOf(key);
      if (pos === -1) continue;

      // 元の表記を保持してリンク化
      const matched = textContent.substr(pos, key.length);
      const linkUrl = `/columns/${entry.article.slug}/`;
      const linkTitle = escapeHtml(entry.article.title || matched);
      const linkedHtml = `<a href="${linkUrl}" class="internal-link" title="${linkTitle}">${matched}</a>`;

      textContent = textContent.slice(0, pos) + linkedHtml + textContent.slice(pos + key.length);
      usedKeywords.add(key);
      replacementCount++;
      textChanged = true;
    }

    if (textChanged) {
      tok.content = textContent;
    }
  }

  return tokens.map(t => t.content).join('');
}

/**
 * 執筆者ページを生成(E-E-A-T強化)
 * 各執筆者の個別プロフィールページを /team/{slug}/ に出力
 */
function buildAuthorPages(allArticles) {
  console.log('執筆者ページを生成中...');

  // /team/ ディレクトリを作成
  if (!fs.existsSync(TEAM_DIR)) {
    fs.mkdirSync(TEAM_DIR, { recursive: true });
  }

  for (const author of AUTHORS) {
    // この執筆者が書いた記事を抽出
    const myArticles = allArticles.filter(article => {
      if (!article.author) return false;
      return author.matchKeys.some(key => article.author.includes(key));
    });

    const articleListHtml = myArticles.length > 0
      ? myArticles.map(a => {
          const imageUrl = a.eyecatch?.url
            ? `${a.eyecatch.url}?fit=crop&w=400&h=225&q=80`
            : 'https://placehold.co/400x225/e0e7ff/1e3a8a?text=Kokuban+BASE';
          const date = a.publishedAt
            ? formatDateJST(a.publishedAt)
            : '';
          return `
        <a href="/columns/${a.slug}/" class="block group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden border border-gray-100">
            <div class="aspect-video overflow-hidden bg-gray-50">
                <img src="${imageUrl}" alt="${escapeHtml(a.title)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" width="400" height="225">
            </div>
            <div class="p-5">
                <time class="text-xs font-bold text-gray-400 tracking-widest">${date}</time>
                <h3 class="mt-2 text-base font-bold text-gray-800 group-hover:text-customBlue transition-colors line-clamp-2 leading-snug">${escapeHtml(a.title)}</h3>
            </div>
        </a>`;
        }).join('')
      : '<p class="col-span-full text-center text-gray-400 py-12">執筆記事は準備中です。</p>';

    const specialtiesHtml = author.specialties.map(s =>
      `<span class="inline-block bg-blue-50 text-customBlue text-xs font-bold px-3 py-1 rounded-full mr-2 mb-2">${escapeHtml(s)}</span>`
    ).join('');

    const achievementsHtml = author.achievements.map(a =>
      `<li class="flex items-start text-gray-700"><i class="fas fa-check text-customBlue text-xs mt-2 mr-3 flex-shrink-0"></i><span>${escapeHtml(a)}</span></li>`
    ).join('');

    const profileUrl = `${BASE_URL}/team/${author.slug}/`;

    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-GSSKLZ6EDH"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-GSSKLZ6EDH');
    </script>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(author.name)}(${escapeHtml(author.role)})｜執筆者プロフィール｜Kokuban BASE</title>
    <meta name="description" content="${escapeHtml(author.name)}(${escapeHtml(author.role)})のプロフィール。${escapeHtml(author.specialties[0])}を専門とし、電子黒板の比較体験倉庫Kokuban BASEで活動中。執筆記事一覧もこちらから。">
    <link rel="canonical" href="${profileUrl}">
    <meta property="og:url" content="${profileUrl}">
    <meta property="og:title" content="${escapeHtml(author.name)}｜執筆者プロフィール｜Kokuban BASE">
    <meta property="og:description" content="${escapeHtml(author.role)}。${escapeHtml(author.specialties.join('、'))}が専門。Kokuban BASEで活動中。">
    <meta property="og:image" content="${BASE_URL}${author.photoUrl}">
    <meta property="og:type" content="profile">
    <meta property="og:site_name" content="Kokuban BASE">
    <meta property="og:locale" content="ja_JP">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(author.name)}｜執筆者プロフィール｜Kokuban BASE">
    <meta name="twitter:description" content="${escapeHtml(author.role)}。${escapeHtml(author.specialties.join('、'))}が専門。">
    <meta name="twitter:image" content="${BASE_URL}${author.photoUrl}">

    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      "url": "${profileUrl}",
      "mainEntity": {
        "@type": "Person",
        "name": "${escapeHtml(author.name)}",
        "alternateName": "${escapeHtml(author.nameRomaji)}",
        "jobTitle": "${escapeHtml(author.role)}",
        "description": "${escapeHtml(author.bio)}",
        "image": "${BASE_URL}${author.photoUrl}",
        "url": "${profileUrl}",
        "knowsAbout": [${author.specialties.map(s => `"${escapeHtml(s)}"`).join(', ')}],
        "worksFor": {
          "@type": "Organization",
          "name": "株式会社idea spot",
          "url": "https://www.idea-spot.co.jp/",
          "subOrganization": {
            "@type": "Organization",
            "name": "Kokuban BASE",
            "url": "${BASE_URL}/"
          }
        }
      }
    }
    </script>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "トップ", "item": "${BASE_URL}/" },
        { "@type": "ListItem", "position": 2, "name": "運営チーム", "item": "${BASE_URL}/team/" },
        { "@type": "ListItem", "position": 3, "name": "${escapeHtml(author.name)}", "item": "${profileUrl}" }
      ]
    }
    </script>

    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" media="print" onload="this.media='all'">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Noto+Sans+JP:wght@400;500;700;900&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', 'Noto Sans JP', sans-serif; background-color: #fafafa; color: #333; }
        .bg-custom-blue { background-color: #103f99; }
        .text-custom-blue, .text-customBlue { color: #103f99; }
        .text-shadow { text-shadow: 0 1px 3px rgba(0,0,0,0.3); }
        .line-clamp-2 {
            display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
            overflow: hidden; text-overflow: ellipsis;
        }
    </style>
    <script>
        tailwind.config = { theme: { extend: { colors: { customBlue: '#103f99' } } } };
    </script>
</head>
<body>
    <header id="page-header" class="bg-[#103f99] sticky top-0 z-20 transition-colors duration-300">
        <div class="px-6 lg:px-8">
            <div class="flex items-stretch h-[50px] sm:h-20">
                <div class="flex-1 flex items-center space-x-8">
                    <div class="text-xl sm:text-2xl font-bold text-white text-shadow flex-shrink-0">
                        <a href="/" class="hover:opacity-80 transition-opacity">Kokuban BASE</a>
                    </div>
                    <nav class="hidden lg:flex items-center space-x-1 text-sm">
                        <a href="/Kokubanlease" class="text-white font-semibold hover:opacity-80 transition-opacity text-shadow p-2">Kokuban リース</a>
                        <a href="/article" class="text-white font-semibold hover:opacity-80 transition-opacity text-shadow p-2">コラム</a>
                        <a href="/#access" class="text-white font-semibold hover:opacity-80 transition-opacity text-shadow p-2">アクセス</a>
                    </nav>
                </div>
                <div class="flex-shrink-0 flex justify-end">
                    <div class="hidden sm:flex h-full">
                        <a href="/contact" class="bg-white text-[#103f99] font-bold text-base lg:text-lg flex items-center justify-center w-full sm:w-36 lg:w-48 hover:bg-gray-100 transition-colors px-2">お問い合わせ</a>
                        <a href="/reservation" class="bg-pink-500 text-white font-bold text-base lg:text-lg flex items-center justify-center w-full sm:w-36 lg:w-48 hover:bg-pink-600 transition-colors px-2">来場予約</a>
                    </div>
                </div>
            </div>
        </div>
    </header>

    <main class="bg-white">
        <!-- パンくず -->
        <nav aria-label="パンくずリスト" class="border-b border-gray-100">
            <div class="max-w-screen-xl mx-auto px-4 sm:px-6 py-3">
                <ol class="flex items-center text-sm text-gray-600 flex-wrap gap-y-1">
                    <li class="flex items-center">
                        <a href="/" class="hover:text-customBlue transition-colors">トップ</a>
                        <svg class="w-4 h-4 mx-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                    </li>
                    <li class="flex items-center">
                        <a href="/team/" class="hover:text-customBlue transition-colors">運営チーム</a>
                        <svg class="w-4 h-4 mx-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                    </li>
                    <li>
                        <span aria-current="page" class="font-semibold text-gray-900">${escapeHtml(author.name)}</span>
                    </li>
                </ol>
            </div>
        </nav>

        <!-- プロフィール -->
        <section class="bg-gradient-to-br from-blue-50 to-white py-16 sm:py-24">
            <div class="max-w-4xl mx-auto px-6 lg:px-8">
                <div class="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12">
                    <div class="flex-shrink-0">
                        <img src="${author.photoUrl}" alt="${escapeHtml(author.name)}(${escapeHtml(author.role)})" class="w-48 h-48 sm:w-56 sm:h-56 rounded-full object-cover shadow-xl ring-4 ring-white" width="512" height="512">
                    </div>
                    <div class="flex-grow text-center md:text-left">
                        <p class="text-sm text-gray-500 font-bold tracking-widest mb-1 uppercase">${escapeHtml(author.nameRomaji)}</p>
                        <h1 class="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-2 leading-tight">${escapeHtml(author.name)}</h1>
                        <p class="text-sm text-gray-500 mb-4">${escapeHtml(author.nameKana)}</p>
                        <p class="inline-block bg-customBlue text-white text-base font-bold px-4 py-1.5 rounded-full mb-6">${escapeHtml(author.role)}</p>
                        <div class="text-left">
                            <h2 class="text-xs font-bold text-gray-500 tracking-widest uppercase mb-3">専門分野</h2>
                            <div class="flex flex-wrap">${specialtiesHtml}</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- 経歴・実績 -->
        <section class="py-12 sm:py-16">
            <div class="max-w-4xl mx-auto px-6 lg:px-8">
                <div class="bg-white rounded-2xl shadow-sm p-8 sm:p-12 border border-gray-100">
                    <h2 class="text-xl sm:text-2xl font-bold text-customBlue mb-6 flex items-center">
                        <span class="w-1.5 h-7 bg-customBlue mr-3"></span>プロフィール
                    </h2>
                    <p class="text-gray-700 leading-relaxed mb-8">${escapeHtml(author.bio)}</p>

                    <h2 class="text-xl sm:text-2xl font-bold text-customBlue mb-6 flex items-center">
                        <span class="w-1.5 h-7 bg-customBlue mr-3"></span>主な経歴・実績
                    </h2>
                    <ul class="space-y-3">${achievementsHtml}</ul>
                </div>
            </div>
        </section>

        <!-- 執筆記事 -->
        <section class="py-12 sm:py-16 bg-gray-50">
            <div class="max-w-6xl mx-auto px-6 lg:px-8">
                <div class="text-center mb-10">
                    <h2 class="text-2xl sm:text-3xl font-bold text-customBlue mb-3">${escapeHtml(author.name)} の執筆記事</h2>
                    <p class="text-gray-600">${myArticles.length > 0 ? `${myArticles.length}件の記事を執筆しています` : '執筆記事は準備中です'}</p>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">${articleListHtml}</div>
                <div class="mt-12 text-center">
                    <a href="/article" class="inline-flex items-center bg-white text-customBlue font-bold px-8 py-3 rounded-full border-2 border-customBlue hover:bg-customBlue hover:text-white transition-all shadow-md">
                        コラム一覧へ <i class="fas fa-arrow-right ml-2"></i>
                    </a>
                </div>
            </div>
        </section>
    </main>

    <footer class="bg-[#103f99] text-gray-200">
        <div class="container mx-auto px-6 py-12">
            <div class="text-2xl font-bold text-white mb-4">Kokuban BASE</div>
            <p class="text-blue-200 mb-8">株式会社idea spot</p>
            <div class="border-t border-white/20 pt-8 text-center text-blue-200">&copy; 2025 株式会社idea spot. All Rights Reserved.</div>
        </div>
    </footer>
</body>
</html>`;

    // 出力
    const authorDir = path.resolve(TEAM_DIR, author.slug);
    if (!fs.existsSync(authorDir)) {
      fs.mkdirSync(authorDir, { recursive: true });
    }
    const outputPath = path.resolve(authorDir, 'index.html');
    try {
      fs.writeFileSync(outputPath, html);
      console.log(`  👤 ${author.slug}: ${myArticles.length}件の執筆記事 / ${outputPath}`);
    } catch (err) {
      console.error(`  ✗ ${author.slug} の保存失敗:`, err);
    }
  }

  // /team/ のインデックスページを作成
  const teamIndexCards = AUTHORS.map(author => {
    const myArticleCount = allArticles.filter(a =>
      a.author && author.matchKeys.some(k => a.author.includes(k))
    ).length;
    return `
        <a href="/team/${author.slug}/" class="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all p-8 group border border-gray-100">
            <img src="${author.photoUrl}" alt="${escapeHtml(author.name)}" class="w-32 h-32 rounded-full object-cover mx-auto shadow-md mb-5" width="256" height="256">
            <h2 class="text-xl font-bold text-gray-900 text-center mb-1 group-hover:text-customBlue transition-colors">${escapeHtml(author.name)}</h2>
            <p class="text-sm text-pink-500 font-semibold text-center mb-3">${escapeHtml(author.role)}</p>
            <p class="text-sm text-gray-600 text-center line-clamp-2 mb-4">${escapeHtml(author.specialties.join(' / '))}</p>
            <p class="text-xs text-gray-400 text-center">執筆記事 ${myArticleCount}件 →</p>
        </a>`;
  }).join('');

  const teamIndexHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-GSSKLZ6EDH"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-GSSKLZ6EDH');
    </script>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>運営チーム｜現役講師による電子黒板比較体験｜Kokuban BASE</title>
    <meta name="description" content="Kokuban BASEの運営チームをご紹介。中学受験算数・社会のトップ講師、ICT教材の専門家など、現役で授業を行う講師陣が電子黒板の比較体験をご案内します。">
    <link rel="canonical" href="${BASE_URL}/team/">
    <meta property="og:url" content="${BASE_URL}/team/">
    <meta property="og:title" content="運営チーム｜Kokuban BASE">
    <meta property="og:description" content="現役講師による電子黒板比較体験。Kokuban BASEの運営メンバーをご紹介します。">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Kokuban BASE">
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" media="print" onload="this.media='all'">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Noto+Sans+JP:wght@400;500;700;900&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', 'Noto Sans JP', sans-serif; background-color: #fafafa; color: #333; }
        .text-customBlue { color: #103f99; }
        .text-shadow { text-shadow: 0 1px 3px rgba(0,0,0,0.3); }
        .line-clamp-2 {
            display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
            overflow: hidden; text-overflow: ellipsis;
        }
    </style>
    <script>
        tailwind.config = { theme: { extend: { colors: { customBlue: '#103f99' } } } };
    </script>
</head>
<body>
    <header class="bg-[#103f99] sticky top-0 z-20">
        <div class="px-6 lg:px-8">
            <div class="flex items-stretch h-[50px] sm:h-20">
                <div class="flex-1 flex items-center">
                    <div class="text-xl sm:text-2xl font-bold text-white text-shadow">
                        <a href="/" class="hover:opacity-80 transition-opacity">Kokuban BASE</a>
                    </div>
                </div>
                <div class="hidden sm:flex h-full">
                    <a href="/contact" class="bg-white text-[#103f99] font-bold flex items-center justify-center w-36 hover:bg-gray-100 transition-colors px-4">お問い合わせ</a>
                </div>
            </div>
        </div>
    </header>

    <main class="bg-white">
        <nav aria-label="パンくずリスト" class="border-b border-gray-100">
            <div class="max-w-screen-xl mx-auto px-4 sm:px-6 py-3">
                <ol class="flex items-center text-sm text-gray-600">
                    <li class="flex items-center">
                        <a href="/" class="hover:text-customBlue transition-colors">トップ</a>
                        <svg class="w-4 h-4 mx-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                    </li>
                    <li><span class="font-semibold text-gray-900">運営チーム</span></li>
                </ol>
            </div>
        </nav>

        <section class="py-16 sm:py-24 bg-gradient-to-br from-blue-50 to-white">
            <div class="max-w-4xl mx-auto px-6 text-center">
                <p class="text-sm text-gray-500 font-bold tracking-widest mb-2 uppercase">Our Team</p>
                <h1 class="text-3xl sm:text-4xl md:text-5xl font-black text-customBlue mb-4 leading-tight">運営チーム</h1>
                <p class="text-gray-600 max-w-2xl mx-auto">日々、電子黒板を実際の授業で使用している<br class="sm:hidden">現役講師が、Kokuban BASEを運営しています。</p>
            </div>
        </section>

        <section class="py-12 sm:py-16">
            <div class="max-w-6xl mx-auto px-6 lg:px-8">
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">${teamIndexCards}</div>
            </div>
        </section>
    </main>

    <footer class="bg-[#103f99] text-gray-200">
        <div class="container mx-auto px-6 py-12 text-center">
            <div class="text-2xl font-bold text-white mb-2">Kokuban BASE</div>
            <p class="text-blue-200 mb-6">株式会社idea spot</p>
            <div class="border-t border-white/20 pt-6 text-blue-200">&copy; 2025 株式会社idea spot. All Rights Reserved.</div>
        </div>
    </footer>
</body>
</html>`;

  const teamIndexPath = path.resolve(TEAM_DIR, 'index.html');
  try {
    fs.writeFileSync(teamIndexPath, teamIndexHtml);
    console.log(`  👥 運営チーム一覧ページ生成完了 / ${teamIndexPath}`);
  } catch (err) {
    console.error('  ✗ 運営チーム一覧の保存失敗:', err);
  }
}

/**
 * 旧slug用のリダイレクトHTMLを生成
 */
function generateRedirectPages() {
  const redirectEntries = Object.entries(SLUG_REDIRECTS);
  if (redirectEntries.length === 0) {
    console.log('リダイレクト設定なし。スキップします。');
    return;
  }

  console.log('旧slug用リダイレクトHTMLを生成中...');
  for (const [oldSlug, newSlug] of redirectEntries) {
    const redirectDir = path.resolve(COLUMNS_DIR, oldSlug);
    const redirectHtmlPath = path.resolve(redirectDir, 'index.html');
    const targetUrl = `${BASE_URL}/columns/${newSlug}/`;

    if (!fs.existsSync(redirectDir)) {
      fs.mkdirSync(redirectDir, { recursive: true });
    }

    const redirectHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>移転しました｜Kokuban BASE</title>
<link rel="canonical" href="${targetUrl}">
<meta http-equiv="refresh" content="0; url=${targetUrl}">
<meta name="robots" content="noindex">
<script>window.location.replace("${targetUrl}");</script>
</head>
<body>
<p>このページは <a href="${targetUrl}">${targetUrl}</a> に移動しました。</p>
</body>
</html>`;

    try {
      fs.writeFileSync(redirectHtmlPath, redirectHtml);
      console.log(`リダイレクト生成: /columns/${oldSlug}/ → /columns/${newSlug}/`);
    } catch (err) {
      console.error(`リダイレクトHTMLの書き込み失敗 (${oldSlug}):`, err);
    }
  }
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
          fields: 'id,slug,title,body,eyecatch,publishedAt,updatedAt,revisedAt,description,category,author',
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
    const normalizedContents = allContents.map((article) => {
      if (typeof article.slug !== 'string') return article;
      const trimmedSlug = article.slug.trim();
      if (trimmedSlug === article.slug) return article;
      console.warn(`警告: 記事ID ${article.id} のslug前後の空白を除去しました: "${article.slug}" -> "${trimmedSlug}"`);
      return { ...article, slug: trimmedSlug };
    });

    console.log(`合計 ${normalizedContents.length} 件の記事データを取得しました。`);
    return normalizedContents;
  } catch (err) {
    console.error('記事データの取得に失敗しました:', err);
    throw err;
  }
}

/**
 * お知らせ(information エンドポイント)を取得し、
 * information/index.json として書き出す
 *
 * microCMS スキーマ:
 *   title       … タイトル (テキスト)
 *   publishedAt … 公開日 (日時)
 *   category    … カテゴリ (コンテンツ参照。{ id, name } のオブジェクト)
 *   url         … 外部リンクURL (テキスト。空ならクリックで画像モーダル表示)
 *   photo       … 関連画像 (複数画像 = 配列)
 *
 * information/index.html の表示コードは item.image / item.thumbnail / item.category / item.url / item.date を見るため、
 * ここで読みやすい形に詰め替えて出力する。
 */
async function buildInformationJson() {
  const infoServiceDomain = (
    process.env.INFORMATION_SERVICE_DOMAIN ||
    process.env.MICROCMS_INFORMATION_DOMAIN ||
    process.env.MICROCMS_INFO_DOMAIN ||
    ''
  ).trim();
  const infoApiKey = (
    process.env.MICROCMS_INFORMATION_KEY ||
    process.env.INFORMATION_API_KEY ||
    process.env.MICROCMS_INFO_KEY ||
    ''
  ).trim();

  if (!infoServiceDomain || !infoApiKey) {
    console.log('Skipping information JSON build: information microCMS env vars are not set.');
    return;
  }

  const informationClient = createClient({
    serviceDomain: infoServiceDomain,
    apiKey: infoApiKey,
  });
  console.log('お知らせ(information)データを取得開始...');
  const allItems = [];
  let offset = 0;
  const limit = 50;
  const now = new Date().toISOString();

  try {
    while (true) {
      const response = await informationClient.get({
        endpoint: 'information',
        queries: {
          fields: 'id,title,publishedAt,category,url,photo',
          limit: limit,
          offset: offset,
          orders: '-publishedAt',
          filters: `publishedAt[less_than]${now}`,
        },
      });

      if (!response.contents || response.contents.length === 0) break;
      allItems.push(...response.contents);
      offset += response.contents.length;
      if (offset >= response.totalCount) break;
    }

    console.log(`合計 ${allItems.length} 件のお知らせを取得しました。`);

    // 表示用HTML(information/index.html)が読める形に整形
    const formatted = allItems.map(item => {
      // 画像: photo は複数画像(配列)。先頭を image として渡す
      let image = null;
      if (Array.isArray(item.photo) && item.photo.length > 0 && item.photo[0] && item.photo[0].url) {
        image = { url: item.photo[0].url };
      } else if (item.photo && typeof item.photo === 'object' && item.photo.url) {
        // 念のため単一画像で返ってきた場合にも対応
        image = { url: item.photo.url };
      }

      // カテゴリ: 参照オブジェクトの name を取り出す(色分けに使用)
      // 単一参照なら文字列、複数参照なら配列で返す
      let category = null;
      if (item.category) {
        if (Array.isArray(item.category)) {
          category = item.category.map(c =>
            (c && typeof c === 'object' && c.name) ? c.name : c
          );
        } else if (typeof item.category === 'object' && item.category.name) {
          category = item.category.name;
        } else {
          category = item.category;
        }
      }

      return {
        id: item.id,
        title: item.title || '',
        publishedAt: item.publishedAt || null,
        date: item.publishedAt || null,
        category: category,
        url: item.url || '',
        image: image,
      };
    });

    // 出力先ディレクトリが無ければ作成
    const informationDir = path.dirname(INFORMATION_JSON_PATH);
    if (!fs.existsSync(informationDir)) {
      fs.mkdirSync(informationDir, { recursive: true });
    }

    fs.writeFileSync(INFORMATION_JSON_PATH, JSON.stringify(formatted, null, 2));
    console.log(`information/index.json を ${INFORMATION_JSON_PATH} に保存しました(${formatted.length}件)。`);
  } catch (err) {
    // お知らせの取得に失敗しても、コラム側のビルド成果物は守りたいので throw しない
    console.error('お知らせ(information)の取得・保存に失敗しました:', err);
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
  xml += `  <url>\n    <loc>${BASE_URL}/article/</loc>\n    <priority>0.9</priority>\n    <changefreq>daily</changefreq>\n  </url>\n`;

  const staticPages = [
    'denshikokuban',
    'check',
    'service',
    'school',
    'juku',
    'lease',
    'lease/first-time',
    'lineup',
    'lineup/starboard',
    'lineup/miraitouch',
    'lineup/sharp-bigpad',
    'lineup/benqboard',
    'lineup/promethean',
    'experience',
    'demo-rental',
    'support',
    'voices',
    'company',
    'faq',
    'information',
    'contact'
  ];
  staticPages.forEach(page => {
    xml += `  <url>\n    <loc>${BASE_URL}/${page}/</loc>\n    <priority>0.8</priority>\n    <changefreq>monthly</changefreq>\n  </url>\n`;
  });

  // 執筆者ページ(E-E-A-T強化)
  xml += `  <url>\n    <loc>${BASE_URL}/team/</loc>\n    <priority>0.7</priority>\n    <changefreq>monthly</changefreq>\n  </url>\n`;
  AUTHORS.forEach(author => {
    xml += `  <url>\n    <loc>${BASE_URL}/team/${author.slug}/</loc>\n    <priority>0.6</priority>\n    <changefreq>monthly</changefreq>\n  </url>\n`;
  });

  articles.forEach(article => {
    const url = `${BASE_URL}/columns/${article.slug}/`;
    // sitemap の lastmod は revisedAt(手動更新日)優先、なければ publishedAt
    // microCMSの自動 updatedAt は使わない(軽微な修正で更新通知が出るのを防ぐ)
    const lastModSource = article.revisedAt
      && getJSTDateKey(article.revisedAt) > getJSTDateKey(article.publishedAt)
      ? article.revisedAt
      : article.publishedAt;
    const lastMod = getJSTDateKey(lastModSource);
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
    if (typeof c === 'string') return ['interview', 'taidan', '対談記事', 'Kokuban BASE独自取材', '独自取材'].includes(c);
    if (typeof c === 'object' && c.id) return c.id === 'interview';
    return false;
  });
}

/**
 * カテゴリ名の正規化（旧名称・ID → 新カテゴリ名）
 */
function normalizeCategoryName(rawCat) {
  let name = '';
  if (!rawCat) return '';
  if (typeof rawCat === 'string') name = rawCat;
  else if (typeof rawCat === 'object') name = rawCat.name || rawCat.id || '';
  const MAP = {
    'interview': 'Kokuban BASE独自取材',
    'taidan': 'Kokuban BASE独自取材',
    '対談記事': 'Kokuban BASE独自取材',
    '活用事例': '電子黒板の活用事例',
    'column': 'コラム'
  };
  return MAP[name] || name;
}

/**
 * 記事のカテゴリ名一覧（正規化済み・重複なし）
 */
function articleCategoryNames(article) {
  const raw = article.category;
  const arr = Array.isArray(raw) ? raw : [raw];
  const names = arr.map(normalizeCategoryName).filter(Boolean);
  return names.length ? [...new Set(names)] : ['コラム'];
}

/**
 * 記事カードのHTMLを生成（article/index.html の静的生成用）
 * 高密度カード: サムネ + カテゴリ + 日付 + タイトル + 説明文（著者は表示しない）
 * data-cats はクライアント側のカテゴリ絞り込みで使用する
 */
function buildCardHtml(article) {
  const date = formatDateJST(article.publishedAt);
  const url = `/columns/${article.slug}/`;
  const img = article.eyecatchUrl
    ? `${article.eyecatchUrl}?fit=crop&w=480&h=270&q=80`
    : (article.eyecatch?.url
      ? `${article.eyecatch.url}?fit=crop&w=480&h=270&q=80`
      : 'https://placehold.co/480x270?text=No+Image');
  const title = escapeHtml(article.title);
  const desc = escapeHtml(String(article.description || '').trim());
  const cats = articleCategoryNames(article);
  const catAttr = escapeHtml(cats.join('|'));
  const primary = cats[0];
  const isPick = primary === 'Kokuban BASE独自取材';

  return `
      <article class="kb-art-card" data-cats="${catAttr}">
        <a href="${url}">
          <figure><img src="${img}" alt="${title}" loading="lazy" decoding="async"></figure>
          <div class="kb-art-card__body">
            <div class="kb-art-card__meta"><span class="cat${isPick ? ' is-pick' : ''}">${escapeHtml(primary)}</span><time>${date}</time></div>
            <h2>${title}</h2>
            ${desc ? `<p>${desc}</p>` : ''}
          </div>
        </a>
      </article>`;
}

/**
 * 編集部Pick Up（サイドバー）1件分のHTML
 */
function buildPickupHtml(article) {
  const date = formatDateJST(article.publishedAt);
  const url = `/columns/${article.slug}/`;
  const img = article.eyecatchUrl
    ? `${article.eyecatchUrl}?fit=crop&w=240&h=150&q=80`
    : (article.eyecatch?.url
      ? `${article.eyecatch.url}?fit=crop&w=240&h=150&q=80`
      : 'https://placehold.co/240x150?text=No+Image');
  const title = escapeHtml(article.title);
  return `
      <a class="kb-art-pick" href="${url}">
        <figure><img src="${img}" alt="" loading="lazy" decoding="async"></figure>
        <div><h3>${title}</h3><time>${date}</time></div>
      </a>`;
}

/**
 * 記事一覧ページ (article.html) を静的生成する
 * SEO対策: 検索エンジンがクロールできるよう、初期HTMLに記事リンクを埋め込む
 * セキュリティ対策: APIキーを含むscriptブロックを除去する
 */
async function buildArticleListPage(articles) {
  console.log('article.html を静的生成中...');

  // クリーンなテンプレート（article/index.template.html）を入力に使う。
  // 生成先の article/index.html を入力に使うと、マージ事故で混入した
  // コンフリクトマーカーや重複セクションが自分自身に蓄積し続けてしまうため、
  // 破損し得る生成物ではなく、Bot が書き換えない固定テンプレートから毎回生成する。
  let html;
  try {
    html = fs.readFileSync(ARTICLE_TEMPLATE_PATH, 'utf-8');
  } catch (templateErr) {
    console.warn('article テンプレートが見つからないため、生成済み article.html をフォールバックに使用します:', templateErr.message);
    try {
      html = fs.readFileSync(ARTICLE_HTML_PATH, 'utf-8');
    } catch (err) {
      console.error('article.html の読み込みに失敗しました:', err);
      return;
    }
  }

  // 念のための保険: 何らかの理由で混入した git コンフリクトマーカー行を除去
  html = html.replace(/^[ \t]*(?:<{7}|={7}|>{7})[^\n]*\r?\n?/gm, '');

  // ① 全記事を1つの高密度グリッドに注入（カテゴリ絞り込みはクライアント側の data-cats で行う）
  const allHtml = articles.length > 0
    ? articles.map(a => buildCardHtml(a)).join('\n')
    : '<p class="kb-art-empty">記事が見つかりませんでした。</p>';

  html = html.replace(
    /<div id="all-articles" class="kb-art-grid"><\/div>/,
    `<div id="all-articles" class="kb-art-grid">\n${allHtml}\n</div>`
  );

  // ② 編集部Pick Up: 独自取材の最新5件（足りなければ他カテゴリの新着で補完）
  const interviews = articles.filter(a => isInterview(a));
  const others = articles.filter(a => !isInterview(a));
  const pickups = interviews.slice(0, 5);
  for (const a of others) {
    if (pickups.length >= 5) break;
    pickups.push(a);
  }
  const pickupHtml = pickups.map(a => buildPickupHtml(a)).join('\n');
  html = html.replace(
    /<div id="pickup-list"><\/div>/,
    `<div id="pickup-list">\n${pickupHtml}\n</div>`
  );

  try {
    fs.writeFileSync(ARTICLE_HTML_PATH, html);
    console.log(`article.html の静的生成が完了しました（全${articles.length}件 / Pick Up:${pickups.length}件）。`);
  } catch (err) {
    console.error('article.html の書き込みに失敗しました:', err);
  }
}

/**
 * 「電子黒板って何ができるの？」ページ (whatissmrtboard.html) を静的生成する
 * 旧版はクライアントサイドでmicroCMS APIを呼び出していたためAPIキー露出リスクがあった
 * ビルド時にコラム一覧をHTMLに埋め込むことで、APIキーを完全に排除する
 */
function getArticleCategoryName(category) {
  if (Array.isArray(category)) {
    const first = category.find(Boolean);
    if (!first) return 'その他';
    return typeof first === 'object' ? (first.name || first.id || 'その他') : first;
  }
  if (category && typeof category === 'object') return category.name || category.id || 'その他';
  return category || 'その他';
}


/**
 * トップページ (index.html) の「最新NEWS」「コラム」欄に初期HTMLを静的に埋め込む
 * クライアントJSは読み込み後に同じデータで再描画するため表示は変わらないが、
 * 検索エンジンの初期HTMLに記事リンクが含まれ、「読み込み中」の一瞬の表示もなくなる。
 * 差し替え範囲は <!-- BUILD:TOP-NEWS --> / <!-- BUILD:TOP-COLUMNS --> マーカーの内側のみ。
 * 描画するHTMLは index.html 内クライアントJSの renderNews / renderColumns と揃えること。
 */
function buildHomepageStaticSections(summaryList) {
  if (!fs.existsSync(HOME_HTML_PATH)) return;

  let html = fs.readFileSync(HOME_HTML_PATH, 'utf8');
  if (!html.includes('<!-- BUILD:TOP-NEWS -->') || !html.includes('<!-- BUILD:TOP-COLUMNS -->')) {
    console.warn('index.html に BUILD:TOP マーカーが見つからないため、トップページの静的埋め込みをスキップします。');
    return;
  }

  const categoryName = (category) => {
    if (Array.isArray(category)) {
      const first = category.find(Boolean);
      if (!first) return 'お知らせ';
      return typeof first === 'object' ? (first.name || first.id || 'お知らせ') : first;
    }
    if (category && typeof category === 'object') return category.name || category.id || 'お知らせ';
    return category || 'お知らせ';
  };
  const categoryClass = (name) => {
    if (name.includes('イベント')) return 'news-cat news-cat-event';
    if (name.includes('メディア') || name.includes('取材')) return 'news-cat news-cat-media';
    return 'news-cat';
  };

  // --- 最新NEWS: information/index.json の先頭5件（コラム記事由来の項目は除外） ---
  let newsCount = 0;
  let newsItems = null;
  try {
    const parsed = JSON.parse(fs.readFileSync(INFORMATION_JSON_PATH, 'utf8'));
    if (Array.isArray(parsed)) newsItems = parsed;
  } catch (err) {
    console.warn('information/index.json を読み込めないため、NEWS欄は既存の内容を維持します:', err.message);
  }

  if (newsItems) {
    const rows = newsItems
      .filter(item => String(item.url || '').indexOf('/columns/') === -1 && !item.slug)
      .slice(0, 5)
      .map(item => {
        const dateSource = item.publishedAt || item.date || item.createdAt || '';
        const href = item.url || 'article/';
        const cat = categoryName(item.category);
        newsCount += 1;
        return '<li class="news-item"><a href="' + escapeHtml(href) + '" target="_blank" rel="noopener noreferrer">' +
          '<time datetime="' + escapeHtml(dateSource) + '">' + escapeHtml(formatDateJST(dateSource)) + '</time>' +
          '<span class="' + categoryClass(cat) + '">' + escapeHtml(cat) + '</span>' +
          '<span class="news-title">' + escapeHtml(item.title || '') + '</span>' +
          '</a></li>';
      })
      .join('\n        ');
    const newsInner = rows || '<li class="news-item"><a href="information/"><span class="news-title">最新情報を一覧で見る</span></a></li>';
    html = html.replace(
      /<!-- BUILD:TOP-NEWS -->[\s\S]*?<!-- \/BUILD:TOP-NEWS -->/,
      '<!-- BUILD:TOP-NEWS -->\n        ' + newsInner + '\n      <!-- /BUILD:TOP-NEWS -->'
    );
  }

  // --- コラム: 公開記事の最新3件 ---
  const latest = [...(summaryList || [])]
    .filter(a => a && a.slug)
    .sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))
    .slice(0, 3);

  const cards = latest.map((item, index) => {
    const title = escapeHtml(item.title || 'コラム');
    const href = 'columns/' + encodeURIComponent(item.slug) + '/';
    const dateSource = item.publishedAt || '';
    const publishedTime = new Date(dateSource || 0).getTime();
    const isNew = !Number.isNaN(publishedTime) && (Date.now() - publishedTime) < 21 * 24 * 60 * 60 * 1000;
    const newBadge = isNew ? '<span class="column-new">NEW</span>' : '';
    let thumb;
    if (item.eyecatchUrl) {
      const sep = item.eyecatchUrl.indexOf('?') >= 0 ? '&' : '?';
      const src = escapeHtml(item.eyecatchUrl + sep + 'fit=crop&w=600&h=338&q=80');
      thumb = '<div class="column-thumb column-thumb-img"><img src="' + src + '" alt="' + title + '" loading="lazy" decoding="async"></div>';
    } else {
      thumb = '<div class="column-thumb column-thumb-0' + ((index % 3) + 1) + '" aria-hidden="true"><span>' + title + '</span></div>';
    }
    return '<article class="column-card"><a href="' + href + '">' + thumb +
      '<time datetime="' + escapeHtml(dateSource) + '">' + escapeHtml(formatDateJST(dateSource)) + '</time>' + newBadge +
      '<h3>' + title + '</h3></a></article>';
  }).join('\n        ');

  const columnsInner = cards || '<p class="column-loading"><a href="article/">コラム一覧を見る</a></p>';
  html = html.replace(
    /<!-- BUILD:TOP-COLUMNS -->[\s\S]*?<!-- \/BUILD:TOP-COLUMNS -->/,
    '<!-- BUILD:TOP-COLUMNS -->\n        ' + columnsInner + '\n      <!-- /BUILD:TOP-COLUMNS -->'
  );

  try {
    fs.writeFileSync(HOME_HTML_PATH, html);
    console.log(`index.html の最新NEWS・コラム欄を静的に更新しました (NEWS:${newsCount}件 / コラム:${latest.length}件)。`);
  } catch (err) {
    console.error('index.html の書き込みに失敗しました:', err);
  }
}

async function buildWhatisPage(articles) {
  console.log('whatissmrtboard.html を静的生成中...');

  let html;
  try {
    html = fs.readFileSync(WHATIS_HTML_PATH, 'utf-8');
  } catch (err) {
    console.warn('whatissmrtboard.html が存在しないためスキップします:', err.message);
    return;
  }

  // slugがある記事のみ。最大5件 (メイン2件 + サイド3件)
  const validArticles = articles.filter(a => a && a.slug).slice(0, 5);

  // メイン2件のHTML
  const mainHtml = validArticles.slice(0, 2).map((item, index) => {
    const linkUrl = `/columns/${item.slug}/`;
    const title = escapeHtml(item.title || '無題のコラム');
    const date = item.publishedAt
      ? formatDateJST(item.publishedAt)
      : '';
    const category = escapeHtml((item.category && (typeof item.category === 'object' ? item.category.name : item.category)) || 'コラム');
    const excerpt = escapeHtml(item.description || extractDescription(item.body, 80) || '');

    const bgColor = index === 0 ? 'bg-[#eef2ff]' : 'bg-[#fff1f2]';
    const tagColor = index === 0 ? 'text-[#3730a3]' : 'text-[#9f1239]';
    const badgeColor = index === 0 ? 'bg-[#3b82f6]' : 'bg-[#ef4444]';

    return `
      <div class="flex flex-col group cursor-pointer fade-in">
        <a href="${linkUrl}" class="block">
          <div class="aspect-[1.5/1] ${bgColor} rounded-xl mb-6 overflow-hidden relative shadow-sm border border-gray-50">
            <div class="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <span class="text-xs sm:text-sm font-black ${tagColor} mb-1 opacity-80 tracking-widest">RESEARCH</span>
              <span class="text-base sm:text-xl font-black ${tagColor}">研究レポート</span>
            </div>
          </div>
          <div class="flex items-center gap-2 mb-3">
            <span class="${badgeColor} text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">${category}</span>
          </div>
          <div class="flex items-center gap-4 text-xs font-bold text-gray-400 mb-4">
            <span>${date}</span>
          </div>
          <h3 class="text-lg font-black mb-4 group-hover:text-[#ed5b8c] transition-colors leading-relaxed">${title}</h3>
          <p class="text-xs text-slate-500 leading-loose font-medium text-justify">${excerpt}</p>
        </a>
      </div>`;
  }).join('\n');

  // サイド3件のHTML
  const sideHtml = validArticles.slice(2, 5).map(item => {
    const linkUrl = `/columns/${item.slug}/`;
    const title = escapeHtml(item.title || '無題のコラム');
    const date = item.publishedAt
      ? formatDateJST(item.publishedAt)
      : '';

    return `
      <a href="${linkUrl}" class="flex gap-5 items-start group fade-in">
        <div class="w-16 h-12 shrink-0 bg-[#f1f5f9] rounded flex items-center justify-center text-[11px] font-black text-slate-500 group-hover:bg-[#e2e8f0] transition-colors">IDEA</div>
        <div>
          <div class="text-[10px] font-bold text-gray-300 mb-1 tracking-wider">${date}</div>
          <h4 class="text-[13px] font-black text-gray-800 group-hover:text-[#ed5b8c] transition-colors line-clamp-2 leading-snug">${title}</h4>
        </div>
      </a>`;
  }).join('\n');

  // メインのコラムコンテナを置換
  html = html.replace(
    /<div id="main-columns-container"[^>]*>[\s\S]*?<\/div>(?=\s*<div class="lg:col-span-4)/,
    `<div id="main-columns-container" class="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-10">\n${mainHtml || '<p class="col-span-full text-center text-gray-400 py-10">コラムは現在準備中です。</p>'}\n</div>`
  );

  // サイドのコラムコンテナを置換
  html = html.replace(
    /<div id="side-columns-container"[^>]*>[\s\S]*?<\/div>(?=\s*<div class="mt-auto")/,
    `<div id="side-columns-container" class="space-y-8 mb-12">\n${sideHtml}\n</div>`
  );

  try {
    fs.writeFileSync(WHATIS_HTML_PATH, html);
    console.log(`whatissmrtboard.html の静的生成が完了しました (注入: ${validArticles.length}件)。`);
  } catch (err) {
    console.error('whatissmrtboard.html の書き込みに失敗しました:', err);
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
    // コラムが無くても、お知らせは独立して生成する
    await buildInformationJson();
    return;
  }

  // 4. 内部リンク自動生成のためのキーワードインデックスを構築
  console.log('内部リンク用のキーワードインデックスを構築中...');
  const keywordIndex = buildKeywordIndex(publishedArticles);
  console.log(`  → ${keywordIndex.size} 個のキーワードを登録`);
  if (keywordIndex.size > 0) {
    const sample = Array.from(keywordIndex.keys()).slice(0, 8).join(', ');
    console.log(`  → サンプル: ${sample}${keywordIndex.size > 8 ? '...' : ''}`);
  }

  // 5. 各記事の静的HTMLを生成
  console.log('各記事の静的HTMLを生成中...');
  const summaryList = [];
  let totalInternalLinksAdded = 0;

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

    const rawTitle = article.title || '無題のコラム';
    // <title>タグやmeta属性に使う形式: <br>を空白に変換した上でHTMLエスケープ
    // これを怠るとダブルクオートを含むタイトルで og:title が途中で切れる重大バグになる
    const title = escapeHtml(`${rawTitle.replace(/<br\s*\/?>/gi, ' ')}｜Kokuban BASE`);
    const titlePlain = escapeHtml(rawTitle);
    const titleHtml = allowBrTags(rawTitle);

    const description = escapeHtml(
      article.description || extractDescription(article.body, 120)
    );

    const canonicalUrl = `${BASE_URL}/columns/${article.slug}/`;
    const ogImageUrl = article.eyecatch?.url
      ? `${article.eyecatch.url}?fit=crop&w=1200&h=630`
      : `${BASE_URL}/ogp.jpg`;

    // 日付の処理
    // - publishedAt: 公開日(常に存在)
    // - revisedAt: 手入力の更新日(任意。実質的な更新があった場合のみ編集者が入れる)
    // - updatedAt: microCMSの自動更新日(誤字修正でも動くため、SEO表示には使わない)
    const publishedAtISO = new Date(article.publishedAt).toISOString();
    const publishedAtFormatted = formatDateJST(article.publishedAt, 'long');

    // revisedAt が公開日と同じ日(または前)なら、更新日として扱わない
    let revisedAtISO = '';
    let revisedAtFormatted = '';
    let hasRevision = false;
    if (article.revisedAt) {
      const revDate = new Date(article.revisedAt);
      // 日付部分(YYYY-MM-DD)で比較。時刻の差は無視
      const pubDay = getJSTDateKey(article.publishedAt);
      const revDay = getJSTDateKey(article.revisedAt);
      if (revDay > pubDay) {
        hasRevision = true;
        revisedAtISO = revDate.toISOString();
        revisedAtFormatted = formatDateJST(article.revisedAt, 'long');
      }
    }

    // 構造化データ(Article schema)用の dateModified:
    // revisedAt があれば優先、なければ publishedAt と同じ
    // → microCMSの自動 updatedAt は意図的に使わない(SEO的に「軽微な修正で更新と誤認」を防ぐ)
    const dateModifiedISO = hasRevision ? revisedAtISO : publishedAtISO;

    // 後方互換性のため、updatedAtISO 変数も維持(テンプレが古い参照を持つ可能性に対応)
    const updatedAtISO = dateModifiedISO;

    // 画面表示用のHTML(template の {{REVISED_AT_BLOCK}} に埋め込む)
    // 更新日がある場合のみ要素を出力、ない場合は空文字
    const revisedAtBlockHtml = hasRevision
      ? `<span class="revised-at-block ml-3 inline-flex items-center text-gray-500 text-sm"><i class="fas fa-pen-to-square text-gray-300 mr-1.5"></i>更新日: <time datetime="${revisedAtISO}" class="ml-1">${revisedAtFormatted}</time></span>`
      : '';

    const eyecatchHtml = createEyecatchHtml(article.eyecatch, titlePlain);

    // 執筆者(ビルド時に確定)
    // microCMS の article.author フィールドの値をそのまま使う(画面・構造化データで一致)
    const rawAuthorName = article.author || 'Kokuban BASE 編集部';
    const authorName = escapeHtml(rawAuthorName);

    // 構造化データ用の author JSON を生成
    // 原則: microCMSに入力された値をそのまま name に使う(画面・JSONを完全一致)
    // AUTHORS にマッチした場合は Person 型で url や jobTitle を追加付与
    // マッチしない場合は Organization 型として扱う
    const matchedAuthor = AUTHORS.find(a =>
      a.matchKeys.some(key => rawAuthorName.includes(key))
    );

    let authorSchemaObj;
    if (matchedAuthor) {
      // 個人(Person 型): 入力値をそのまま name に使い、付加情報として URL や jobTitle を追加
      const profileUrl = `${BASE_URL}/team/${matchedAuthor.slug}/`;
      authorSchemaObj = {
        '@type': 'Person',
        name: rawAuthorName, // 画面表示と完全一致させる
        jobTitle: matchedAuthor.role,
        url: profileUrl,
        image: `${BASE_URL}${matchedAuthor.photoUrl}`,
        worksFor: {
          '@type': 'Organization',
          name: '株式会社idea spot',
          url: 'https://www.idea-spot.co.jp/',
        },
      };
    } else {
      // 編集部などのチーム名 (Organization 型)
      authorSchemaObj = {
        '@type': 'Organization',
        name: rawAuthorName,
        url: `${BASE_URL}/`,
      };
    }
    const authorSchemaJson = JSON.stringify(authorSchemaObj);

    // 関連記事HTML（ビルド時に確定。undefinedバグの根絶）
    const relatedPostsHtml = buildRelatedPostsHtml(article, publishedArticles);

    const encodedUrl = encodeURIComponent(canonicalUrl);
    const encodedTitle = encodeURIComponent(title);
    const shareUrlTwitter = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
    const shareUrlFacebook = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    const shareUrlLine = `https://social-plugins.line.me/lineit/share?url=${encodedUrl}&text=${encodedTitle}`;

    // 本文に内部リンクを自動挿入(自身の記事は除外)
    const bodyBeforeLinks = article.body || '';
    const bodyWithCards = await replaceManualInternalLinksWithCards(bodyBeforeLinks, article.slug, publishedArticles);
    const bodyWithLinks = injectInternalLinks(bodyWithCards, article.slug, keywordIndex, 3);
    const linksAdded = (bodyWithLinks.match(/class="internal-link"/g) || []).length;
    totalInternalLinksAdded += linksAdded;
    if (linksAdded > 0) {
      console.log(`  📎 ${article.slug}: ${linksAdded} 個の内部リンクを追加`);
    }

    // 目次を生成し、本文の h2/h3 に ID を付与
    const { tocHtml, bodyWithIds, headingCount } = buildTocAndAnnotate(bodyWithLinks);
    if (headingCount >= 2) {
      console.log(`  📑 ${article.slug}: ${headingCount} 個の見出しから目次生成`);
    }

    // 読了時間を計算
    const readingMinutes = calculateReadingTime(bodyBeforeLinks);
    const readingTimeHtml = `<span class="reading-time inline-flex items-center text-gray-500 text-sm ml-3"><i class="fas fa-clock text-gray-300 mr-1.5"></i>読了 約${readingMinutes}分</span>`;

    let articleHtml = templateHtml
      .replace(/\{\{TITLE\}\}/g, title)
      .replace(/\{\{TITLE_PLAIN\}\}/g, titlePlain)
      .replace(/\{\{TITLE_HTML\}\}/g, titleHtml)
      .replace(/\{\{DESCRIPTION\}\}/g, description)
      .replace(/\{\{CANONICAL_URL\}\}/g, canonicalUrl)
      .replace(/\{\{OG_IMAGE_URL\}\}/g, ogImageUrl)
      .replace(/\{\{PUBLISHED_AT_ISO\}\}/g, publishedAtISO)
      .replace(/\{\{UPDATED_AT_ISO\}\}/g, updatedAtISO)
      .replace(/\{\{DATE_MODIFIED_ISO\}\}/g, dateModifiedISO)
      .replace(/\{\{PUBLISHED_AT_FORMATTED\}\}/g, publishedAtFormatted)
      .replace(/\{\{REVISED_AT_BLOCK\}\}/g, revisedAtBlockHtml)
      .replace(/\{\{REVISED_AT_ISO\}\}/g, revisedAtISO)
      .replace(/\{\{REVISED_AT_FORMATTED\}\}/g, revisedAtFormatted)
      .replace(/\{\{READING_TIME_HTML\}\}/g, readingTimeHtml)
      .replace(/\{\{READING_MINUTES\}\}/g, String(readingMinutes))
      .replace(/\{\{TOC_HTML\}\}/g, tocHtml)
      .replace(/\{\{EYECATCH_HTML\}\}/g, eyecatchHtml)
      // 著者プレースホルダーはBODY_HTML置換より前に処理
      .replace(/\{\{AUTHOR\}\}/g, authorName)
      .replace(/\{\{author\}\}/g, authorName) // 旧テンプレ互換用
      .replace(/\{\{AUTHOR_SCHEMA_JSON\}\}/g, authorSchemaJson)
      .replace(/\{\{BODY_HTML\}\}/g, bodyWithIds)
      .replace(/\{\{SHARE_URL_TWITTER\}\}/g, shareUrlTwitter)
      .replace(/\{\{SHARE_URL_FACEBOOK\}\}/g, shareUrlFacebook)
      .replace(/\{\{SHARE_URL_LINE\}\}/g, shareUrlLine)
      .replace(/\{\{RELATED_POSTS_HTML\}\}/g, relatedPostsHtml)
      // microCMSの記事本文内に紛れ込んだ {{author}} / {{AUTHOR}} を最終クリーンアップ
      .replace(/\{\{AUTHOR\}\}/g, authorName)
      .replace(/\{\{author\}\}/g, authorName);

    // 検証: 未置換のプレースホルダーが残っていないか確認
    const unreplacedMatches = articleHtml.match(/\{\{[A-Za-z_]+\}\}/g);
    if (unreplacedMatches && unreplacedMatches.length > 0) {
      const unique = [...new Set(unreplacedMatches)];
      console.warn(`⚠️ 警告: ${article.slug} に未置換プレースホルダーが残存: ${unique.join(', ')}`);
    }

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
      revisedAt: hasRevision ? revisedAtISO : null,
      eyecatchUrl: article.eyecatch?.url || null,
      description: description,
      category: article.category || null,
    });
  }
  console.log(`合計 ${summaryList.length} 件の静的HTMLページを生成しました。`);
  console.log(`📎 内部リンク自動生成: 合計 ${totalInternalLinksAdded} 個のリンクを挿入しました。`);

  // 6. 一覧用JSON (index.json) を保存
  try {
    fs.writeFileSync(JSON_OUTPUT_PATH, JSON.stringify(summaryList, null, 2));
    console.log(`columns/index.json を ${JSON_OUTPUT_PATH} に保存しました。`);
  } catch (err) {
    console.error('columns/index.json の保存に失敗しました:', err);
  }

  // 7. サイトマップ (sitemap.xml) を生成・保存
  generateSitemap(publishedArticles);

  // 8. 記事一覧ページ (article.html) を静的生成
  await buildArticleListPage(publishedArticles);

  // 9. 「電子黒板って何ができるの？」ページ (whatissmrtboard.html) を静的生成
  await buildWhatisPage(publishedArticles);

  // 10. 執筆者ページを生成(E-E-A-T強化)
  buildAuthorPages(publishedArticles);

  // 11. 旧slugリダイレクトページを生成
  generateRedirectPages();

  // 12. お知らせ(information)JSONを生成
  await buildInformationJson();

  // 13. トップページの最新NEWS・コラム欄に初期HTMLを埋め込む
  //     (information/index.json 生成後に実行すること)
  buildHomepageStaticSections(summaryList);

  console.log('静的ページ生成プロセスが完了しました。');
}

// --- スクリプト実行 ---
buildStaticPages().catch(err => {
  console.error('ビルドプロセス全体でエラーが発生しました:', err);
  process.exit(1);
});
