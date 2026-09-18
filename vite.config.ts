import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

const DEV_HOST = '127.0.0.1'
const DEV_PORT = 5173

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiProxyTarget = env.VITE_API_PROXY_TARGET?.trim() || 'http://127.0.0.1/NeXora'

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
    // Evita WS 400 quando a página é aberta em localhost vs 127.0.0.1
    hmr: {
      protocol: 'ws',
      host: DEV_HOST,
      port: DEV_PORT,
      clientPort: DEV_PORT,
      path: '/vite-hmr',
    },
    // Dev: proxy /api → Apache do WAMP (http://127.0.0.1/NeXora) ou outro VITE_API_PROXY_TARGET
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
        secure: apiProxyTarget.startsWith('https://'),
        // localhost no Windows às vezes cai em IPv6 (::1) e o Apache recusa
        configure: (proxy) => {
          proxy.on('error', (err, _req, res) => {
            console.error('[vite] proxy /api error:', err.message)
            if (res && !res.headersSent && typeof res.writeHead === 'function') {
              res.writeHead(502, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({
                success: false,
                message: 'API WAMP inacessível. Confirme que o Apache está ligado e VITE_API_PROXY_TARGET aponta para http://127.0.0.1/NeXora',
              }))
            }
          })
        },
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
