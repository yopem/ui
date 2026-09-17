import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
import { readdir } from "node:fs/promises"
import { resolve } from "node:path"

test.skip(
  !process.env.FULL_A11Y,
  "Set FULL_A11Y=1 to run the full component accessibility matrix",
)

const examples = (
  await readdir(
    resolve(
      import.meta.dirname,
      "../../apps/docs/src/components/examples/stylex",
    ),
  )
)
  .filter((file) => file.endsWith(".tsx"))
  .map((file) => file.slice(0, -4))
  .toSorted()
  .slice(0, process.env.A11Y_LIMIT ? Number(process.env.A11Y_LIMIT) : undefined)

for (const theme of ["light", "dark"] as const) {
  for (const example of examples) {
    test(`@full-a11y ${example} has no ${theme} theme violations`, async ({
      page,
    }) => {
      await page.goto(`/examples/${example}?theme=${theme}`)
      const root = page.locator("[data-example-root]")
      await root.waitFor()
      await page.waitForFunction(
        () =>
          document.fonts.status === "loaded" &&
          !document.body.textContent?.includes("Loading example…"),
      )
      const result = await new AxeBuilder({ page })
        .include("[data-example-root]")
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
