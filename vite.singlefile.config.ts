import { viteSingleFile } from 'vite-plugin-singlefile'
import { defineConfig, mergeConfig } from 'vite'
import base from './vite.config'

/**
 * One self-contained index.html (all JS and CSS inlined) for hosts that take
 * a single file. Only scripts and styles are inlined; ONNX wasm and model
 * files are never bundled and load from img.ly's CDN at run time.
 */
export default mergeConfig(
  base,
  defineConfig({
    plugins: [viteSingleFile({ useRecommendedBuildConfig: false, inlinePattern: ['**/*.js', '**/*.css'], removeViteModuleLoader: true })],
    build: {
      outDir: 'dist-single',
      emptyOutDir: true,
      cssCodeSplit: false,
      assetsInlineLimit: 0,
      rollupOptions: { output: { inlineDynamicImports: true } },
    },
  }),
)
