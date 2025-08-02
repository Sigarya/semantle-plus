import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define your routes and their metadata
const routes = [
  {
    path: '/',
    priority: '1.0',
    changefreq: 'daily'
  },
  {
    path: '/about',
    priority: '0.8',
    changefreq: 'monthly'
  },
  {
    path: '/history',
    priority: '0.6',
    changefreq: 'weekly'
  },
  {
    path: '/profile',
    priority: '0.5',
    changefreq: 'monthly'
  },
  {
    path: '/leaderboard',
    priority: '0.7',
    changefreq: 'daily'
  }
  // Note: Excluding /admin from sitemap as it's typically not meant for public indexing
];

const baseUrl = 'https://semantle.sigarya.xyz';
const distDir = path.resolve(__dirname, '../dist');
const sitemapPath = path.join(distDir, 'sitemap.xml');

console.log('🗺️  Generating sitemap.xml...');

// Generate sitemap XML
const currentDate = new Date().toISOString().split('T')[0];

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(route => `  <url>
    <loc>${baseUrl}${route.path}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
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