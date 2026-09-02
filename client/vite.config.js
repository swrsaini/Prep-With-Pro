import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const serverUrl = env.SERVER_URL || 'http://localhost:5000';

  return {
    plugins: [react()],
    server: {
      host: 'localhost',
      port: 5173,
      strictPort: false,
      proxy: {
        '/api': {
          target: serverUrl,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      sourcemap: false,
      minify: 'esbuild',
      reportCompressedSize: false,
    },
    esbuild: {
      legalComments: 'none',
    },
  };
});
