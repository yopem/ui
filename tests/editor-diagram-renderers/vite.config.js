import { resolve } from "node:path"
import { defineConfig } from "vite"

export default defineConfig({
  resolve: {
    alias: {
      "@editor": resolve(import.meta.dirname, "../../packages/editor/src"),
    },
  },
})
