import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Only public, canonical pages belong in the sitemap.
const routes = ['/', '/about', '/history', '/multiplayer', '/leaderboard', '/contact', '/privacy'];

const baseUrl = 'https://semantle.sigarya.xyz';
const distDir = path.resolve(__dirname, '../dist');
const sitemapPath = path.join(distDir, 'sitemap.xml');

console.log('🗺️  Generating sitemap.xml...');

// Generate sitemap XML
// Omit lastmod until reliable per-page modification dates are available.

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(route => `  <url>
    <loc>${baseUrl}${route}</loc>
  </url>`).join('\n')}
</urlset>`;

// Write sitemap to dist directory
fs.writeFileSync(sitemapPath, sitemapXml);

console.log(`✅ Sitemap generated: ${sitemapPath}`);
console.log(`📍 Added ${routes.length} URLs to sitemap`);

// Also update the public sitemap.xml for development
const publicSitemapPath = path.resolve(__dirname, '../public/sitemap.xml');
fs.writeFileSync(publicSitemapPath, sitemapXml);
console.log(`✅ Updated public sitemap: ${publicSitemapPath}`);