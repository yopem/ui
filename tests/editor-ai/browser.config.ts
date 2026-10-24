import { defineConfig, devices } from "@playwright/test"
import { resolve } from "node:path"

export default defineConfig({
  testDir: resolve(import.meta.dirname, "../e2e/docs"),
  testMatch: "editor-ai-http.spec.ts",
  tsconfig: resolve(import.meta.dirname, "../tsconfig.json"),
  workers: 1,
  expect: { timeout: 10000 },
  outputDir: resolve(
    import.meta.dirname,
    "../../test-results/editor-ai-http/artifacts",
  ),
  reporter: [
    [
      "html",
      { open: "never", outputFolder: "test-results/editor-ai-http/report" },
    ],
  ],
  use: {
    ...devices["Desktop Chrome"],
    channel: "chromium",
    baseURL: process.env.EDITOR_AI_FIXTURE_ORIGIN,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
})
