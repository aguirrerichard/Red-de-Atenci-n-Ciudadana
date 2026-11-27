import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// En local, Vite hace de proxy igual que vercel.json en producción:
// el navegador solo habla con localhost:5173, así no hay problemas de CORS.
const destino = (url) => ({ target: url, changeOrigin: true, rewrite: (p) => p.replace(/^\/api\/[^/]+/, '/api') });

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/serenazgo': destino('https://s13-buendiaquispe-josephleonardo.onrender.com'),
      '/api/hospital': destino('https://hospital-backend-h077.onrender.com'),
      '/api/luz': destino('https://luzcentro-backend.onrender.com'),
      '/api/envios': destino('https://server-zpof.onrender.com'),
      '/api/integracion': destino(process.env.INTEGRACION_URL || 'http://localhost:4000'),
    },
  },
});
