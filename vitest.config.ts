import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom', include: ['src/tests/**/*.test.ts', 'src/tests/**/*.test.tsx'] },
  resolve: { alias: { '@': new URL('./src', import.meta.url).pathname } },
})
