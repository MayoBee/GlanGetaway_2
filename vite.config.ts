import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "./src/shared"),
      "@shared/auth": path.resolve(__dirname, "./src/shared/auth"),
      "@shared/types": path.resolve(__dirname, "./src/shared/types"),
      "@shared/ui": path.resolve(__dirname, "./src/shared/ui"),
      "@shared/components": path.resolve(__dirname, "./src/shared/components"),
      "@shared/hooks": path.resolve(__dirname, "./src/shared/hooks"),
      "@shared/config": path.resolve(__dirname, "./src/shared/config"),
      "@shared/forms": path.resolve(__dirname, "./src/shared/forms"),
      "@shared/utils": path.resolve(__dirname, "./src/shared/utils"),
      "@shared/lib": path.resolve(__dirname, "./src/shared/lib"),
    },
  },
  build: {
    outDir: "out"
  },
  server: {
    port: 5174,
    strictPort: true,
  },
  // Removed proxy since we're making direct requests to backend
});
