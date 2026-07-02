/**
 * Tailwind CSS (v3) build config for Kokuban BASE.
 *
 * 目的: 開発用の Tailwind Play CDN (https://cdn.tailwindcss.com) を廃し、
 * 各ページで実際に使用しているクラスのみを含む静的CSS (assets/tw.min.css) を生成する。
 * CDN と見た目を一致させるため v3 系でビルドし、Preflight (base) も維持する。
 *
 * カスタム設定: 各HTMLのインライン tailwind.config はすべて
 *   theme.extend.colors.customBlue = '#103f99'
 * のみ。ここに集約している。
 *
 * ビルド: npx tailwindcss@3 -i input.css -o assets/tw.min.css --minify
 */
module.exports = {
  content: [
    './columns/**/*.html',
    './Kokubanlease/**/*.html',
    './article/**/*.html',
    './reservation/**/*.html',
    './on-line-reservation/**/*.html',
    './privacy/**/*.html',
    './team/**/*.html',
  ],
  theme: {
    extend: {
      colors: {
        customBlue: '#103f99',
      },
    },
  },
};
