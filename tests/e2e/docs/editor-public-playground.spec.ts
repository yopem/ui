import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Locator } from "@playwright/test"
import { readFile } from "node:fs/promises"

function mainEditable(workspace: Locator) {
  return workspace.locator(
    '[contenteditable="true"]:not(aside[aria-label="Document review"] section[aria-label="Thread public-playground-anchor"] [aria-label="Reply to thread public-playground-anchor"])',
  )
}

async function expectWorkspaceEditables(
  workspace: Locator,
  editor: Locator,
  replyCount: number,
  totalCount: number,
) {
  await expect(editor).toHaveCount(1)
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await expect(
    workspace.locator(
      'aside[aria-label="Document review"] section[aria-label="Thread public-playground-anchor"] [aria-label="Reply to thread public-playground-anchor"][contenteditable="true"]',
    ),
  ).toHaveCount(replyCount)
  await expect(workspace.locator('[contenteditable="true"]')).toHaveCount(
    totalCount,
  )
}

async function placeTableCaret(editor: Locator) {
  const paragraph = editor.locator(":scope > p").first()
  await paragraph.click()
  await editor.press("End")
  await expect(editor).toBeFocused()
  await expect
    .poll(() =>
      paragraph.evaluate((element) => {
        const selection = element.ownerDocument.getSelection()

        return (
          selection?.isCollapsed === true &&
          selection.anchorNode !== null &&
          selection.focusNode !== null &&
          element.contains(selection.anchorNode) &&
          element.contains(selection.focusNode)
        )
      }),
    )
    .toBe(true)
}

