import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
import { readdir } from "node:fs/promises"
import { resolve } from "node:path"

test.skip(
  !process.env.FULL_A11Y,
  "Set FULL_A11Y=1 to run the full component accessibility matrix",
)

const firstExamples = new Map<string, string>()
for (const file of (
  await readdir(
    resolve(
      import.meta.dirname,
      "../../apps/docs/src/components/examples/stylex",
    ),
  )
).sort()) {
  const match = /^p-(.+)-\d+\.tsx$/.exec(file)
  if (match?.[1] && !firstExamples.has(match[1])) {
    firstExamples.set(match[1], file.slice(0, -4))
  }
}

const examples = [...firstExamples.values()].slice(
  0,
  process.env.A11Y_LIMIT ? Number(process.env.A11Y_LIMIT) : undefined,
)

for (const theme of ["light", "dark"] as const) {
  test(`@full-a11y ${theme} component examples have no axe violations`, async ({
    page,
  }) => {
    test.setTimeout(20 * 60_000)
    const violations: { example: string; help: string; id: string }[] = []
    for (const example of examples) {
      await page.goto(`/examples/${example}?theme=${theme}`)
      await page.locator("[data-example-root]").waitFor()
      await page.waitForFunction(
        () =>
          document.fonts.status === "loaded" &&
          !document.body.textContent?.includes("Loading example…"),
      )
      const result = await new AxeBuilder({ page })
        .include("[data-example-root]")
        .analyze()
      violations.push(
        ...result.violations.map(({ help, id }) => ({ example, help, id })),
      )
    }
    expect(violations).toEqual([])
  })
}
