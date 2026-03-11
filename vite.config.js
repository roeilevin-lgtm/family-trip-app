import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Family Trip Planner',
        short_name: 'TripPlanner',
        description: 'אפליקציית ניהול הטיולים המשפחתית שלנו',
        theme_color: '#4f46e5',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        icons: [
          {
            src: '[https://cdn-icons-png.flaticon.com/512/825/825515.png](https://cdn-icons-png.flaticon.com/512/825/825515.png)',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/drive\.google\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'drive-images-cache', expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 7 } }
          },
          {
            urlPattern: /^https:\/\/open\.er-api\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'fx-cache', expiration: { maxEntries: 1, maxAgeSeconds: 60 * 60 * 24 } }
          }
        ]
      }
    })
  ],
});
