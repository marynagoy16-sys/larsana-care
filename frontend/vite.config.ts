import path from 'path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Capacitor precisa de caminhos relativos; na Vercel o SPA usa rotas profundas
  // (/login, /paciente/...), então o base absoluto evita 404 nos assets no refresh.
  base: process.env.VERCEL ? '/' : './',
  plugins: [react(), tailwindcss()],
  envDir: path.resolve(__dirname, '..'),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
