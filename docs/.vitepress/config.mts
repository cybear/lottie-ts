import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'lottie-ts',
  description:
    'A TypeScript rewrite of lottie-web with tree-shakeable custom builds, modern toolchain, and full type safety.',
  base: '/lottie-ts/',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/lottie-ts/favicon.svg' }],
    ['meta', { name: 'theme-color', content: '#646cff' }],
  ],

  themeConfig: {
    logo: { src: '/lottie-ts/logo.svg', alt: 'lottie-ts' },
    siteTitle: 'lottie-ts',

    nav: [
      { text: 'Guide', link: '/guide/installation' },
      { text: 'API', link: '/guide/api' },
      { text: 'Migration', link: '/migration/from-lottie-web' },
      {
        text: 'v6.0.0',
        items: [
          { text: 'Changelog', link: 'https://github.com/bsod/lottie-ts/blob/main/CHANGELOG.md' },
          { text: 'lottie-web (upstream)', link: 'https://github.com/airbnb/lottie-web' },
        ],
      },
    ],

    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Installation', link: '/guide/installation' },
          { text: 'Getting Started', link: '/guide/getting-started' },
          { text: 'Renderers', link: '/guide/renderers' },
        ],
      },
      {
        text: 'Features',
        items: [
          { text: 'Custom Builds', link: '/guide/custom-builds' },
          { text: 'Expressions', link: '/guide/expressions' },
          { text: 'Events', link: '/guide/events' },
        ],
      },
      {
        text: 'API Reference',
        items: [{ text: 'lottie API', link: '/guide/api' }],
      },
      {
        text: 'Advanced',
        items: [
          { text: 'Composition Settings', link: '/advanced/composition-settings' },
          { text: 'Text Layers', link: '/advanced/text-layers' },
          { text: 'Performance', link: '/advanced/performance' },
        ],
      },
      {
        text: 'Migration',
        items: [{ text: 'From lottie-web v5', link: '/migration/from-lottie-web' }],
      },
    ],

    socialLinks: [{ icon: 'github', link: 'https://github.com/bsod/lottie-ts' }],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Based on lottie-web by Airbnb. lottie-ts maintained by bsod.',
    },

    search: { provider: 'local' },

    editLink: {
      pattern: 'https://github.com/bsod/lottie-ts/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
  },
});
