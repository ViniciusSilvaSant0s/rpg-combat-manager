import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    watch: {
      usePolling: true,
      interval: 1000,
    },
    proxy: {
      '/api': {
        target: 'http://server:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  test: {
    environment: 'jsdom',
    include: ['./src/App.test.tsx', './src/Navigation.test.tsx', './src/AuthScreen.test.tsx', './src/SavedCombatantsScreen.test.tsx', './src/FriendsScreen.test.tsx', './src/SavedCombatsScreen.test.tsx', './src/AuthenticatedNavigation.test.tsx', './src/services.test.ts'],
    setupFiles: './src/test/setup.ts',
  },
})
