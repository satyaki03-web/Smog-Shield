import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      // Copies src/assets into dist/ so root-relative URLs like
      // "/src/assets/images/..." (e.g. generate_image output) still resolve
      // in production builds. Do not remove.
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          const srcAssets = path.resolve(__dirname, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, {recursive: true, force: true});
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // Disable HMR and dev WebSocket in AI Studio / Cloud Run preview proxy environments
      // to prevent @vite/client reconnect loops and unhandled WebSocket rejections.
      hmr: process.env.DISABLE_HMR === 'true' || Boolean(process.env.K_SERVICE) ? false : true,
      ws: process.env.DISABLE_HMR === 'true' || Boolean(process.env.K_SERVICE) ? (false as const) : undefined,
      watch: process.env.DISABLE_HMR === 'true' || Boolean(process.env.K_SERVICE) ? null : {},
    },
  };
});
