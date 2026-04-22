import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'icono.png', 'favicon.svg'],
      manifest: {
        name: 'KIMO',
        short_name: 'KIMO',
        description: 'Registra medicamentos, alimentación y cuida a tu mascota desde un solo lugar',
        start_url: '/',
        display: 'standalone',
        background_color: '#F2F2F7',
        theme_color: '#A8E6CF',
        orientation: 'portrait',
        lang: 'es',
        categories: ['health', 'lifestyle'],
        icons: [
          {
            src: '/icono.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icono.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Cache pages and assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
        navigateFallback: 'index.html',
        // Don't intercept Supabase API calls or public pet profiles
        navigateFallbackDenylist: [/^\/rest\//, /^\/auth\//, /^\/pet\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              networkTimeoutSeconds: 10,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
