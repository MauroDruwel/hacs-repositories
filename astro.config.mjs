import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'

// https://astro.build/config
export default defineConfig({
  site: 'https://hugogresse.github.io',
  base: process.env.BASE_PATH || '/',
  trailingSlash: 'never',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
})
