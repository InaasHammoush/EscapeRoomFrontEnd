import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// Backend ist über Caddy erreichbar (Port 80)
const API = "http://127.0.0.1";

export default defineConfig({
  plugins: [svelte({
    compilerOptions: {
        customElement: true,
      },
  }), react()],
  server: {
    proxy: {
      "/api": { target: API, changeOrigin: true },
      "/socket.io": { target: API, changeOrigin: true, ws: true },
    },
  },
});


