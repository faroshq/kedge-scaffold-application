import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The /api proxy is a LOCAL-development convenience only (run the api on
// another port: `PORT=8081 npm run dev` in ../api). On kedge the gateway
// routes /api/* to the api component before traffic reaches this server, in
// both development sandboxes and production, so this proxy never engages
// there. Browser code must always call /api/* relative to the current origin.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': process.env.KEDGE_LOCAL_API || 'http://localhost:8081',
    },
  },
})
