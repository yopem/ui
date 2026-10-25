import { expect, test } from "@playwright/test"

test("each optional renderer produces sanitized SVG from diagram source", async ({
  page,
}) => {
  await page.goto("/")
  await expect(page.locator("#result")).toHaveText(
    "mermaid:pass, plantuml:pass, graphviz:pass, flowchart:pass, resource-policy:pass",
    { timeout: 120_000 },
  )
})
