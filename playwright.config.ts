import { defineConfig, devices } from "@playwright/test"

const port = process.env.PLAYWRIGHT_PORT ?? "3100"
const production = process.env.PLAYWRIGHT_PRODUCTION === "1"

export default defineConfig({
  expect: { timeout: 10_000 },
  fullyParallel: true,
  outputDir: `test-results/${port}`,
  grepInvert: process.env.FULL_A11Y ? undefined : /@full-a11y/,
  reporter: process.env.CI
    ? "github"
    : [
        ["list"],
        ["html", { open: "never", outputFolder: "test-results/report" }],
      ],
  testDir: "test/e2e",
  use: {
    baseURL: `http://localhost:${port}`,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: production
      ? `PORT=${port} bun run start`
      : `bun run --cwd apps/docs dev -- --mode test --port ${port}`,
    reuseExistingServer: !process.env.CI && !production,
    timeout: 120_000,
    url: `http://localhost:${port}/components`,
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
