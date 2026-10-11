import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base so the same build works on GitHub Pages (sub-path) and inside the
// Capacitor native shell (file-based).
export default defineConfig({
  base: './',
  plugins: [react()],
});
