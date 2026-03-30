import { copyFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

/**
 * GitHub Pages has no server fallback for SPA routes. Deep links like
 * /advisors-rebirth/advisors/feed 404 unless we serve the app shell.
 * GitHub uses 404.html for unknown paths; mirroring index.html fixes direct loads.
 */
function ghPagesSpaFallback() {
  return {
    name: 'gh-pages-spa-fallback',
    closeBundle() {
      const dist = resolve(__dirname, 'dist');
      copyFileSync(resolve(dist, 'index.html'), resolve(dist, '404.html'));
    },
  };
}

export default defineConfig({
  base: '/advisors-rebirth/',
  plugins: [react(), ghPagesSpaFallback()],
});
