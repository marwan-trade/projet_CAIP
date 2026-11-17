import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Chaque page est chargée à la demande (React.lazy dans App.jsx) :
// un visiteur sur mobile ne télécharge jamais l'espace administrateur.
export default defineConfig({
  plugins: [react()],
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
