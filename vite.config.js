import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// ============================== STAGING / PRODUKCIA ==============================
// Rovnaká konvencia ako PRIMA RE SERVICE a PRIMA TOOLS: Cloudflare Workers Builds
// nastaví WORKERS_CI_BRANCH; produkcia je LEN pri 'main', čokoľvek iné je staging.
// Kým nie sú vyplnené Supabase údaje, appka beží v DEMO režime (dáta v prehliadači).
const CI_BRANCH = process.env.WORKERS_CI_BRANCH || '';
const IS_STAGING_BUILD = CI_BRANCH !== 'main';

const SUPABASE_CONFIG = IS_STAGING_BUILD
  ? { env: 'staging',    url: process.env.VITE_SUPABASE_URL_STAGING || '', anonKey: process.env.VITE_SUPABASE_ANON_KEY_STAGING || '' }
  : { env: 'production', url: process.env.VITE_SUPABASE_URL || '',         anonKey: process.env.VITE_SUPABASE_ANON_KEY || '' };

console.log(`[build] WORKERS_CI_BRANCH="${CI_BRANCH}" → ${SUPABASE_CONFIG.env}${SUPABASE_CONFIG.url ? '' : ' (DEMO — bez Supabase)'}`);

export default defineConfig({
  define: {
    'import.meta.env.VITE_APP_ENV': JSON.stringify(SUPABASE_CONFIG.env),
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(SUPABASE_CONFIG.url),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(SUPABASE_CONFIG.anonKey),
    'import.meta.env.VITE_VAPID_PUBLIC_KEY': JSON.stringify(process.env.VITE_VAPID_PUBLIC_KEY || ''),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png', 'favicon-32.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'PRIMA SECOND HOME',
        short_name: 'PRIMA Home',
        description: 'PRIMA SECOND HOME — everything about your stay in PRIMA buildings',
        theme_color: '#BD2435',
        background_color: '#FFFFFF',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        lang: 'en',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*$/,
            handler: 'NetworkFirst',
            options: { cacheName: 'supabase-api', networkTimeoutSeconds: 5,
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 2 },
              cacheableResponse: { statuses: [0, 200] } },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*$/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'fonts', expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 90 } },
          },
        ],
      },
    }),
  ],
  build: { target: 'es2020', sourcemap: false, chunkSizeWarningLimit: 800 },
  server: { port: 5174, host: true },
});
