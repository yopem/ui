import { expect, test } from "@playwright/test"

const examples = [
  { item: "editor-code", entry: "code", identifier: "EditorCode" },
] as const

for (const example of examples) {
  test(`${example.item} copies a complete consumer preview`, async ({
    page,
    context,
  }, testInfo) => {
    test.slow()
    await page.goto(`/components/${example.item}`)
    await context.grantPermissions(["clipboard-read", "clipboard-write"], {
      origin: new URL(page.url()).origin,
    })
    const copy = page.getByRole("button", { name: /^Copy .+ source$/u }).first()
    await expect(copy).toBeEnabled()
    await copy.click()
    const source = await page.evaluate(() => navigator.clipboard.readText())
    expect(source).toContain(`@/components/editor/${example.entry}`)
    expect(source).toContain(example.identifier)
    expect(source).toMatch(/export function /u)
    expect(source).not.toMatch(
      /from\s+["'](?:\.{1,2}\/|@\/catalog\/|@registry\/|@workspace\/|@yopem-ui\/)/u,
    )

    expect(source).not.toContain("prettier")
    expect(source).not.toContain("/code-format")


    await testInfo.attach(`${example.item}-consumer-preview.tsx`, {
      body: source,
      contentType: "text/plain",
    })
  })
}
