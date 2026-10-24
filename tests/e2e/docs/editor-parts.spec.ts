import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
import { editorParts } from "@workspace/apps/docs/src/catalog/editor-parts"
import { z } from "zod"

for (const part of editorParts.filter(
  (part) =>
    part.item !== "editor-blocks" &&
    part.item !== "editor-typeahead" &&
    part.item !== "editor-document",
)) {
  test(`${part.name} preview and public resources @a11y`, async ({
    page,
    request,
    context,
  }, testInfo) => {
    await page.goto(`/editor/${part.slug}`)
    await expect(
      page.getByRole("heading", { name: part.name, exact: true, level: 1 }),
    ).toBeVisible()

    const preview = page.getByRole("group", {
      name: `${part.name} live preview`,
      exact: true,
    })

    const editor = preview.getByRole("textbox", {
      name: `${part.name} preview`,
      exact: true,
    })

    if (part.item === "editor-collaboration") {
      await expect(
        preview.getByRole("textbox", { name: "Document ID", exact: true }),
      ).toBeVisible()
      await expect(
        preview.getByRole("textbox", { name: "Ticket endpoint", exact: true }),
      ).toBeVisible()
      await expect(
        preview.getByRole("textbox", {
          name: "WebSocket endpoint",
          exact: true,
        }),
      ).toBeVisible()
      await expect(
        preview.getByLabel("CSRF token", { exact: true }),
      ).toHaveAttribute("type", "password")
      await expect(
        preview.getByRole("button", { name: "Connect to host", exact: true }),
      ).toBeEnabled()
      await expect(preview.locator('[contenteditable="true"]')).toHaveCount(0)
    } else {
      await expect(editor).toHaveAttribute("contenteditable", "true")
      await editor.click()
      await editor.pressSequentially("Editor preview")
      await expect(editor).toContainText("Editor preview")
    }

    if (part.name === "EditorLinkControl") {
      await editor.press("ControlOrMeta+a")
      await preview.getByRole("button", { name: "Link", exact: true }).click()
      const popup = page.getByRole("dialog", { name: "Link", exact: true })
      await popup
        .getByRole("textbox", { name: "Link URL" })
        .fill("https://example.com")
      expect(
        (await new AxeBuilder({ page }).include('[role="dialog"]').analyze())
          .violations,
      ).toEqual([])
      await popup
        .getByRole("button", { name: "Apply link", exact: true })
        .click()
      await expect(editor.getByRole("link")).toHaveAttribute(
        "href",
        "https://example.com",
      )
      await expect(popup).toHaveCount(0)
      await expect(editor).toBeFocused()
    }

    if (part.item === "editor-code") {
      await preview
        .getByRole("button", { name: "Code block", exact: true })
        .click()
      await expect(editor.locator("code")).toContainText("Editor preview")

      const copy = preview.getByRole("button", {
        name: "Copy code",
        exact: true,
      })

      if (await copy.count()) {
        await context.grantPermissions(["clipboard-read", "clipboard-write"])
        await copy.click()
        await expect
          .poll(() => page.evaluate(() => navigator.clipboard.readText()))
          .toBe(await editor.locator("code").innerText())
        await expect(preview.getByRole("status")).not.toHaveText("")
      }

      if (part.name === "EditorCodeToggle") {
        await preview
          .getByRole("button", { name: "Line numbers", exact: true })
          .click()
        await expect(editor.locator("code")).toHaveAttribute(
          "data-code-line-numbers",
          "true",
        )
        await preview
          .getByRole("button", { name: "Wrap code", exact: true })
          .click()
        await expect(editor.locator("code")).toHaveAttribute(
          "data-code-wrap",
          "true",
        )
        await expect(editor.locator("code")).not.toHaveAttribute(
          "data-code-line-numbers",
          "true",
        )
      }

      const language = preview.getByRole("combobox", { name: "Code language" })

      if (await language.count()) {
        await language.focus()
        await language.press("ArrowDown")
        await language.selectOption("typescript")
        await expect(editor.locator("code")).toHaveAttribute(
          "data-language",
          "typescript",
        )
      }
    }

    if (part.name.startsWith("EditorTable")) {
      await preview
        .getByRole("button", { name: "Insert table", exact: true })
        .first()
        .click()
      await expect(editor.locator("table")).toBeVisible()

      const headers = editor.locator("th")
      const headerCount = await headers.count()

      for (let index = 0; index < headerCount; index++) {
        const header = headers.nth(index)
        const label = `Header ${index + 1}`
        await header.click()
        await editor.pressSequentially(label)
        await expect(header).toHaveText(label)
      }

      if (part.name === "EditorTableMenu") {
        const menu = preview.getByRole("button", {
          name: "Table actions",
          exact: true,
        })

        await menu.focus()
        await menu.press("Enter")
        await expect(page.getByRole("menu")).toBeVisible()
        expect(
          (await new AxeBuilder({ page }).include('[role="menu"]').analyze())
            .violations,
        ).toEqual([])
        await page.keyboard.press("Escape")
        await expect(page.getByRole("menu")).toHaveCount(0)
        await expect(menu).toBeFocused()
      }
    }

    expect(
      (
        await new AxeBuilder({ page })
          .include('[data-slot="editor-part-preview"]')
          .analyze()
      ).violations,
    ).toEqual([])

    const api = z
      .object({ parts: z.array(z.object({ name: z.string() })) })
      .parse(await (await request.get(`/r/docs/${part.item}.json`)).json())

    expect(api.parts.map((entry) => entry.name)).toContain(part.name)
    const markdown = await request.get(`/editor/${part.slug}.md`)
    expect(markdown.status()).toBe(200)
    expect(markdown.headers()["content-type"]).toContain("text/markdown")

    const markdownText = await markdown.text()

    expect(markdownText).toContain(`@yopem-ui/cli add ${part.item}`)
    expect(markdownText).toContain(
      part.item === "editor-code"
        ? "@/components/editor/code"
        : "@/components/editor",
    )
    await page.setViewportSize({ width: 390, height: 844 })
    await expect(preview).toBeVisible()
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(390)
    await page.screenshot({
      path: testInfo.outputPath(`${part.slug}-mobile.png`),
      fullPage: true,
      scale: "css",
    })
  })
}

