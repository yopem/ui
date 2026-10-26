import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test.use({ permissions: ["clipboard-read", "clipboard-write"] })

test.beforeEach(async ({ page }) => {
  test.slow()
  await page.goto("/docs/editor")
  await expect(
    page.getByRole("textbox", { name: "Rich text editor", exact: true }),
  ).toHaveAttribute("contenteditable", "true")
})

test("typed and pasted plain URLs retain text and expose safe native links", async ({
  page,
}, testInfo) => {
  const editor = page.getByRole("textbox", {
    name: "Rich text editor",
    exact: true,
  })

  await editor.fill("Visit ")
  await editor.press("End")
  await page.keyboard.type("https://example.com/path ")
  await expect(
    editor.getByRole("link", { name: "https://example.com/path", exact: true }),
  ).toHaveAttribute("href", "https://example.com/path")
  await editor.press("ControlOrMeta+a")
  await page.evaluate(() =>
    navigator.clipboard.writeText(
      "Contact person@example.com or www.example.org.",
    ),
  )
  await editor.press("ControlOrMeta+v")
  await expect(editor).toHaveText(
    "Contact person@example.com or www.example.org.",
  )
  await expect(
    editor.getByRole("link", { name: "person@example.com", exact: true }),
  ).toHaveAttribute("href", "mailto:person@example.com")
  await expect(
    editor.getByRole("link", { name: "www.example.org", exact: true }),
  ).toHaveAttribute("href", "https://www.example.org")
  const accessibility = await new AxeBuilder({ page }).analyze()
  expect(accessibility.violations).toEqual([])
  await testInfo.attach("automatic-link-content", {
    body: await editor.innerHTML(),
    contentType: "text/html",
  })
})

test("inline and block code stay inert while adjacent prose links remain active", async ({
  page,
}) => {
  const editor = page.getByRole("textbox", {
    name: "Rich text editor",
    exact: true,
  })

  const toolbar = page.getByRole("toolbar", {
    name: "Rich text editor formatting",
    exact: true,
  })

  await editor.fill("https://inline.example.com")
  await editor.press("ControlOrMeta+a")
  await toolbar
    .getByRole("button", { name: "Inline code", exact: true })
    .click()
  await expect(editor.getByRole("link")).toHaveCount(0)
  await toolbar.getByRole("button", { name: "Code block", exact: true }).click()
  await expect(editor.getByRole("link")).toHaveCount(0)
  await expect(editor).toHaveText("https://inline.example.com")
})

test("editing an automatic URL updates its destination without activating unsafe schemes", async ({
  page,
}) => {
  const editor = page.getByRole("textbox", {
    name: "Rich text editor",
    exact: true,
  })

  await editor.fill("https://example.com")
  await expect(editor.getByRole("link")).toHaveAttribute(
    "href",
    "https://example.com",
  )
  await editor.press("End")
  await editor.press("Backspace")
  await page.keyboard.type("g")
  await expect(editor.getByRole("link")).toHaveAttribute(
    "href",
    "https://example.cog",
  )
  await editor.fill("javascript:alert(1) data:text/html,test")
  await expect(editor.getByRole("link")).toHaveCount(0)
  await expect(editor).toHaveText("javascript:alert(1) data:text/html,test")
})
