import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), cloudflare()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('three') || id.includes('@react-three')) return 'vendor-three';
          if (id.includes('framer-motion') || id.includes('lucide-react') || id.includes('lenis')) return 'vendor-ui';
          if (id.includes('@supabase') || id.includes('date-fns')) return 'vendor-utils';
        },
      },
    },
  },
})