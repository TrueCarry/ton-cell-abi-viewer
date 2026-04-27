import { defineConfig } from 'vitest/config'
import solid from 'vite-plugin-solid'

export default defineConfig({
  plugins: [solid()],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
    restoreMocks: true,
  },
})
