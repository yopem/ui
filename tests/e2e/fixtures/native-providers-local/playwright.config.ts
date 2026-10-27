import { defineConfig, devices } from "@playwright/test"
import { resolve } from "node:path"

const repositoryRoot = resolve(import.meta.dirname, "../../../..")

export default defineConfig({
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  outputDir: resolve(
    repositoryRoot,
    "test-results/native-provider-local/artifacts",
  ),
  reporter: [
    ["list"],
    [
      "json",
      {
        outputFile: resolve(
          repositoryRoot,
          "test-results/native-provider-local/results.json",
        ),
      },
    ],
    [
      "html",
      {
        open: "never",
        outputFolder: resolve(
          repositoryRoot,
          "test-results/native-provider-local/report",
        ),
      },
    ],
  ],
  testDir: resolve(repositoryRoot, "tests/e2e"),
  testMatch: "docs/editor-native-providers.spec.ts",
  use: {
    baseURL: "https://127.0.0.1:3443",
    screenshot: "off",
    trace: "off",
    video: "off",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], channel: "chromium" },
    },
  ],
})
