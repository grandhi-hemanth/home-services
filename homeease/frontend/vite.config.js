import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The API (/api/*) is served by the Netlify Function in netlify/functions/api.ts.
// Run `netlify dev` locally to get the frontend and the API together.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
