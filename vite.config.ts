import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  base: '',
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    VitePWA({
      // ✨ THIS IS THE KEY CHANGE! ✨
      // We are switching from 'autoUpdate' to 'prompt'.
      // This tells the PWA to notify our app when an update is ready,
      // so we can ask the user before reloading.
      registerType: 'prompt', 

      // Everything below this line is your excellent existing configuration,
      // which we are keeping exactly as is!
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
          {
            src: 'https://ciuhkkmuvqoepohihofs.supabase.co/storage/v1/object/public/icon//favicon.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'https://ciuhkkmuvqoepohihofs.supabase.co/storage/v1/object/public/icon//favicon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,gif,webp,woff,woff2,ttf}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/ciuhkkmuvqoepohihofs\.supabase\.co\/rest\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'supabase-api-cache', networkTimeoutSeconds: 10, expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 } }
          },
          {
            urlPattern: /^https:\/\/ciuhkkmuvqoepohihofs\.supabase\.co\/functions\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'supabase-functions-cache', networkTimeoutSeconds: 15, expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 2 } }
          },
          {
            urlPattern: /^https:\/\/.*\.onrender\.com\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'external-api-cache', networkTimeoutSeconds: 20, expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 } }
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-stylesheets', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-webfonts', expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 } }
          },
          {
            urlPattern: /^https:\/\/ciuhkkmuvqoepohihofs\.supabase\.co\/storage\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'supabase-images', expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 } }
          }
        ],
        ignoreURLParametersMatching: [/^utm_/, /^fbclid$/]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    target: 'esnext',
    minify: 'terser',
    sourcemap: mode === 'development',
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[hash][extname]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js',
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-toast', '@radix-ui/react-tabs'],
          utils: ['date-fns', 'clsx', 'tailwind-merge']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
}));