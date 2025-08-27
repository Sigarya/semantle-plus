import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  base: '',
  server: { host: "::", port: 8080 },
  preview: { historyApiFallback: true },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    VitePWA({
      registerType: 'prompt',
      
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,gif,webp,woff,woff2,ttf}'],
        runtimeCaching: [
          { urlPattern: /^https:\/\/ciuhkkmuvqoepohihofs\.supabase\.co\/rest\/v1\/.*/i, handler: 'NetworkFirst', options: { cacheName: 'supabase-api-cache', networkTimeoutSeconds: 10, expiration: { maxEntries: 100, maxAgeSeconds: 86400 } } },
          { urlPattern: /^https:\/\/ciuhkkmuvqoepohihofs\.supabase\.co\/functions\/v1\/.*/i, handler: 'NetworkFirst', options: { cacheName: 'supabase-functions-cache', networkTimeoutSeconds: 15, expiration: { maxEntries: 50, maxAgeSeconds: 7200 } } },
          { urlPattern: /^https:\/\/.*\.onrender\.com\/.*/i, handler: 'NetworkFirst', options: { cacheName: 'external-api-cache', networkTimeoutSeconds: 20, expiration: { maxEntries: 200, maxAgeSeconds: 604800 } } },
          { urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i, handler: 'CacheFirst', options: { cacheName: 'google-fonts-stylesheets', expiration: { maxEntries: 10, maxAgeSeconds: 31536000 } } },
          { urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i, handler: 'CacheFirst', options: { cacheName: 'google-fonts-webfonts', expiration: { maxEntries: 30, maxAgeSeconds: 31536000 } } },
          { urlPattern: /^https:\/\/ciuhkkmuvqoepohihofs\.supabase\.co\/storage\/.*/i, handler: 'CacheFirst', options: { cacheName: 'supabase-images', expiration: { maxEntries: 50, maxAgeSeconds: 2592000 } } }
        ],
        ignoreURLParametersMatching: [/^utm_/, /^fbclid$/]
      },

      includeAssets: ['favicon.ico', 'robots.txt', 'sitemap.xml'],
      manifest: {
        name: 'סמנטעל פלוס',
        short_name: 'סמנטעל+',
        description: 'פתרתם את המילה של היום? בסמנטעל פלוס אפשר לשחק גם בכל המילים הקודמות בלי לחכות למחר.',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        orientation: 'portrait',
        lang: 'he',
        dir: 'rtl',
        icons: [
          // your icons
        ]
      }
    })
  ].filter(Boolean),
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  build: { /* your build config */ }
}));