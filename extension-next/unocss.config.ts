import { defineConfig } from 'unocss/vite'
import { presetWind, presetIcons, presetUno, transformerDirectives } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetWind(),
    presetIcons()
  ],
  transformers: [
    transformerDirectives(),
  ],
})
