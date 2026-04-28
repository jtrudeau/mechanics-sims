import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Replit always sets REPL_ID — use it to switch server config automatically
const onReplit = !!process.env.REPL_ID;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    host: onReplit ? '0.0.0.0' : 'localhost',
    port: onReplit ? 5000 : 5173,
    ...(onReplit && { allowedHosts: true }),
  },
})
