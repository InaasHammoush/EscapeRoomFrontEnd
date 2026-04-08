import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_PROXY_TARGET || 'http://127.0.0.1:3000';

  return {
    plugins: [
      svelte({
        compilerOptions: {
          customElement: true,
        },
      }),
      react(),
    ],
    server: {
      proxy: {
        '/api': { target: apiTarget, changeOrigin: true },
        '/socket.io': { target: apiTarget, changeOrigin: true, ws: true },
      },
    },
  };
});
