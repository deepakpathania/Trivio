import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load all env vars for this mode into `env`
  const env = loadEnv(mode, process.cwd(), '')

  // Pick proxy target or default to localhost
  const proxyTarget = env.VITE_API_BASE_URL || 'http://localhost:8787'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '/api'),
        }
      }
    },
    base: '/Trivio/'
  }
})
