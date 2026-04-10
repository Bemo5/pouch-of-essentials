import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Deployed at https://bemo5.github.io/pouch-of-essentials/
// Override with VITE_BASE env for custom domain or forks.
const base = process.env.VITE_BASE || '/pouch-of-essentials/';

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    host: true,
    port: 5173
  }
});
