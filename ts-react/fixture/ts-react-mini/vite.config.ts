/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The dev server proxies /api to the fleet service so the SPA and the backend
// share an origin in development; in production the ingress does the same.
const apiTarget = process.env['VITE_API_TARGET'] ?? 'http://localhost:8080'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  test: {
    environment: 'happy-dom',
    environmentOptions: { happyDOM: { url: 'http://localhost:5173/' } },
    globals: false,
    setupFiles: ['src/test-utils/setup.ts'],
    include: ['src/**/*.test.ts?(x)'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      exclude: ['src/test-utils/**', 'src/**/*.test.ts?(x)', 'src/main.tsx']
    }
  }
})