test("editor overview accessibility @a11y", async ({ page }, info) => {
  await page.goto("/editor")
  await expect(
    page.getByRole("heading", { name: "Editor", level: 1, exact: true }),
  ).toBeVisible()

  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 900 })

    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(width)
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
    await page.screenshot({
      path: info.outputPath(`editor-overview-${width}.png`),
      fullPage: true,
      scale: "css",
    })
  }
})

test("long editor part identifiers stay visible across viewports @a11y", async ({
  page,
}, info) => {
  test.slow()
  await page.goto("/editor/table-background-controls")

  const heading = page.getByRole("heading", {
    name: "EditorTableBackgroundControls",
    level: 1,
    exact: true,
  })

  await expect(
    page.getByRole("textbox", {
      name: "EditorTableBackgroundControls preview",
      exact: true,
    }),
  ).toHaveAttribute("contenteditable", "true")

  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 900 })
    await heading.scrollIntoViewIfNeeded()
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(width)
    await expect(heading).toBeInViewport({ ratio: 1 })
    await expect(heading).toHaveText("EditorTableBackgroundControls")
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
    await page.screenshot({
      path: info.outputPath(`long-identifier-${width}.png`),
      fullPage: true,
      scale: "css",
    })
  }
})

test("editor discovery, SSR and compatibility", async ({ request, page }) => {
  await page.route("**/_server/**", (route) => route.abort())

  for (const path of [
    "/editor",
    "/docs/editor",
    "/components/editor",
    "/docs/editor-auth",
    "/docs/editor-store",
  ])
    expect((await request.get(path)).status()).toBe(200)

  const inventory = z
    .array(z.object({ name: z.string() }))
    .parse(await (await request.get("/api/editor.json")).json())

  expect(inventory.map((part) => part.name)).toEqual(
    editorParts.map((part) => part.name),
  )
  const sitemap = await (await request.get("/sitemap.xml")).text()
  const llms = await (await request.get("/llms.txt")).text()
  const search = await (await request.get("/api/search.json")).text()

  for (const part of editorParts) {
    expect(sitemap).toContain(`/editor/${part.slug}`)
    expect(llms).toContain(`/editor/${part.slug}.md`)
    expect(search).toContain(`/editor/${part.slug}`)
  }

  await page.goto("/editor")
  await page
    .getByRole("main")
    .getByRole("link", { name: /^EditorToolbar\b/ })
    .click()
  await expect(page).toHaveURL(/\/editor\/toolbar$/)
  await expect(
    page.getByRole("heading", { name: "EditorToolbar", exact: true, level: 1 }),
  ).toBeVisible()
  await expect(
    page.getByRole("textbox", { name: "EditorToolbar preview", exact: true }),
  ).toHaveAttribute("contenteditable", "true")
})

test("toolbar moves focus between real controls", async ({ page }) => {
  await page.goto("/editor/toolbar")
  const toolbar = page.getByRole("toolbar", { name: "Formatting", exact: true })
  const bold = toolbar.getByRole("button", { name: "Bold", exact: true })
  const italic = toolbar.getByRole("button", { name: "Italic", exact: true })
  await expect(
    page.getByRole("textbox", { name: "EditorToolbar preview", exact: true }),
  ).toHaveAttribute("contenteditable", "true")
  await bold.focus()
  await bold.press("ArrowRight")
  await expect(italic).toBeFocused()
  await italic.press("ArrowLeft")
  await expect(bold).toBeFocused()
})

