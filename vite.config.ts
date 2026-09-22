import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const appRoot = path.dirname(fileURLToPath(import.meta.url))

// Replit always sets REPL_ID — use it to switch server config automatically
const onReplit = !!process.env.REPL_ID;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  server: {
    host: onReplit ? '0.0.0.0' : 'localhost',
    port: onReplit ? 5000 : 5173,
    ...(onReplit && { allowedHosts: true }),
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.tsx'],
    alias: [
      { find: /^react-dom/, replacement: path.join(appRoot, 'node_modules/react-dom') },
      { find: /^react$/, replacement: path.join(appRoot, 'node_modules/react') },
    ],
    server: {
      deps: {
        inline: ['react', 'react-dom', '@testing-library/react', 'react-router', 'react-router-dom'],
      },
    },
  },
})
