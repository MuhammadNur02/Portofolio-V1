import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // three.js alone is ~500 KB; it is lazy-loaded after first paint, so the default warning is noise.
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // Long-lived vendor chunks: a content change redeploys only the small app chunks,
        // and returning visitors keep React / Motion cached. (Supabase is left to Rollup: it is only
        // reached through dynamic imports, so it loads after the first paint in its own async chunk.)
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom', 'react-helmet-async'],
          motion: ['framer-motion', 'lenis'],
        },
      },
    },
  },
})
