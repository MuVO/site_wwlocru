import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { writeFile } from 'node:fs/promises'

const siteDomain = process.env.VITE_SITE_DOMAIN
  ?.trim()
  .replace(/^https?:\/\//, '')
  .replace(/\/$/, '')
const siteOrigin = siteDomain ? `https://${siteDomain}` : 'https://muvo.github.io/site_wwlocru'

const domainFiles = () => ({
  name: 'site-domain-files',
  transformIndexHtml: {
    order: 'pre' as const,
    handler(html: string) {
      return html.replaceAll('%VITE_SITE_ORIGIN%', siteOrigin)
    },
  },
  async closeBundle() {
    const origin = siteOrigin
    await Promise.all([
      siteDomain
        ? writeFile('dist/CNAME', `${siteDomain}\n`)
        : import('node:fs/promises').then(({ rm }) => rm('dist/CNAME', { force: true })),
      writeFile('dist/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`),
      writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${origin}/</loc>\n  </url>\n</urlset>\n`),
    ])
  },
})

export default defineConfig({
  plugins: [react(), domainFiles()],
})
