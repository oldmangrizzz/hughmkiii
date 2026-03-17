import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: false, // Served from public/manifest.webmanifest
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,mp4}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.mapbox\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'mapbox-api',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 }
            }
          },
          {
            urlPattern: /^https:\/\/events\.mapbox\.com\/.*/i,
            handler: 'NetworkOnly'
          }
        ]
      }
    })
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    // Proxy LFM inference through Vite so the phone browser can reach the
    // SSH-tunneled LFM engine (127.0.0.1:8081) via the NetBird interface.
    proxy: {
      '/v1': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        rewrite: (path) => path // pass /v1/... as-is to LFM
      }
    },
    fs: {
      // Allow imports that resolve above omni-canvas/ root (convex/_generated)
      allow: ['..']
    }
  }
})
