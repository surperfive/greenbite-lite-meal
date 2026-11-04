/**
 * 只用于量「谁占了多少字节」的临时构建配置，不参与项目构建。
 * 用法：node node_modules/vite/bin/vite.js build --config vite.measure.config.ts
 */
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
  build: {
    outDir: 'dist-measure',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return 'app';
          if (/node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'react';
          if (/node_modules[\\/]motion[\\/]|node_modules[\\/]framer-motion[\\/]|node_modules[\\/]motion-dom|node_modules[\\/]motion-utils/.test(id))
            return 'motion';
          if (/node_modules[\\/]lucide-react[\\/]/.test(id)) return 'lucide';
          return 'vendor';
        },
      },
    },
  },
});
