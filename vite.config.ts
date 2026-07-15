import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (id.includes('@xyflow/react') || id.includes('reactflow')) {
            return 'xyflow'
          }

          if (id.includes('react') || id.includes('scheduler')) {
            return 'react-vendor'
          }

          if (id.includes('dagre') || id.includes('jszip') || id.includes('html-to-image')) {
            return 'app-vendor'
          }

          return 'vendor'
        },
      },
    },
  },
})
