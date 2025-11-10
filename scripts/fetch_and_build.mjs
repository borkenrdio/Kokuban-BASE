import { createClient } from 'microcms-js-sdk';
import fs from 'fs';
import path from 'path';

// --- 設定値 ---
const BASE_URL = 'https://kokuban-base.com'; // サイトのドメイン (末尾スラッシュなし)
const COLUMNS_DIR = path.resolve(process.cwd(), 'columns');
const TEMPLATE_PATH = path.resolve(COLUMNS_DIR, 'template.html');
const JSON_OUTPUT_PATH = path.resolve(COLUMNS_DIR, 'index.json');
const SITEMAP_OUTPUT_PATH = path.resolve(process.cwd(), 'sitemap.xml');
// const RSS_OUTPUT_PATH = path.resolve(process.cwd(), 'rss.xml'); // (任意)

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
 * @param {string} html - HTML文字列
 * @param {number} [maxLength=120] - 最大文字数
 * @returns {string} プレーンテキスト
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
 * 特殊文字をHTMLエンティティに変換 (JSON-LD用)
 * @param {string} str - 変換する文字列
 * @returns {string} 変換後の文字列
 */
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function(match) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[match];
    });
}

/**
 * アイキャッチ画像のHTMLを生成
 * @param {object} eyecatch - microCMSの画像オブジェクト
 * @param {string} alt - altテキスト
 * @returns {string} HTML文字列
 */
function createEyecatchHtml(eyecatch, alt) {
    if (!eyecatch || !eyecatch.url) {
        return ''; // アイキャッチがない場合は何も出力しない
    }
    // LCP対策とCLS防止のため、width/heightを明記
    // 16:9 (例: 1200x675) を想定
    const width = eyecatch.width || 1200;
    const height = eyecatch.height || 675;
    const altText = escapeHtml(alt);
    const optimizedUrl = `${eyecatch.url}?fit=crop&w=1200&h=675&q=80`; // 16:9でクロップ

    return `<img src="${optimizedUrl}" alt="${altText}" width="${width}" height="${height}" class="w-full h-auto object-cover rounded-lg mb-8 shadow-md" loading="eager" fetchpriority="high">`;
}

/**
 * 全記事を取得 (ページング対応)
 * @returns {Promise<Array<object>>} 記事データの配列
 */
