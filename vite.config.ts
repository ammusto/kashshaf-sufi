import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import packageJson from './package.json'

export default defineConfig({
  plugins: [react(), svgr()],
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    target: ['es2021', 'chrome100', 'safari13'],
    minify: 'esbuild',
    outDir: 'dist',
  },
  define: {
    'import.meta.env.VITE_TARGET': JSON.stringify('web'),
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(packageJson.version),
  },
})