test("focused format button pointer and keyboard", async ({ page }) => {
  await page.goto("/editor/format-button")

  const editor = page.getByRole("textbox", {
    name: "EditorFormatButton preview",
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.fill("Format me")
  await editor.press("ControlOrMeta+a")
  await page.getByRole("button", { name: "Bold", exact: true }).click()
  await expect(editor.locator("strong")).toHaveText("Format me")
  await editor.press("ControlOrMeta+b")
  await expect(editor.locator("strong")).toHaveCount(0)
})

for (const item of new Set(editorParts.map((part) => part.item))) {
  for (const [manager, runner] of [
    ["Bun", "bunx --bun"],
    ["npm", "npx"],
    ["pnpm", "pnpm dlx"],
    ["Yarn", "yarn dlx"],
  ]) {
    test(`${item} ${manager} install and source copy`, async ({
      page,
      context,
    }) => {
      await context.grantPermissions(["clipboard-read", "clipboard-write"])
      const part = editorParts.find((entry) => entry.item === item)

      if (!part) throw new Error(item)
      await page.goto(`/editor/${part.slug}`)

      const install = page
        .getByTestId("copyable-code")
        .filter({ hasText: `@yopem-ui/cli add ${item}` })

      await install.getByRole("button", { name: manager, exact: true }).click()
      await install
        .getByRole("button", {
          name: `Copy Install ${part.name} with CLI`,
          exact: true,
        })
        .click()
      await expect
        .poll(() => page.evaluate(() => navigator.clipboard.readText()))
        .toBe(`${runner} @yopem-ui/cli add ${item}`)

      const usage = page.getByTestId("copyable-code").filter({
        has: page.getByRole("button", {
          name: `Copy ${part.name} usage`,
          exact: true,
        }),
      })

      await usage
        .getByRole("button", { name: `Copy ${part.name} usage`, exact: true })
        .click()
      const copied = await page.evaluate(() => navigator.clipboard.readText())
      expect(copied).toContain(part.name)
      expect(copied).toContain(
        part.item === "editor-code"
          ? "@/components/editor/code"
          : part.item === "editor-blocks"
            ? "@/components/editor/blocks"
            : part.item === "editor-typeahead"
              ? "@/components/editor/typeahead-index"
              : "@/components/editor",
      )
      expect(copied).not.toContain("@yopem-ui/editor")
      await page.reload()
      await expect(
        install.getByRole("button", { name: manager, exact: true }),
      ).toHaveAttribute("aria-pressed", "true")
    })
  }
}

test("editor search keyboard shortcut and result activation", async ({
  page,
}) => {
  await page.goto("/editor")
  await expect(
    page.getByRole("button", { name: "Search documentation", exact: true }),
  ).toBeEnabled()
  await page.keyboard.press("ControlOrMeta+k")
  const search = page.getByRole("searchbox", { name: /Search/ })
  await expect(search).toBeFocused()
  await search.fill("EditorToolbar")
  await page
    .getByRole("link", { name: /EditorToolbar/ })
    .first()
    .press("Enter")
  await expect(page).toHaveURL(/\/editor\/toolbar$/)
  await expect(
    page.getByRole("heading", { name: "EditorToolbar", exact: true, level: 1 }),
  ).toBeVisible()
  await expect(
    page.getByRole("textbox", { name: "EditorToolbar preview", exact: true }),
  ).toHaveAttribute("contenteditable", "true")
})

test("mobile editor navigation closes after selection", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/editor")
  await page
    .getByRole("button", { name: "Open navigation", exact: true })
    .click()
  const dialog = page.getByRole("dialog", { name: "Documentation" })
  await dialog
    .getByRole("link", { name: "EditorTableBackgroundControls", exact: true })
    .click()
  await expect(dialog).toHaveCount(0)
  await expect(page).toHaveURL(/\/editor\/table-background-controls$/)
  await expect(
    page.getByRole("heading", {
      name: "EditorTableBackgroundControls",
      exact: true,
      level: 1,
    }),
  ).toBeVisible()
})

test("unknown editor parts return 404", async ({ request }) => {
  for (const path of ["/editor/not-shipped", "/editor/not-shipped.md"])
    expect((await request.get(path)).status()).toBe(404)
})

test.describe("editor server rendering", () => {
  test.use({ javaScriptEnabled: false })
  test("every part has server-rendered documentation", async ({ page }) => {
    test.slow()

    for (const part of editorParts) {
      const response = await page.goto(`/editor/${part.slug}`)
      expect(response?.status()).toBe(200)
      await expect(
        page
          .getByRole("main")
          .getByRole("heading", { name: part.name, exact: true, level: 1 }),
      ).toBeVisible()
      await expect(
        page.getByRole("heading", { name: "API reference", exact: true }),
      ).toBeVisible()
      await expect(
        page.getByRole("group", {
          name: `${part.name} live preview`,
          exact: true,
        }),
      ).toBeVisible()
    }
  })
})
