import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // <-- Shu qatorni qo'shdik

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})