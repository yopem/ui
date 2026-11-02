import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
import { execFile } from "node:child_process"
import { promisify } from "node:util"

const execute = promisify(execFile)

for (const count of [1, 2, 3]) {
  test(`static document exposes ${count} nested contents landmarks @a11y`, async ({
    page,
  }, info) => {
    const { stdout } = await execute(
      "bun",
      [
        "run",
        "--preload",
        "./tests/stylex-preload.ts",
        "--tsconfig-override",
        "./tests/tsconfig.json",
        "./tests/fixtures/static-toc-render.ts",
        String(count),
      ],
      { cwd: process.cwd(), encoding: "utf8" },
    )

    await info.attach("static-document.html", {
      body: stdout,
      contentType: "text/html",
    })
    await page.setContent(
      `<!doctype html><html lang="en"><head><title>Static document</title></head><body><main>${stdout}</main></body></html>`,
    )

    const document = page.getByRole("region", {
      name: "Published document",
      exact: true,
    })

    const landmarks = document.getByRole("navigation")
    await expect(landmarks).toHaveCount(count)
    expect(
      await landmarks.evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute("aria-label")),
      ),
    ).toEqual(
      Array.from({ length: count }, (_, index) =>
        count === 1
          ? "Published document: Table of contents"
          : `Published document: Table of contents ${index + 1}`,
      ),
    )

    if (count > 1)
      await expect(
        document.locator('[data-editor-slot="contents"] nav[data-editor-toc]'),
      ).toHaveCount(1)

    for (const landmark of await landmarks.all()) {
      const links = landmark.getByRole("link")
      await expect(links).toHaveText(["First section", "Nested section"])

      for (const link of await links.all()) {
        const target = await link.getAttribute("href")
        expect(target).toMatch(/^#yopem-toc-/)
        await link.click()
        await expect(page.locator(target ?? "#missing-target")).toHaveCount(1)
        expect(new URL(page.url()).hash).toBe(target)
      }
    }

    const report = await new AxeBuilder({ page }).analyze()
    await info.attach("static-toc-axe.json", {
      body: JSON.stringify(report),
      contentType: "application/json",
    })
    expect(report.violations).toEqual([])
    await page.screenshot({
      path: info.outputPath("static-toc.png"),
      scale: "css",
    })
  })
}
