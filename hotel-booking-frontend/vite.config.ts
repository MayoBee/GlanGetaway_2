import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "../packages/shared"),
      "../shared": path.resolve(__dirname, "../shared"),
    },
  },
  server: {
    port: 5174,
    host: '127.0.0.1',
    hmr: {
      overlay: false
    }
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].js?v=${Date.now()}`,
        chunkFileNames: `assets/[name].js?v=${Date.now()}`,
        assetFileNames: `assets/[name].[ext]?v=${Date.now()}`
      }
    }
  },
  // Removed proxy since we're making direct requests to backend
});
