import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// ESM-safe __dirname replacement
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],

  server: {
    host: "::", // allows access via IPv4 & IPv6 (use "0.0.0.0" if issues arise)
    port: 8080,
    hmr: {
      overlay: false, // prevents error overlay blocking the UI
    },
  },

  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
