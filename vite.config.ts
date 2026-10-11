import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Absolute base: pages live at real paths (/letter-tracing-worksheets/a/), so assets must
// resolve from the site root. The Capacitor shell also serves the app from its root.
export default defineConfig({
  base: '/',
  plugins: [react()],
});
