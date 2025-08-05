import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // 5174-тен 5173-ке өзгерту
    proxy: {
      "/api": {
        target: "https://qaragul-back.onrender.com",
        changeOrigin: true,
        secure: false,
      },
      "/uploads": {
        target: "https://qaragul-back.onrender.com",
        changeOrigin: true,
        secure: false,
      },
    },
  },
})