import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          manifest: {
            name: 'Speech Eruption AR',
            short_name: 'SpeechAR',
            description:
              'An interactive word effect for school broadcasts using real-time face tracking and audio analysis.',
            theme_color: '#0f0f11',
            background_color: '#0f0f11',
            start_url: '/',
            display: 'standalone',
            lang: 'en',
            icons: [
              {
                src: '/pwa-icon-192.png',
                sizes: '192x192',
                type: 'image/png',
              },
              {
                src: '/pwa-icon-512.png',
                sizes: '512x512',
                type: 'image/png',
              },
              {
                src: '/pwa-icon-1024.png',
                sizes: '1024x1024',
                type: 'image/png',
                purpose: 'any maskable',
              },
              {
                src: '/apple-touch-icon.png',
                sizes: '180x180',
                type: 'image/png',
                purpose: 'any',
              },
            ],
          },
        }),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
