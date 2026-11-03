import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/*'],
  format: ['esm'],
  dts: true,
  clean: true,
  minify: true,
  splitting: false,
  sourcemap: false,
  outDir: 'es',
  outExtension: () => ({
    js: '.js',
    dts: '.d.ts'
  })
})
