import { defineConfig, devices } from "@playwright/test"
import { resolve } from "node:path"

export function createPlaywrightConfig(port: string, workspace: string) {
  const production = process.env.PLAYWRIGHT_PRODUCTION === "1"
  const resultsDirectory = resolve(workspace, "test-results", port)

  return defineConfig({
    expect: { timeout: 10_000 },
    fullyParallel: true,
    outputDir: resultsDirectory,
    grepInvert: process.env.FULL_A11Y ? undefined : /@full-a11y/,
    reporter: process.env.CI
      ? "github"
      : [
          ["list"],
          [
            "html",
            {
              open: "never",
              outputFolder: resolve(workspace, "test-results/report"),
            },
          ],
        ],
    testDir: "test/e2e",
    testMatch: "**/*.spec.ts",
    use: {
      baseURL: `http://localhost:${port}`,
      screenshot: "only-on-failure",
      trace: "retain-on-failure",
    },
    webServer: {
      command: production
        ? `PORT=${port} bun run start --inspector-port=0 --persist-to=${JSON.stringify(resolve(workspace, ".wrangler/test", port))}`
        : `bun run dev -- --mode test --port ${port}`,
      cwd: resolve(import.meta.dirname, ".."),
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
}
