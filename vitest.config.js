/// <reference types="vitest" />
import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    deps: {
      external: ['**/node_modules/**', '**/dist/**', '**/src/**'],
    },
    maxConcurrency: 100,
    maxThreads: 15
  },
  target: 'node'
})
