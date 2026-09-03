import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    // Target modern browsers for smaller output
    target: "es2020",
    // Enable chunk splitting for better caching
    rollupOptions: {
      output: {
        // Split vendor libs into separate chunks for better CDN caching
        manualChunks: {
          "vendor-react": ["react", "react-dom"],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-icons": ["lucide-react"],
        },
      },
    },
    // Report files that are over 500KB
    chunkSizeWarningLimit: 500,
    // Enable source maps for production debugging (can disable for security)
    sourcemap: false,
  },
});
