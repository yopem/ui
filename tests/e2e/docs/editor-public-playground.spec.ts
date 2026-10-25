import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
import { readFile } from "node:fs/promises"

test.describe("Integrated playground workflows", () => {
  test.beforeEach(async ({ page }) => {
    test.slow()
    await page.goto("/editor/examples#public-playground")
    const example = page.getByTestId("editor-example-public-playground")
    await example
      .getByRole("button", { name: "Live preview", exact: true })
      .click()
    await expect(
      example.getByRole("textbox", {
        name: "Integrated playground editor",
        exact: true,
      }),
    ).toHaveAttribute("contenteditable", "true")
  })

  test("AI menu shares the slash surface and waits for explicit requests", async ({
    page,
  }) => {
    const requests: string[] = []
    page.on("request", (request) => {
      if (request.url().includes("/api/editor-ai")) requests.push(request.url())
    })

    const workspace = page.getByTestId("public-playground-workspace")

    const editor = workspace.getByRole("textbox", {
      name: "Integrated playground editor",
      exact: true,
    })

    await workspace
      .getByRole("button", { name: "Insert table", exact: true })
      .click()
    await expect(editor.getByRole("table")).toBeVisible()
    await workspace
      .getByRole("textbox", { name: "Host endpoint" })
      .fill(`${new URL(page.url()).origin}/api/editor-ai`)
    await workspace
      .getByRole("textbox", { name: "Host document ID" })
      .fill("playground-document")
    await workspace
      .getByRole("textbox", { name: "Host CSRF token" })
      .fill("playground-csrf")
    await workspace
      .getByRole("button", { name: "Configure AI menu", exact: true })
      .click()

    await expect(
      workspace.getByRole("textbox", { name: "Host CSRF token" }),
    ).toHaveCount(0)
    await expect(workspace.locator('[contenteditable="true"]')).toHaveCount(1)
    await expect(editor.getByRole("table")).toBeVisible()
    await workspace.getByRole("button", { name: "Undo", exact: true }).click()
    await expect(editor.getByRole("table")).toHaveCount(0)

    await editor.press("ControlOrMeta+End")
    await editor.press("End")
    await editor.press("Enter")
    await editor.press("/")
    await expect(
      workspace.getByRole("listbox", { name: "Editor suggestions" }),
    ).toBeVisible()
    await expect(
      workspace.getByRole("option", { name: "Callout" }),
    ).toBeVisible()
    await editor.press("Escape")
    await editor
      .locator("p")
      .first()
      .click({
        button: "right",
        modifiers: ["Alt"],
      })
    await expect(
      workspace.getByRole("dialog", { name: "AI command menu" }),
    ).toHaveCount(0)

    await editor.locator("p").first().selectText()
    await editor.press("ControlOrMeta+j")

    const dialog = workspace.getByRole("dialog", {
      name: "AI command menu",
      exact: true,
    })

    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole("button", { name: "Improve" })).toBeEnabled()
    await expect(editor).toContainText("native Lexical features")
    await expect.poll(() => requests.length).toBe(0)

    await page.keyboard.press("Alt+Shift+r")
    await expect(editor).toHaveAttribute("contenteditable", "false")
    await expect(
      dialog.getByRole("textbox", { name: "Search AI commands" }),
    ).toBeDisabled()
    await expect.poll(() => requests.length).toBe(0)
  })

  test("normal workspace: edits seeded content, inserts a table, and searches", async ({
    page,
  }) => {
    const workspace = page.getByTestId("public-playground-workspace")

    const editor = workspace.getByRole("textbox", {
      name: "Integrated playground editor",
      exact: true,
    })

    await expect(editor).toHaveAttribute("contenteditable", "true")
    await expect(editor.locator("h1")).toHaveCount(1)
    await expect(editor.locator("table")).toHaveCount(0)
    await workspace
      .getByRole("button", { name: "Insert table", exact: true })
      .click()
    await expect(editor.getByRole("table")).toBeVisible()
    await editor.press("ControlOrMeta+z")
    await expect(editor.getByRole("table")).toHaveCount(0)

    const search = workspace.getByRole("searchbox", {
      name: "Search document",
      exact: true,
    })

    await search.fill("review")
    await workspace
      .getByRole("button", { name: "Next match", exact: true })
      .click()
    await expect(editor).toBeFocused()
    await expect
      .poll(() =>
        page.evaluate(() =>
          window.getSelection()?.toString().toLocaleLowerCase(),
        ),
      )
      .toContain("review")
  })

  test("locale and variant remount: updates labels and restores the normal seed", async ({
    page,
  }) => {
    const workspace = page.getByTestId("public-playground-workspace")

    const editor = workspace.getByRole("textbox", {
      name: "Integrated playground editor",
      exact: true,
    })

    await editor.fill("Unsaved draft")
    await workspace
      .getByRole("button", { name: "简体中文", exact: true })
      .click()

    const localizedEditor = workspace.getByRole("textbox", {
      name: "集成编辑器",
      exact: true,
    })

    await expect(localizedEditor).toHaveAttribute("contenteditable", "true")
    await expect(localizedEditor).not.toContainText("Unsaved draft")
    await expect(localizedEditor.locator("h1")).toHaveText("集成原生编辑器")
    await expect(localizedEditor).toHaveAttribute("lang", "zh-CN")
    await workspace
      .getByRole("button", { name: "Copilot", exact: true })
      .click()
    await expect(localizedEditor).toHaveAttribute("contenteditable", "true")
    await expect(localizedEditor.locator("h1")).toHaveText("集成原生编辑器")
    await workspace
      .getByRole("button", { name: "English", exact: true })
      .click()
    await workspace.getByRole("button", { name: "Normal", exact: true }).click()

    const normalEditor = workspace.getByRole("textbox", {
      name: "Integrated playground editor",
      exact: true,
    })

    await expect(normalEditor.locator("h1")).toHaveText(
      "Integrated native editor",
    )
    await expect(normalEditor).toHaveAttribute("lang", "en")
    await expect(normalEditor).not.toContainText("Unsaved draft")
  })

  test("listClassic variant uses native markers and keeps control focus", async ({
    page,
  }) => {
    const workspace = page.getByTestId("public-playground-workspace")
    await workspace
      .getByRole("button", { name: "List classic", exact: true })
      .click()

    const editor = workspace.getByRole("textbox", {
      name: "Integrated playground editor",
      exact: true,
    })

    const list = editor
      .locator("ol")
      .filter({ hasText: "Classic ordered item" })

    const marker = workspace.getByRole("combobox", {
      name: "List marker",
      exact: true,
    })

    const start = workspace.getByRole("textbox", {
      name: "Ordered list start",
      exact: true,
    })

    await expect(editor).toContainText("Classic ordered item")

    for (const name of [
      "Indent",
      "Outdent",
      "First-line indent",
      "Bullet list",
      "Numbered list",
      "Checklist",
    ])
      await expect(
        workspace.getByRole("button", { name, exact: true }),
      ).toHaveCount(0)
    await expect(list).toHaveAttribute("start", "-2")
    await editor.getByText("Classic ordered item", { exact: true }).click()
    await expect(marker).toBeEnabled()
    await marker.click()
    await marker.selectOption("upper-roman")
    await expect(marker).toBeFocused()
    await expect(list).toHaveAttribute("data-editor-list-marker", "upper-roman")
    await start.fill("0")
    await expect(list).toHaveAttribute("start", "0")

    await workspace.getByRole("button", { name: "Normal", exact: true }).click()
    await expect(editor).not.toContainText("Classic ordered item")
    await expect(
      workspace.getByRole("button", { name: "Bullet list", exact: true }),
    ).toBeVisible()
  })

  test("forced-layout variant normalizes first block to H1", async ({
    page,
  }) => {
    const workspace = page.getByTestId("public-playground-workspace")
    await workspace
      .getByRole("button", { name: "Forced layout", exact: true })
      .click()

    const editor = workspace.getByRole("textbox", {
      name: "Integrated playground editor",
      exact: true,
    })

    const firstHeading = editor.locator(":scope > h1")

    await expect(firstHeading).toHaveText("Forced layout paragraph seed")
    await editor
      .getByText("Forced layout paragraph seed", { exact: true })
      .click()
    await workspace
      .getByRole("button", { name: "Paragraph", exact: true })
      .click()
    await expect(firstHeading).toHaveCount(1)
    await expect(firstHeading).toHaveText("Forced layout paragraph seed")
    await expect(editor.locator(":scope > p")).toHaveCount(0)
  })

  test("drawing variant gates runtime, honors read-only, and cleans up", async ({
    page,
  }) => {
    const workspace = page.getByTestId("public-playground-workspace")
    await workspace
      .getByRole("button", { name: "Excalidraw", exact: true })
      .click()

    const editor = workspace.getByRole("textbox", {
      name: "Integrated playground editor",
      exact: true,
    })

    const assets = workspace.getByRole("checkbox", {
      name: "Self-hosted Excalidraw assets are installed",
      exact: true,
    })

    const insertFixture = workspace.getByRole("button", {
      name: "Insert shape fixture",
      exact: true,
    })

    await expect(assets).not.toBeChecked()
    await expect(insertFixture).toHaveCount(0)
    await assets.check()
    await expect(insertFixture).toBeEnabled()
    await insertFixture.click()
    await expect(editor.locator("figure[data-editor-drawing]")).toHaveCount(1)

    const preview = workspace.getByTestId("editor-drawing-preview")
    await expect(preview).toContainText("Drawing with 2 elements")
    await expect(
      preview.getByRole("button", { name: "Edit drawing", exact: true }),
    ).toBeVisible()

    await workspace
      .getByRole("checkbox", { name: "Read-only drawing editor", exact: true })
      .check()
    await expect(editor).toHaveAttribute("contenteditable", "false")
    await expect(
      workspace.getByRole("button", { name: "Insert drawing", exact: true }),
    ).toBeDisabled()
    await expect(insertFixture).toBeDisabled()
    await preview
      .getByRole("button", { name: "View drawing", exact: true })
      .click()

    const viewDialog = workspace.getByRole("dialog", {
      name: "View drawing",
      exact: true,
    })

    await expect(viewDialog).toBeVisible()

    const report = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .analyze()

    expect(report.violations).toEqual([])
    await expect(
      viewDialog.getByRole("button", { name: "Apply drawing", exact: true }),
    ).toBeDisabled()
    await viewDialog
      .getByRole("button", { name: "Cancel drawing", exact: true })
      .click()
    await expect(viewDialog).toBeHidden()

    await assets.uncheck()
    await expect(editor.getByTestId("editor-drawing-preview")).toHaveCount(0)
    await expect(editor).toContainText("Drawing with 2 elements")
    await assets.check()
    await expect(workspace.getByTestId("editor-drawing-preview")).toBeVisible()

    await workspace.getByRole("button", { name: "Normal", exact: true }).click()
    await workspace
      .getByRole("button", { name: "Excalidraw", exact: true })
      .click()
    await expect(
      workspace.getByRole("checkbox", {
        name: "Self-hosted Excalidraw assets are installed",
        exact: true,
      }),
    ).not.toBeChecked()
    await expect(insertFixture).toHaveCount(0)
  })

  test("playground exports native JSON without unsupported imports", async ({
    page,
  }, testInfo) => {
    const workspace = page.getByTestId("public-playground-workspace")

    for (const name of [
      "Save local JSON",
      "Load local JSON",
      "Load native JSON",
      "Import native JSON",
      "Save local HTML",
      "Load local HTML",
      "Export HTML",
      "Export Markdown",
      "Import HTML",
      "Import Markdown",
    ])
      await expect(
        workspace.getByRole("button", { name, exact: true }),
      ).toHaveCount(0)

    await page.context().grantPermissions(["clipboard-read", "clipboard-write"])
    await workspace
      .getByRole("button", { name: "Copy native JSON", exact: true })
      .click()
    const copied = await page.evaluate(() => navigator.clipboard.readText())
    expect(copied).toContain('"type": "editor-columns-group"')
    expect(copied).toContain('"type": "editor-date"')
    expect(copied).toContain('"type": "editor-footnote-reference"')
    expect(copied).toContain('"yopemReview"')

    const downloadPromise = page.waitForEvent("download")
    await workspace
      .getByRole("button", { name: "Download native JSON", exact: true })
      .click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe("public-playground-native.json")
    const path = testInfo.outputPath(download.suggestedFilename())
    await download.saveAs(path)
    expect(await readFile(path, "utf8")).toBe(copied)
  })

  test("review workspace: local policy enables comment creation", async ({
    page,
  }) => {
    const workspace = page.getByTestId("public-playground-workspace")

    const editor = workspace.getByRole("textbox", {
      name: "Integrated playground editor",
      exact: true,
    })

    const review = workspace.getByRole("complementary", {
      name: "Document review",
    })

    await expect(editor.locator("mark")).toContainText("Review anchor")
    await editor.locator("p").first().selectText()
    await workspace
      .getByRole("button", { name: "Comment on selection", exact: true })
      .click()
    await workspace
      .getByRole("textbox", { name: "New comment", exact: true })
      .fill("Check this seeded passage.")
    await workspace
      .getByRole("button", { name: "Add comment", exact: true })
      .click()
    await expect(review.getByRole("article")).toHaveCount(2)
  })

  test("Copilot setup: rejects cross-origin input and sends no automatic request", async ({
    page,
  }) => {
    const requests: string[] = []
    page.on("request", (request) => {
      if (
        request.url().includes("invalid.example") ||
        request.url().includes("/api/editor-ai")
      ) {
        requests.push(request.url())
      }
    })
    const workspace = page.getByTestId("public-playground-workspace")
    await workspace
      .getByRole("button", { name: "Copilot", exact: true })
      .click()
    await expect(
      workspace.getByText("No endpoint is configured.", { exact: true }),
    ).toBeVisible()
    await expect(
      workspace.getByRole("textbox", {
        name: "Integrated playground editor",
        exact: true,
      }),
    ).toHaveAttribute("contenteditable", "true")
    await workspace
      .getByRole("textbox", { name: "Host endpoint", exact: true })
      .fill("https://invalid.example/api/ai")
    await workspace
      .getByRole("textbox", { name: "Host document ID", exact: true })
      .fill("fixture-document")
    await workspace
      .getByRole("textbox", { name: "Host CSRF token", exact: true })
      .fill("fixture-csrf")
    await workspace
      .getByRole("button", { name: "Configure Copilot", exact: true })
      .click()
    await expect(workspace.getByRole("alert")).toBeVisible()
    await expect(
      workspace.getByRole("textbox", {
        name: "Integrated playground editor",
        exact: true,
      }),
    ).toHaveAttribute("contenteditable", "true")
    await expect.poll(() => requests.length).toBe(0)

    const sameOriginEndpoint = `${new URL(page.url()).origin}/api/editor-ai`
    await workspace
      .getByRole("textbox", { name: "Host endpoint", exact: true })
      .fill(sameOriginEndpoint)
    await workspace
      .getByRole("button", { name: "Configure Copilot", exact: true })
      .click()
    await expect(
      workspace.getByRole("textbox", {
        name: "Integrated playground editor",
        exact: true,
      }),
    ).toHaveAttribute("contenteditable", "true")
    await expect.poll(() => requests.length).toBe(0)
  })

  test("forced layout retains converted content behind a required first heading", async ({
    page,
  }) => {
    const workspace = page.getByTestId("public-playground-workspace")
    await workspace
      .getByRole("button", { name: "Forced layout", exact: true })
      .click()

    const editor = workspace.getByRole("textbox", {
      name: "Integrated playground editor",
      exact: true,
    })

    await expect(editor).toHaveAttribute("contenteditable", "true")
    const title = editor.locator("h1").first()
    const original = await title.innerText()
    await title.selectText()
    await workspace.getByRole("button", { name: "Quote", exact: true }).click()
    await expect
      .poll(() =>
        editor
          .locator(":scope > :first-child")
          .evaluate((element) => element.tagName),
      )
      .toBe("H1")
    await expect(editor.locator("blockquote")).toContainText(original)
    await editor.locator("h1").first().fill("Required document title")
    await expect(editor.locator("blockquote")).toContainText(original)

    const report = await new AxeBuilder({ page })
      .include('[data-testid="public-playground-workspace"]')
      .analyze()

    expect(report.violations).toEqual([])
  })

  test("responsive states: editor stays contained and accessible", async ({
    page,
  }, testInfo) => {
    const workspace = page.getByTestId("public-playground-workspace")

    for (const width of [1440, 768, 390]) {
      await page.setViewportSize({ width, height: 900 })
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBeLessThanOrEqual(width + 1)

      const report = await new AxeBuilder({ page })
        .include('[data-testid="public-playground-workspace"]')
        .analyze()

      expect(report.violations).toEqual([])
      await testInfo.attach(`public-playground-${width}.png`, {
        body: await workspace.screenshot({ scale: "css" }),
        contentType: "image/png",
      })
    }
  })
})
