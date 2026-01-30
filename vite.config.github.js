// Remplacez "skyreks00" et "permis-online-free" par votre nom d'utilisateur et nom de repo si besoin
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/permis-online-free/',
});
