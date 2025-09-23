import { defineConfig } from 'vite'
import checker from 'vite-plugin-checker'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  server: { open: true },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: true,
    assetsDir: 'assets'
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  plugins: [
    checker({
      typescript: true,
      eslint: { lintCommand: 'eslint . --ext .ts,.tsx' }
    })
  ],
  css: {
    preprocessorOptions: {
      scss: {
        // make global variables/mixins available everywhere
        // additionalData: `@use "@/styles/_tokens.scss" as *;`
      }
    }
  }
})
