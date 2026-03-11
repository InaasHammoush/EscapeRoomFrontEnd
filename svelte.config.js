import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/vite-plugin-svelte').Options} */
const config = {
  preprocess: vitePreprocess(),
  compilerOptions: {
    customElement: true,
  },
};

export default config;
