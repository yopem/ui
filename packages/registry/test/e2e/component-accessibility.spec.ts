import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
import { readdir } from "node:fs/promises"
import { resolve } from "node:path"

test.skip(
  !process.env.FULL_A11Y,
  "Set FULL_A11Y=1 to run the full component accessibility matrix",
)

const previews = (
  await readdir(
    resolve(import.meta.dirname, "../../../../apps/docs/src/catalog/previews"),
  )
)
  .filter((file) => file.endsWith(".tsx"))
  .map((file) => file.slice(0, -4))
  .toSorted()
  .slice(0, process.env.A11Y_LIMIT ? Number(process.env.A11Y_LIMIT) : undefined)

for (const theme of ["light", "dark"] as const) {
  for (const slug of previews) {
    test(`@a11y @full-a11y ${slug} preview has no ${theme} theme violations`, async ({
      page,
    }) => {
      await page.addInitScript(
        (value) => localStorage.setItem("yopem-ui-theme", value),
        theme,
      )
      await page.goto(`/components/${slug}`)
      const preview = page.locator('[aria-label$="live preview"]')
      await preview.waitFor()
      await page.waitForFunction(() => document.fonts.status === "loaded")

      const result = await new AxeBuilder({ page })
        .include('[aria-label$="live preview"]')
        .disableRules(["heading-order"])
        .analyze()

      expect(
        result.violations.map(({ help, id, nodes }) => ({
          help,
          id,
          targets: nodes.flatMap((node) => node.target),
        })),
      ).toEqual([])
    })
  }
}
