import { defineConfig, devices } from "@playwright/test"
import { resolve } from "node:path"

const production = process.env.PLAYWRIGHT_PRODUCTION === "1"

const port = process.env.PLAYWRIGHT_PORT ?? "3100"

const root = import.meta.dirname

export default defineConfig({
  expect: { timeout: 10_000 },
  fullyParallel: true,
  workers: 1,
  outputDir: "test-results/artifacts",
  grepInvert: process.env.FULL_A11Y ? undefined : /@full-a11y/,
  reporter: process.env.CI
    ? "github"
    : [
        ["list"],
        ["html", { open: "never", outputFolder: "test-results/report" }],
      ],
  testDir: "tests/e2e",
  testMatch: "**/*.spec.ts",
  tsconfig: "tests/tsconfig.json",
  use: {
    baseURL: `http://localhost:${port}`,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    // Disable Wrangler local observability. Its trace collector delays asset responses.
    env: { X_LOCAL_OBSERVABILITY: "false" },
    command: production
      ? `PORT=${port} bun run start --inspector-port=0 --persist-to=${JSON.stringify(resolve(root, ".wrangler/test", port))}`
      : `bun run dev -- --mode test --port ${port}`,
    cwd: resolve(root, "apps/docs"),
    reuseExistingServer: !process.env.CI && !production,
    timeout: 120_000,
    url: `http://localhost:${port}/components`,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], channel: "chromium" },
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"], channel: "chromium" },
    },
  ],
})
