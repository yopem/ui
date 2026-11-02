import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
import { execFile } from "node:child_process"
import { promisify } from "node:util"

const execute = promisify(execFile)

for (const count of [1, 2]) {
  test(`canonical HTML keeps ${count} distinguishable contents landmark(s) @a11y`, async ({
    page,
  }, testInfo) => {
    const { stdout } = await execute(
      "bun",
      [
        "run",
        "--preload",
        "./tests/stylex-preload.ts",
        "--tsconfig-override",
        "./tests/tsconfig.json",
        "./tests/fixtures/editor-toc-export.ts",
        String(count),
      ],
      { cwd: process.cwd(), encoding: "utf8" },
    )

    await testInfo.attach("canonical-contents.html", {
      body: stdout,
      contentType: "text/html",
    })
    expect(stdout.trimStart()).toMatch(/^<nav\b/)
    expect(stdout).toContain("data-editor-toc")
    expect(stdout).toContain("Exported section")

    await page.setContent(
      `<!doctype html><html lang="en"><head><title>Document export</title></head><body><main><h1>Document export</h1>${stdout}</main></body></html>`,
    )
    const landmarks = page.getByRole("navigation")
    await expect(landmarks).toHaveCount(count)

    const names = await landmarks.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("aria-label")),
    )

    expect(names).toEqual(
      count === 1
        ? ["Table of contents"]
        : ["Table of contents 1", "Table of contents 2"],
    )

    for (const landmark of await landmarks.all()) {
      const link = landmark.getByRole("link", {
        name: "Exported section",
        exact: true,
      })

      await link.click()
      const target = await link.getAttribute("href")
      expect(target).toMatch(/^#yopem-toc-/)
      await expect(page.locator(target ?? "#missing-target")).toHaveCount(1)
    }

    const report = await new AxeBuilder({ page }).analyze()
    expect(report.violations).toEqual([])
    await testInfo.attach("contents-accessibility.json", {
      body: JSON.stringify(report),
      contentType: "application/json",
    })
    await page.screenshot({
      path: testInfo.outputPath("contents-export.png"),
      scale: "css",
    })
  })
}
