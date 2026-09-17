import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

/**
 * onnxruntime-web (pulled in by @imgly/background-removal) emits its ~24 MB
 * wasm binaries as build assets, but the portrait processor loads wasm and
 * model files from `publicPath` (img.ly's CDN or VITE_PORTRAIT_ASSETS) at
 * run time. Dropping the emitted copies keeps `dist/` small enough to host
 * on an ESP32.
 */
function dropUnusedOrtWasm(): Plugin {
  return {
    name: 'bluestar:drop-unused-ort-wasm',
    generateBundle(_options, bundle) {
      for (const name of Object.keys(bundle)) {
        if (/ort-wasm.*\.wasm$/.test(name)) delete bundle[name]
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), dropUnusedOrtWasm()],
  build: {
    chunkSizeWarningLimit: 1200,
  },
})
