import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Chaque page est chargée à la demande (React.lazy dans App.jsx) :
// un visiteur sur mobile ne télécharge jamais l'espace administrateur.
// En développement, les appels /api sont envoyés au serveur Node (npm run dev:api).
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { '/api': 'http://localhost:3000' },
  },
  build: {
    target: 'es2019',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
});
