import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

const DEV_HOST = '127.0.0.1'
const DEV_PORT = 5173

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiProxyTarget = env.VITE_API_PROXY_TARGET?.trim() || 'http://localhost/NeXora'

  return {
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  server: {
    host: DEV_HOST,
    port: DEV_PORT,
    strictPort: true,
    open: `http://${DEV_HOST}:${DEV_PORT}`,
    hmr: {
      host: DEV_HOST,
      port: DEV_PORT,
      clientPort: DEV_PORT,
    },
    // Dev: proxy /api → Apache do WAMP (http://localhost/NeXora) ou outro VITE_API_PROXY_TARGET
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
        secure: apiProxyTarget.startsWith('https://'),
      },
    },
  },

  preview: {
    host: DEV_HOST,
    port: DEV_PORT,
    strictPort: true,
  },
  }
})