test.describe("Integrated playground workflows", () => {
  test.beforeEach(async ({ page }) => {
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

    await placeTableCaret(editor)
    await workspace
      .getByRole("toolbar", { name: "Integrated editor tools", exact: true })
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
    await expect(mainEditable(workspace)).toHaveCount(1)
    await expectWorkspaceEditables(workspace, editor, 1, 2)
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
      page.getByRole("dialog", { name: "AI command menu", exact: true }),
    ).toHaveCount(0)

    await editor.locator("p").first().selectText()
    await editor.press("ControlOrMeta+j")

    const dialog = page.getByRole("dialog", {
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
    await placeTableCaret(editor)
    await workspace
      .getByRole("toolbar", { name: "Integrated editor tools", exact: true })
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

  test("initial Insert table click works before placing an editor caret", async ({
    page,
  }) => {
    const workspace = page.getByTestId("public-playground-workspace")

    const editor = workspace.getByRole("textbox", {
      name: "Integrated playground editor",
      exact: true,
    })

    await expect(editor.locator("table")).toHaveCount(0)
    await workspace
      .getByRole("toolbar", { name: "Integrated editor tools", exact: true })
      .getByRole("button", { name: "Insert table", exact: true })
      .click()
    await expect(editor.getByRole("table")).toBeVisible()
  })

  test("locale and variant remount: resets host setup, document, and history", async ({
    page,
  }) => {
    const requests: string[] = []
    await page.route("**/api/editor-ai", async (route) => {
      requests.push(route.request().url())
      await route.abort()
    })
    const workspace = page.getByTestId("public-playground-workspace")

    const editor = workspace.getByRole("textbox", {
      name: "Integrated playground editor",
      exact: true,
    })

    await expect(editor).toHaveCount(1)
    await expect(mainEditable(workspace)).toHaveCount(1)
    await expectWorkspaceEditables(workspace, editor, 1, 2)
    await expect(
      workspace.getByRole("textbox", {
        name: "Reply to thread public-playground-anchor",
        exact: true,
      }),
    ).toHaveCount(1)
    await expect(
      workspace.getByRole("button", { name: "Configure AI menu", exact: true }),
    ).toHaveCount(1)
    await expect(
      workspace.getByRole("button", { name: "Configure Copilot", exact: true }),
    ).toHaveCount(0)
    await editor.fill("Unsaved draft")

    for (const [name, value] of [
      ["Host endpoint", `${new URL(page.url()).origin}/api/editor-ai`],
      ["Host document ID", "locale-document"],
      ["Host CSRF token", "locale-csrf"],
    ]) {
      const field = workspace.getByRole("textbox", { name, exact: true })
      await expect(field).toHaveCount(1)
      await field.fill(value)
    }

    await workspace
      .getByRole("button", { name: "Configure AI menu", exact: true })
      .click()
    await expect(
      workspace.getByRole("textbox", { name: /^Host / }),
    ).toHaveCount(0)
    await expect(editor).toHaveText("Unsaved draft")
    await expect(mainEditable(workspace)).toHaveCount(1)
    await expectWorkspaceEditables(workspace, editor, 1, 2)
    await expect.poll(() => requests.length).toBe(0)
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
    await expect(localizedEditor).toHaveCount(1)
    await expect(editor).toHaveCount(0)
    await expect(mainEditable(workspace)).toHaveCount(1)
    await expectWorkspaceEditables(workspace, localizedEditor, 1, 2)
    await expect(
      workspace.getByRole("button", { name: "配置 AI 菜单", exact: true }),
    ).toHaveCount(1)
    await expect(
      workspace.getByRole("button", { name: "Undo", exact: true }),
    ).toBeDisabled()

    for (const name of ["主机端点", "主机文档 ID", "主机 CSRF 令牌"]) {
      const field = workspace.getByRole("textbox", { name, exact: true })
      await expect(field).toHaveCount(1)
      await expect(field).toHaveValue("")
    }

    for (const name of ["加粗", "斜体", "下划线"]) {
      const command = workspace.getByRole("button", { name, exact: true })
      await expect(command).toHaveText("")
      await expect(command).toHaveAttribute("title", name)
      await expect(command.locator("svg")).toHaveAttribute(
        "aria-hidden",
        "true",
      )
    }

    await workspace
      .getByRole("button", { name: "Copilot", exact: true })
      .click()
    await expect(localizedEditor).toHaveAttribute("contenteditable", "true")
    await expect(localizedEditor.locator("h1")).toHaveText("集成原生编辑器")
    await expect(localizedEditor).toHaveCount(1)
    await expect(mainEditable(workspace)).toHaveCount(1)
    await expectWorkspaceEditables(workspace, localizedEditor, 1, 2)
    await expect(
      workspace.getByRole("button", { name: "配置 AI 菜单", exact: true }),
    ).toHaveCount(0)

    for (const [name, value] of [
      ["主机端点", `${new URL(page.url()).origin}/api/editor-ai`],
      ["主机文档 ID", "copilot-locale-document"],
      ["主机 CSRF 令牌", "copilot-locale-csrf"],
    ]) {
      const field = workspace.getByRole("textbox", { name, exact: true })
      await expect(field).toHaveCount(1)
      await expect(field).toHaveValue("")
      await field.fill(value)
    }

    await workspace
      .getByRole("button", { name: "配置 Copilot", exact: true })
      .click()
    await expect(workspace.getByRole("textbox", { name: /^主机/ })).toHaveCount(
      0,
    )
    await expect(localizedEditor).toHaveCount(1)
    await expect(mainEditable(workspace)).toHaveCount(1)
    await expectWorkspaceEditables(workspace, localizedEditor, 1, 2)
    await expect.poll(() => requests.length).toBe(0)
    await workspace
      .getByRole("button", { name: "English", exact: true })
      .click()
    await expect(
      workspace.getByRole("button", { name: "Configure Copilot", exact: true }),
    ).toHaveCount(1)
    await expect(
      workspace.getByRole("button", { name: "Configure AI menu", exact: true }),
    ).toHaveCount(0)
    await expect(localizedEditor).toHaveCount(0)
    await expect(editor).toHaveCount(1)
    await expect(mainEditable(workspace)).toHaveCount(1)
    await expectWorkspaceEditables(workspace, editor, 1, 2)

    for (const name of [
      "Host endpoint",
      "Host document ID",
      "Host CSRF token",
    ]) {
      const field = workspace.getByRole("textbox", { name, exact: true })
      await expect(field).toHaveCount(1)
      await expect(field).toHaveValue("")
    }

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
    await expect(normalEditor).toHaveCount(1)
    await expect(mainEditable(workspace)).toHaveCount(1)
    await expectWorkspaceEditables(workspace, normalEditor, 1, 2)
    await expect(
      workspace.getByRole("button", { name: "Configure AI menu", exact: true }),
    ).toHaveCount(1)
    await expect(
      workspace.getByRole("button", { name: "Configure Copilot", exact: true }),
    ).toHaveCount(0)
    await expect(
      workspace.getByRole("button", { name: "Undo", exact: true }),
    ).toBeDisabled()

    for (const name of [
      "Host endpoint",
      "Host document ID",
      "Host CSRF token",
    ]) {
      const field = workspace.getByRole("textbox", { name, exact: true })
      await expect(field).toHaveCount(1)
      await expect(field).toHaveValue("")
    }

    await expect.poll(() => requests.length).toBe(0)
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

    const viewDialog = page.getByRole("dialog", {
      name: "View drawing",
      exact: true,
    })

    await expect(viewDialog).toBeVisible()

    const report = await new AxeBuilder({ page }).analyze()

    expect(report.violations).toEqual([])
    await expect(
      viewDialog.getByRole("button", { name: "Apply drawing", exact: true }),
    ).toBeDisabled()
    await viewDialog
      .getByRole("button", { name: "Cancel drawing", exact: true })
      .click()
    await expect(viewDialog).toBeHidden()
    await expect(
      preview.getByRole("button", { name: "View drawing", exact: true }),
    ).toBeFocused()

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
      workspace.getByRole("button", { name: "Configure Copilot", exact: true }),
    ).toHaveCount(1)
    await expect(
      workspace.getByRole("button", { name: "Configure AI menu", exact: true }),
    ).toHaveCount(0)

    const editor = workspace.getByRole("textbox", {
      name: "Integrated playground editor",
      exact: true,
    })

    await expect(editor).toHaveCount(1)
    await expect(editor).toHaveAttribute("contenteditable", "true")
    await expect(mainEditable(workspace)).toHaveCount(1)
    await expectWorkspaceEditables(workspace, editor, 1, 2)
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
    await expect(mainEditable(workspace)).toHaveCount(1)
    await expectWorkspaceEditables(workspace, editor, 1, 2)
    await expect.poll(() => requests.length).toBe(0)

    await editor.press("ControlOrMeta+End")
    await placeTableCaret(editor)
    await workspace
      .getByRole("toolbar", { name: "Integrated editor tools", exact: true })
      .getByRole("button", { name: "Insert table", exact: true })
      .click()
    await expect(editor.getByRole("table")).toHaveCount(1)
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
    await expect(mainEditable(workspace)).toHaveCount(1)
    await expectWorkspaceEditables(workspace, editor, 1, 2)
    await expect(
      workspace.getByRole("textbox", { name: /^Host / }),
    ).toHaveCount(0)
    await expect(
      workspace.getByRole("button", { name: /^Configure (AI menu|Copilot)$/ }),
    ).toHaveCount(0)
    await expect(editor.getByRole("table")).toHaveCount(1)
    await editor.press("ControlOrMeta+z")
    await expect(editor.getByRole("table")).toHaveCount(0)
    await workspace.getByRole("button", { name: "Redo", exact: true }).click()
    await expect(editor.getByRole("table")).toHaveCount(1)
    await expect.poll(() => requests.length).toBe(0)

    for (const [variant, setup, absentSetup] of [
      ["Normal", "Configure AI menu", "Configure Copilot"],
      ["Copilot", "Configure Copilot", "Configure AI menu"],
    ]) {
      await workspace
        .getByRole("button", { name: variant, exact: true })
        .click()
      await expect(editor).toHaveCount(1)
      await expect(editor).toHaveAttribute("contenteditable", "true")
      await expect(mainEditable(workspace)).toHaveCount(1)
      await expectWorkspaceEditables(workspace, editor, 1, 2)
      await expect(editor.getByRole("table")).toHaveCount(0)
      await expect(editor.locator("h1")).toHaveText("Integrated native editor")
      await expect(
        workspace.getByRole("button", { name: setup, exact: true }),
      ).toHaveCount(1)
      await expect(
        workspace.getByRole("button", { name: absentSetup, exact: true }),
      ).toHaveCount(0)

      for (const name of [
        "Host endpoint",
        "Host document ID",
        "Host CSRF token",
      ]) {
        const field = workspace.getByRole("textbox", { name, exact: true })
        await expect(field).toHaveCount(1)
        await expect(field).toHaveValue("")
      }

      for (const name of ["Undo", "Redo"]) {
        await expect(
          workspace.getByRole("button", { name, exact: true }),
        ).toBeDisabled()
      }

      await expect.poll(() => requests.length).toBe(0)
    }
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

    const report = await new AxeBuilder({ page }).analyze()

    expect(report.violations).toEqual([])
  })

  for (const width of [1440, 768, 390]) {
    test(`responsive states: editor stays contained and accessible at ${width}px`, async ({
      page,
    }, testInfo) => {
      const workspace = page.getByTestId("public-playground-workspace")

      await page.setViewportSize({ width, height: 900 })
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBeLessThanOrEqual(width + 1)

      const report = await new AxeBuilder({ page }).analyze()

      expect(report.violations).toEqual([])
      await testInfo.attach(`public-playground-${width}.png`, {
        body: await workspace.screenshot({ scale: "css" }),
        contentType: "image/png",
      })
    })
  }
})
