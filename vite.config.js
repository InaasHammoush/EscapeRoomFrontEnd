import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const API = "http://localhost:3000";

export default defineConfig({
  plugins: [react(), svelte()],
  server: {
    proxy: {
      "/api": { target: API, changeOrigin: true },
      "/socket.io": { target: API, changeOrigin: true, ws: true },
    },
  },
});
