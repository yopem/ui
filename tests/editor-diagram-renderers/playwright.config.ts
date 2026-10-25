import { defineConfig, devices } from "@playwright/test"
import { resolve } from "node:path"

const root = resolve(import.meta.dirname, "../..")

const baseURL = "http://127.0.0.1:4174"

export default defineConfig({
  testDir: import.meta.dirname,
  testMatch: "renderers.spec.ts",
  workers: 1,
  outputDir: resolve(root, "test-results/editor-diagram-renderers/artifacts"),
  reporter: [
    ["list"],
    [
      "html",
      {
        open: "never",
        outputFolder: resolve(
          root,
          "test-results/editor-diagram-renderers/report",
        ),
      },
    ],
  ],
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    trace: "retain-on-failure",
  },
  webServer: {
    command:
      "bun run --cwd apps/docs vite --config ../../tests/editor-diagram-renderers/vite.config.js ../../tests/editor-diagram-renderers --host 127.0.0.1 --port 4174 --strictPort",
    cwd: root,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 30_000,
  },
})
