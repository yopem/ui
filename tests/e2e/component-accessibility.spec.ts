import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
import { readdir } from "node:fs/promises"
import { resolve } from "node:path"

test.skip(
  !process.env.FULL_A11Y,
  "Set FULL_A11Y=1 to run the full component accessibility matrix",
)

const firstDemos = new Map<string, string>()
for (const file of (
  await readdir(
    resolve(import.meta.dirname, "../../apps/docs/src/components/demos/stylex"),
  )
).sort()) {
  const match = /^p-(.+)-\d+\.tsx$/.exec(file)
  if (match?.[1] && !firstDemos.has(match[1])) {
    firstDemos.set(match[1], file.slice(0, -4))
  }
}

const demos = [...firstDemos.values()].slice(
  0,
  process.env.A11Y_LIMIT ? Number(process.env.A11Y_LIMIT) : undefined,
)

for (const theme of ["light", "dark"] as const) {
  test(`@full-a11y ${theme} component demos have no axe violations`, async ({
    page,
  }) => {
    test.setTimeout(20 * 60_000)
    const violations: { demo: string; help: string; id: string }[] = []
    for (const demo of demos) {
      await page.goto(`/render/stylex/${theme}/${demo}`)
      await page.locator("[data-parity-root]").waitFor()
      await page.waitForFunction(
        () =>
          document.fonts.status === "loaded" &&
          !document.body.textContent?.includes("Loading demo…"),
      )
      await page.waitForFunction(
        () =>
          (document.querySelector("#__stylex_virtual__")?.textContent?.length ??
            0) > 0,
      )
      const result = await new AxeBuilder({ page })
        .include("[data-parity-root]")
        .analyze()
      violations.push(
        ...result.violations.map(({ help, id }) => ({ demo, help, id })),
      )
    }
    expect(violations).toEqual([])
  })
}
