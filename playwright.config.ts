import { defineConfig, devices } from "@playwright/test"

const port = process.env.PLAYWRIGHT_PORT ?? "3000"

export default defineConfig({
  expect: { timeout: 10_000 },
  fullyParallel: true,
  outputDir: `test-results/${port}`,
  grepInvert:
    process.env.FULL_PARITY || process.env.FULL_A11Y
      ? undefined
      : /@parity|@full-a11y/,
  reporter: process.env.CI ? "github" : "list",
  testDir: "tests/e2e",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: process.env.PLAYWRIGHT_PRODUCTION
      ? `PORT=${port} bun run start`
      : `bun run --cwd apps/docs dev -- --port ${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: `http://127.0.0.1:${port}/components`,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"] },
    },
  ],
})
