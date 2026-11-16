import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFile, writeFile } from 'node:fs/promises'

const siteDomain = process.env.VITE_SITE_DOMAIN
  ?.trim()
  .replace(/^https?:\/\//, '')
  .replace(/\/$/, '')
const siteOrigin = siteDomain ? `https://${siteDomain}` : 'https://muvo.github.io/site_wwlocru'

const domainFiles = () => ({
  name: 'site-domain-files',
  transformIndexHtml: {
    order: 'pre' as const,
    handler(html: string, context: { server?: unknown }) {
      let result = html.replaceAll('__WWLOC_SITE_ORIGIN__', siteOrigin)
      if (context.server) {
        result = result
          .replace(
            /<!-- Yandex\.Metrika counter -->[\s\S]*?<!-- \/Yandex\.Metrika counter -->/,
            ''
          )
          .replace(/<noscript>[\s\S]*?<\/noscript>/, '')
      }
      return result
    },
  },
  async closeBundle() {
    const origin = siteOrigin
    await Promise.all([
      copyFile('dist/index.html', 'dist/404.html'),
      siteDomain
        ? writeFile('dist/CNAME', `${siteDomain}\n`)
        : import('node:fs/promises').then(({ rm }) => rm('dist/CNAME', { force: true })),
      writeFile('dist/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`),
      writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n  <url>\n    <loc>${origin}/</loc>\n    <xhtml:link rel="alternate" hreflang="ru" href="${origin}/" />\n    <xhtml:link rel="alternate" hreflang="en" href="${origin}/en/" />\n    <xhtml:link rel="alternate" hreflang="x-default" href="${origin}/" />\n  </url>\n  <url>\n    <loc>${origin}/en/</loc>\n    <xhtml:link rel="alternate" hreflang="ru" href="${origin}/" />\n    <xhtml:link rel="alternate" hreflang="en" href="${origin}/en/" />\n    <xhtml:link rel="alternate" hreflang="x-default" href="${origin}/" />\n  </url>\n</urlset>\n`),
    ])
  },
})

export default defineConfig({
  plugins: [react(), domainFiles()],
})
