import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@glan-getaway/shared-auth': path.resolve(__dirname, '../packages/shared/auth'),
    },
  },
  server: {
    port: 5174,
    strictPort: true,
  },
  // Removed proxy since we're making direct requests to backend
});
