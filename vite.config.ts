import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue', 'vue-router', '@vueuse/core'],
          'charts': ['echarts', 'vue-echarts'],
          'ui': ['lucide-vue-next', 'date-fns']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
