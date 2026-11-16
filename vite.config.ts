import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

const siteDomain = process.env.VITE_SITE_DOMAIN
  ?.trim()
  .replace(/^https?:\/\//, '')
  .replace(/\/$/, '')
const siteOrigin = siteDomain ? `https://${siteDomain}` : 'https://muvo.github.io/site_wwlocru'

const englishTitle = 'WWLOC — Maidenhead QTH Locator Map'
const englishDescription =
  'Find a Maidenhead QTH locator on the map, look up a locator from coordinates, and measure distances between amateur radio stations.'

function createEnglishIndex(html: string, origin: string): string {
  return html
    .replace('<html lang="ru">', '<html lang="en">')
    .replace(
      /<meta name="description" content="[^"]*" \/>/,
      `<meta name="description" content="${englishDescription}" />`
    )
    .replace(
      /<meta property="og:title" content="[^"]*" \/>/,
      `<meta property="og:title" content="${englishTitle}" />`
    )
    .replace(
      /<meta property="og:description" content="[^"]*" \/>/,
      `<meta property="og:description" content="${englishDescription}" />`
    )
    .replace(
      `<link rel="canonical" href="${origin}/" />`,
      `<link rel="canonical" href="${origin}/en/" />`
    )
    .replace(
      `<meta property="og:url" content="${origin}/" />`,
      `<meta property="og:url" content="${origin}/en/" />`
    )
    .replace(
      '<meta property="og:locale" content="ru_RU" />',
      '<meta property="og:locale" content="en_US" />'
    )
    .replace(
      '<meta property="og:locale:alternate" content="en_US" />',
      '<meta property="og:locale:alternate" content="ru_RU" />'
    )
    .replace(
      /<meta name="twitter:title" content="[^"]*" \/>/,
      `<meta name="twitter:title" content="${englishTitle}" />`
    )
    .replace(
      /<meta name="twitter:description" content="[^"]*" \/>/,
      `<meta name="twitter:description" content="${englishDescription}" />`
    )
    .replace(
      /<title>[^<]*<\/title>/,
      `<title>${englishTitle}</title>`
    )
}

function createSitemap(origin: string): string {
  const languages = [
    ['ru', `${origin}/`],
    ['en', `${origin}/en/`],
    ['x-default', `${origin}/`]
  ] as const
  const alternates = languages
    .map(
      ([language, url]) =>
        `    <xhtml:link rel="alternate" hreflang="${language}" href="${url}" />`
    )
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>${origin}/</loc>
${alternates}
  </url>
  <url>
    <loc>${origin}/en/</loc>
${alternates}
  </url>
</urlset>
`
}

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
    const indexHtml = await readFile('dist/index.html', 'utf8')
    const notFoundHtml = indexHtml.replace(
      'content="index, follow, max-image-preview:large"',
      'content="noindex, follow"'
    )
    await mkdir('dist/en', { recursive: true })
    await Promise.all([
      writeFile('dist/404.html', notFoundHtml),
      writeFile('dist/en/index.html', createEnglishIndex(indexHtml, origin)),
      siteDomain
        ? writeFile('dist/CNAME', `${siteDomain}\n`)
        : import('node:fs/promises').then(({ rm }) => rm('dist/CNAME', { force: true })),
      writeFile('dist/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`),
      writeFile('dist/sitemap.xml', createSitemap(origin)),
    ])
  },
})

export default defineConfig({
  plugins: [react(), domainFiles()],
})