async function fetchAllArticles() {
  console.log('microCMSから記事データを取得開始...');
  const allContents = [];
  let offset = 0;
  const limit = 50; // 1回あたりの取得件数
  const now = new Date().toISOString(); // ★★★ 修正点 ★★★ (現在時刻をISO形式で取得)

  try {
    while (true) {
      const response = await client.get({
        endpoint: 'news', // 'news' エンドポイントを使用
        queries: {
          fields: 'id,slug,title,body,eyecatch,publishedAt,updatedAt,description', // 必要なフィールドのみ取得
          limit: limit,
          offset: offset,
          orders: '-publishedAt', // 公開日が新しい順
          // ★★★ 修正点 ★★★
          // 1. microCMS側でステータスが 'published' のもののみを取得
          // 2. 'publishedAt' が (現在時刻) 以前のもののみを取得 (予約投稿を除外)
          filters: `publishedAt[less_than]${now}`
        }
      });

      if (response.contents.length === 0) {
        break; // 記事がもうない場合はループを抜ける
      }
      
      allContents.push(...response.contents);
      offset += response.contents.length;
      
      if (offset >= response.totalCount) {
        break; // 全件取得したらループを抜ける
      }
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
 * @param {Array<object>} articles - 記事データの配列
 */
function generateSitemap(articles) {
  console.log('sitemap.xml を生成中...');
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // 1. トップページ
  xml += `  <url>\n`;
  xml += `    <loc>${BASE_URL}/</loc>\n`;
  xml += `    <priority>1.0</priority>\n`;
  xml += `    <changefreq>daily</changefreq>\n`;
  xml += `  </url>\n`;

  // 2. 静的ページ (手動追加)
  const staticPages = ['contact.html', 'reservation.html', 'privacy.html'];
  staticPages.forEach(page => {
    xml += `  <url>\n`;
    xml += `    <loc>${BASE_URL}/${page}</loc>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += `    <changefreq>monthly</changefreq>\n`;
    xml += `  </url>\n`;
  });

  // 3. 記事ページ
  articles.forEach(article => {
    const url = `${BASE_URL}/columns/${article.slug}/`;
    const lastMod = new Date(article.updatedAt).toISOString().split('T')[0]; // YYYY-MM-DD
    xml += `  <url>\n`;
    xml += `    <loc>${url}</loc>\n`;
    xml += `    <lastmod>${lastMod}</lastmod>\n`;
    xml += `    <priority>0.6</priority>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `  </url>\n`;
  });

  xml += `</urlset>\n`;

  try {
    fs.writeFileSync(SITEMAP_OUTPUT_PATH, xml);
    console.log(`sitemap.xml を ${SITEMAP_OUTPUT_PATH} に保存しました。`);
  } catch (err) {
    console.error('sitemap.xml の保存に失敗しました:', err);
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
  const allArticles = await fetchAllArticles(); // この時点で公開済みの記事のみ取得される

  // 3. 公開中（publishedAtが設定されている）の記事のみフィルタリング
  // const now = new Date(); // ★★★ 修正点 (削除) ★★★
  // const publishedArticles = allArticles.filter( // ★★★ 修正点 (削除) ★★★
  //   article => article.publishedAt && new Date(article.publishedAt) <= now
  // );
  // ★★★ 修正点 ★★★ 
  // fetchAllArticles で既にフィルタリング済みのため、ここでは
  // 念のため publishedAt が null でないことだけを確認する (API側でフィルタしていれば不要だが安全のため)
  const publishedArticles = allArticles.filter(article => article.publishedAt);
  
  if (publishedArticles.length === 0) {
      console.warn('警告: 公開中の記事が見つかりませんでした。');
      // 空のJSONとサイトマップ（トップのみ）を生成
      fs.writeFileSync(JSON_OUTPUT_PATH, '[]');
      generateSitemap([]);
      return;
  }

  // 4. 各記事の静的HTMLを生成
  console.log('各記事の静的HTMLを生成中...');
  const summaryList = []; // index.json 用のサマリー配列

  for (const article of publishedArticles) {
    if (!article.slug) {
        console.warn(`警告: 記事ID ${article.id} にslugがありません。スキップします。`);
        continue;
    }

    const articleDir = path.resolve(COLUMNS_DIR, article.slug);
    const outputHtmlPath = path.resolve(articleDir, 'index.html');
    
    // ディレクトリが存在しない場合は作成
    if (!fs.existsSync(articleDir)) {
      fs.mkdirSync(articleDir, { recursive: true });
    }

    // --- プレースホルダー用のデータを準備 ---
    const title = `${article.title}｜Kokuban BASE`;
    const titlePlain = escapeHtml(article.title);
    
    // description: 記事のdescriptionフィールド、なければ本文から抽出
    const description = escapeHtml(
      article.description || extractDescription(article.body, 120)
    );
    
    const canonicalUrl = `${BASE_URL}/columns/${article.slug}/`;
    
    // OGP画像: アイキャッチ、なければデフォルトOGP画像
    const ogImageUrl = article.eyecatch?.url 
      ? `${article.eyecatch.url}?fit=crop&w=1200&h=630` // 1.91:1
      : `${BASE_URL}/ogp.jpg`;
      
    const publishedAtISO = new Date(article.publishedAt).toISOString();
    const updatedAtISO = new Date(article.updatedAt).toISOString();
    const publishedAtFormatted = new Date(article.publishedAt).toLocaleDateString('ja-JP', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    const eyecatchHtml = createEyecatchHtml(article.eyecatch, article.title);

    // SNSシェアURL
    const encodedUrl = encodeURIComponent(canonicalUrl);
    const encodedTitle = encodeURIComponent(title);
    const shareUrlTwitter = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
    const shareUrlFacebook = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    const shareUrlLine = `https://social-plugins.line.me/lineit/share?url=${encodedUrl}&text=${encodedTitle}`;

    // --- 雛形HTMLのプレースホルダーを置換 ---
    let articleHtml = templateHtml
      .replace(/{{TITLE}}/g, title)
      .replace(/{{TITLE_PLAIN}}/g, titlePlain)
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

    // --- 静的HTMLファイルとして保存 ---
    try {
      fs.writeFileSync(outputHtmlPath, articleHtml);
      // console.log(`  - ${outputHtmlPath} を生成しました。`);
    } catch (err) {
      console.error(`${outputHtmlPath} の保存に失敗しました:`, err);
    }
    
    // --- index.json 用のサマリーデータを追加 ---
    summaryList.push({
      id: article.id,
      slug: article.slug,
      title: article.title,
      publishedAt: article.publishedAt,
      eyecatchUrl: article.eyecatch?.url || null,
      description: description
      // (必要ならタグも追加: tags: article.tags || [])
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

  // 7. (任意) RSSフィードを生成・保存
  // generateRss(publishedArticles);
  
  console.log('静的ページ生成プロセスが完了しました。');
}

// --- スクリプト実行 ---
buildStaticPages().catch(err => {
    console.error('ビルドプロセス全体でエラーが発生しました:', err);
    process.exit(1);
});
