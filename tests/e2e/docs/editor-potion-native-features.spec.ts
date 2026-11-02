import AxeBuilder from "@axe-core/playwright"
import {
  expect,
  test,
  type Locator,
  type Page,
  type TestInfo,
} from "@playwright/test"
import { z } from "zod"

const nativeNode = z.looseObject({
  type: z.string(),
  get children() {
    return z.array(nativeNode).optional()
  },
})

const nativeDocument = z.object({
  root: nativeNode.extend({ type: z.literal("root") }),
})

const imageURL = "https://media.test/potion-native-feature.svg"

const updatedImageURL = "https://media.test/potion-native-feature-updated.svg"

function nodesOfType(
  node: z.infer<typeof nativeNode>,
  type: string,
): z.infer<typeof nativeNode>[] {
  return [
    ...(node.type === type ? [node] : []),
    ...(node.children ?? []).flatMap((child) => nodesOfType(child, type)),
  ]
}

async function choosePage(page: Page, title: string) {
  const workspace = page.getByTestId("notion-like-workspace")

  const trigger = workspace.getByRole("button", {
    name: "Open workspace pages",
    exact: true,
  })

  if (await trigger.isVisible()) {
    await trigger.click()

    const sheet = page.getByRole("dialog", {
      name: "Workspace pages",
      exact: true,
    })

    await sheet.getByRole("button", { name: title, exact: true }).click()
    await expect(sheet).toBeHidden()
    await expect(trigger).toBeFocused()
  } else {
    await workspace
      .getByRole("navigation", { name: "Workspace pages", exact: true })
      .getByRole("button", { name: title, exact: true })
      .click()
  }

  await expect(
    workspace.getByRole("textbox", { name: "Page title", exact: true }),
  ).toHaveValue(title)
}

async function openFeature(page: Page, title: string) {
  await page.goto("/editor/examples/notion-like")
  const workspace = page.getByTestId("notion-like-workspace")

  const editor = workspace.getByRole("textbox", {
    name: "Workspace document",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await choosePage(page, title)
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await expect(workspace.locator('[contenteditable="true"]')).toHaveCount(1)

  return { workspace, editor }
}

async function captureState(page: Page, info: TestInfo, name: string) {
  const report = await new AxeBuilder({ page }).analyze()
  await info.attach(`${name}-axe.json`, {
    body: JSON.stringify(report, null, 2),
    contentType: "application/json",
  })
  await info.attach(`${name}.png`, {
    body: await page.screenshot({ fullPage: true, scale: "css" }),
    contentType: "image/png",
  })
  expect(report.violations).toEqual([])
}

async function copyDocument(workspace: Locator, info: TestInfo, name: string) {
  const page = workspace.page()
  await page.evaluate(() => navigator.clipboard.writeText(""))
  await workspace
    .getByRole("button", { name: "Copy page JSON", exact: true })
    .click()
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .not.toBe("")
  const source = await page.evaluate(() => navigator.clipboard.readText())
  const document = nativeDocument.parse(JSON.parse(source))
  await info.attach(`${name}.json`, {
    body: source,
    contentType: "application/json",
  })

  return document
}

async function reopenFeature(
  workspace: Locator,
  title: string,
  document: z.infer<typeof nativeDocument>,
  info: TestInfo,
) {
  await choosePage(workspace.page(), "Playground")
  await choosePage(workspace.page(), title)
  await expect(
    workspace.getByRole("textbox", { name: "Workspace document", exact: true }),
  ).toHaveAttribute("contenteditable", "true")
  expect(await copyDocument(workspace, info, "feature-remounted")).toEqual(
    document,
  )
}

async function lockWorkspace(workspace: Locator, editor: Locator) {
  await workspace
    .getByRole("button", { name: "Make workspace read-only", exact: true })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "false")
  await expect(editor).toHaveAttribute("aria-readonly", "true")
  await expect(
    workspace.getByRole("button", { name: "Undo", exact: true }),
  ).toBeDisabled()
  await editor.press("End")
  await editor.press("x")
}

async function placeLinkCaret(editor: Locator, link: Locator) {
  await link.click()
  await expect(editor).toBeFocused()
  await expect
    .poll(() =>
      link.evaluate((element) => {
        const selection = element.ownerDocument.getSelection()

        return (
          selection?.isCollapsed === true &&
          element.contains(selection.anchorNode) &&
          element.contains(selection.focusNode)
        )
      }),
    )
    .toBe(true)
}

test.beforeEach(async ({ context, baseURL }) => {
  test.slow()

  if (!baseURL) throw new Error("The docs baseURL is required.")
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: new URL(baseURL).origin,
  })
})

test("P1 Link uses native caret actions, URL validation, history and read-only @a11y", async ({
  page,
}, info) => {
  const { workspace, editor } = await openFeature(page, "Link")
  const link = editor.getByRole("link").first()
  await expect(link).toBeVisible()
  const originalURL = await link.getAttribute("href")
  const originalText = await link.innerText()

  if (!originalURL) throw new Error("The Link page needs a native safe link.")
  const safeURL = new URL(originalURL)
  expect(safeURL.protocol).toBe("https:")
  expect(safeURL.username).toBe("")
  expect(safeURL.password).toBe("")
  await placeLinkCaret(editor, link)

  const toolbar = page.getByRole("toolbar", {
    name: "Selected link",
    exact: true,
  })

  await expect(toolbar).toBeVisible()
  await expect(
    toolbar.getByRole("link", { name: "Open link", exact: true }),
  ).toHaveAttribute("href", originalURL)
  await expect(
    toolbar.getByRole("link", { name: "Open link", exact: true }),
  ).toHaveAttribute("rel", /noopener/)
  await captureState(page, info, "link-caret")
  await editor.press("Alt+F10")
  await expect(
    toolbar.getByRole("link", { name: "Open link", exact: true }),
  ).toBeFocused()
  await page.keyboard.press("ArrowRight")
  await expect(
    toolbar.getByRole("button", { name: "Edit link", exact: true }),
  ).toBeFocused()
  await page.keyboard.press("Enter")
  const dialog = page.getByRole("dialog", { name: "Link", exact: true })
  const url = dialog.getByRole("textbox", { name: "Link URL", exact: true })
  await expect(url).toHaveValue(originalURL)
  await url.fill("javascript:alert(1)")
  await dialog.getByRole("button", { name: "Apply link", exact: true }).click()
  await expect(dialog.getByRole("alert")).toBeVisible()
  await expect(link).toHaveAttribute("href", originalURL)
  await captureState(page, info, "link-invalid-url")
  const updatedURL = "https://example.org/potion-native-link"
  await url.fill(updatedURL)
  await dialog.getByRole("button", { name: "Apply link", exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await expect(link).toHaveAttribute("href", updatedURL)
  await expect(editor).toBeFocused()
  const updated = await copyDocument(workspace, info, "link-edited")
  expect(nodesOfType(updated.root, "link")).toEqual(
    expect.arrayContaining([expect.objectContaining({ url: updatedURL })]),
  )
  await workspace.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(link).toHaveAttribute("href", originalURL)
  await workspace.getByRole("button", { name: "Redo", exact: true }).click()
  await expect(link).toHaveAttribute("href", updatedURL)
  await placeLinkCaret(editor, link)
  await toolbar
    .getByRole("button", { name: "Remove link", exact: true })
    .click()
  await expect(
    editor.getByRole("link", { name: originalText, exact: true }),
  ).toHaveCount(0)
  await expect(editor).toContainText(originalText)
  await workspace.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(link).toHaveAttribute("href", updatedURL)
  await reopenFeature(workspace, "Link", updated, info)
  await expect(link).toHaveAttribute("href", updatedURL)
  await placeLinkCaret(editor, link)
  await lockWorkspace(workspace, editor)
  await expect(toolbar).toHaveCount(0)
  expect(await copyDocument(workspace, info, "link-readonly")).toEqual(updated)
  await captureState(page, info, "link-readonly")
})

test("P2 Mention selects explicit demo identities with keyboard and pointer @a11y", async ({
  page,
}, info) => {
  const { workspace, editor } = await openFeature(page, "Mention")
  await editor.fill("")
  await editor.pressSequentially("@Ada")

  const suggestions = page.getByRole("listbox", {
    name: "Editor suggestions",
    exact: true,
  })

  const ada = suggestions.getByRole("option", {
    name: "Ada Lovelace",
    exact: true,
  })

  await expect(ada).toBeVisible()
  await expect(editor).toBeFocused()
  await editor.press("ArrowDown")
  await expect(editor).toBeFocused()
  const optionId = await ada.getAttribute("id")

  if (!optionId) throw new Error("The active mention option needs an ID.")
  await expect(editor).toHaveAttribute("aria-activedescendant", optionId)
  await captureState(page, info, "mention-options")
  await editor.press("Enter")
  const mentions = editor.locator('[data-slot="editor-mention"]')
  await expect(mentions).toHaveCount(1)
  await expect(mentions.first()).toHaveText("@Ada Lovelace")
  await expect(suggestions).toHaveCount(0)
  await expect(editor).toBeFocused()
  const selected = await copyDocument(workspace, info, "mention-ada")
  expect(nodesOfType(selected.root, "mention")).toEqual([
    expect.objectContaining({
      mode: "token",
      identity: { id: "docs-fixture-ada", label: "Ada Lovelace" },
    }),
  ])
  await workspace.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(mentions).toHaveCount(0)
  await workspace.getByRole("button", { name: "Redo", exact: true }).click()
  await expect(mentions).toHaveCount(1)
  await editor.click()
  await editor.press("ControlOrMeta+End")
  await editor.pressSequentially(" @Grace")
  await suggestions
    .getByRole("option", { name: "Grace Hopper", exact: true })
    .click()
  await expect(mentions).toHaveCount(2)
  const pointer = await copyDocument(workspace, info, "mention-pointer")
  expect(nodesOfType(pointer.root, "mention")).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        identity: { id: "docs-fixture-grace", label: "Grace Hopper" },
      }),
    ]),
  )
  await captureState(page, info, "mention-inserted")
  await reopenFeature(workspace, "Mention", pointer, info)
  await expect(mentions).toHaveCount(2)
  await editor.click()
  await editor.press("ControlOrMeta+End")
  await editor.pressSequentially(" @Katherine")
  await lockWorkspace(workspace, editor)
  await expect(suggestions).toHaveCount(0)
  const locked = await copyDocument(workspace, info, "mention-readonly")
  expect(nodesOfType(locked.root, "mention")).toEqual(
    nodesOfType(pointer.root, "mention"),
  )
  await captureState(page, info, "mention-readonly")
})

test("P6 Callout edits native content and retains its structure through history @a11y", async ({
  page,
}, info) => {
  const { workspace, editor } = await openFeature(page, "Callout")
  const callout = editor.locator("aside[data-editor-callout]")
  await expect(callout).toHaveCount(1)
  await callout.locator("p").last().click()
  await editor.press("End")
  await editor.pressSequentially(" Native callout marker")
  await expect(callout).toContainText("Native callout marker")
  const edited = await copyDocument(workspace, info, "callout-edited")
  const callouts = nodesOfType(edited.root, "editor-callout")
  expect(callouts).toHaveLength(1)
  expect(callouts.flatMap((node) => nodesOfType(node, "text"))).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        text: expect.stringContaining("Native callout marker"),
      }),
    ]),
  )
  await workspace.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(callout).not.toContainText("Native callout marker")
  await workspace.getByRole("button", { name: "Redo", exact: true }).click()
  await expect(callout).toContainText("Native callout marker")
  await captureState(page, info, "callout-edited")
  await reopenFeature(workspace, "Callout", edited, info)
  await expect(callout).toContainText("Native callout marker")
  await lockWorkspace(workspace, editor)
  expect(await copyDocument(workspace, info, "callout-readonly")).toEqual(
    edited,
  )
  await captureState(page, info, "callout-readonly")
})

test("P7 Equation inserts MathML, edits, cancels, rejects invalid TeX and supports history @a11y", async ({
  page,
}, info) => {
  const { workspace, editor } = await openFeature(page, "Equation")
  await editor.fill("Equation workflow ")
  await editor.press("End")
  await workspace
    .getByRole("button", { name: "Insert inline equation", exact: true })
    .click()

  const insert = page.getByRole("dialog", {
    name: "Insert equation",
    exact: true,
  })

  await insert
    .getByRole("textbox", { name: "TeX expression", exact: true })
    .fill("x^2")
  const preview = insert.getByRole("math", { name: "x^2", exact: true })
  await expect(preview).toBeVisible()
  expect(
    await preview.evaluate((element) => ({
      namespace: element.namespaceURI,
      tag: element.localName,
    })),
  ).toEqual({ namespace: "http://www.w3.org/1998/Math/MathML", tag: "math" })
  await captureState(page, info, "equation-insert-dialog")
  await insert
    .getByRole("button", { name: "Apply equation", exact: true })
    .click()
  await expect(insert).toHaveCount(0)
  await expect(editor).toBeFocused()
  const equation = editor.locator('[data-editor-math="inline"]')
  await expect(equation.locator("math")).toBeVisible()
  expect(
    await equation.locator("math").evaluate((element) => element.namespaceURI),
  ).toBe("http://www.w3.org/1998/Math/MathML")
  await equation.click()
  await workspace
    .getByRole("button", { name: "Edit equation", exact: true })
    .click()
  const edit = page.getByRole("dialog", { name: "Edit equation", exact: true })
  const tex = edit.getByRole("textbox", { name: "TeX expression", exact: true })
  await tex.fill("y^3")
  await edit.getByRole("button", { name: "Cancel", exact: true }).click()
  await expect(edit).toHaveCount(0)
  await expect(editor).toBeFocused()
  await expect(equation).toHaveAttribute("data-editor-tex", "x^2")
  await equation.click()
  await workspace
    .getByRole("button", { name: "Edit equation", exact: true })
    .click()
  await tex.fill("\\frac{")
  await expect(edit.getByRole("alert")).toBeVisible()
  await expect(
    edit.getByRole("button", { name: "Apply equation", exact: true }),
  ).toBeDisabled()
  await expect(
    workspace
      .locator('[data-slot="editor-content"][aria-label="Workspace document"]')
      .locator('[data-editor-math="inline"]'),
  ).toHaveAttribute("data-editor-tex", "x^2")
  await captureState(page, info, "equation-invalid")
  await tex.fill("y^3")
  await edit
    .getByRole("button", { name: "Apply equation", exact: true })
    .click()
  await expect(equation).toHaveAttribute("data-editor-tex", "y^3")
  await workspace.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(equation).toHaveAttribute("data-editor-tex", "x^2")
  await workspace.getByRole("button", { name: "Redo", exact: true }).click()
  await expect(equation).toHaveAttribute("data-editor-tex", "y^3")
  await editor.click()
  await editor.press("ControlOrMeta+End")
  await editor.press("Enter")
  await workspace
    .getByRole("button", { name: "Insert block equation", exact: true })
    .click()
  await insert
    .getByRole("textbox", { name: "TeX expression", exact: true })
    .fill("\\frac{1}{2}")
  await insert
    .getByRole("button", { name: "Apply equation", exact: true })
    .click()
  await expect(editor.locator('[data-editor-math="block"] math')).toBeVisible()
  const complete = await copyDocument(workspace, info, "equations-complete")
  expect(nodesOfType(complete.root, "editor-math")).toEqual([
    expect.objectContaining({ kind: "inline", tex: "y^3" }),
    expect.objectContaining({ kind: "block", tex: "\\frac{1}{2}" }),
  ])
  await captureState(page, info, "equations-native")
  await reopenFeature(workspace, "Equation", complete, info)
  await expect(equation.locator("math")).toBeVisible()
  await expect(editor.locator('[data-editor-math="block"] math')).toBeVisible()
  await lockWorkspace(workspace, editor)

  for (const name of [
    "Insert inline equation",
    "Insert block equation",
    "Edit equation",
  ]) {
    await expect(
      workspace.getByRole("button", { name, exact: true }),
    ).toBeDisabled()
  }

  expect(await copyDocument(workspace, info, "equations-readonly")).toEqual(
    complete,
  )
  await captureState(page, info, "equations-readonly")
})

test("P11 contents track native headings, navigate and insert through controls and slash @a11y", async ({
  page,
}, info) => {
  const { workspace, editor } = await openFeature(page, "Table of Contents")
  const contents = editor.locator("[data-editor-toc]")
  await expect(contents).toHaveCount(1)
  const heading = editor.getByRole("heading").first()
  await expect(heading).toBeVisible()
  const originalTitle = await heading.innerText()
  await contents.getByRole("link", { name: originalTitle, exact: true }).click()
  await expect(heading).toBeFocused()
  await page.keyboard.insertText("Native TOC marker ")

  const renamed = editor.getByRole("heading", {
    name: `Native TOC marker ${originalTitle}`,
    exact: true,
  })

  await expect(renamed).toBeVisible()
  await expect(
    contents.getByRole("link", {
      name: `Native TOC marker ${originalTitle}`,
      exact: true,
    }),
  ).toBeVisible()
  await editor.click()
  await editor.press("ControlOrMeta+End")
  await editor.press("Enter")
  await workspace
    .getByRole("button", { name: "Insert table of contents", exact: true })
    .click()
  await expect(contents).toHaveCount(2)
  await workspace.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(contents).toHaveCount(1)
  await workspace.getByRole("button", { name: "Redo", exact: true }).click()
  await expect(contents).toHaveCount(2)
  await captureState(page, info, "toc-control-inserted")
  await workspace.getByRole("button", { name: "Undo", exact: true }).click()
  await editor.click()
  await editor.press("ControlOrMeta+End")
  await editor.press("Enter")
  await editor.pressSequentially("/toc")

  const suggestions = page.getByRole("listbox", {
    name: "Editor suggestions",
    exact: true,
  })

  await expect(
    suggestions.getByRole("option", { name: "Table of contents", exact: true }),
  ).toBeVisible()
  await captureState(page, info, "toc-slash-options")
  await editor.press("Enter")
  await expect(suggestions).toHaveCount(0)
  await expect(contents).toHaveCount(2)
  await expect(
    editor.getByRole("navigation", {
      name: "Table of contents 1",
      exact: true,
    }),
  ).toBeVisible()
  await expect(
    editor.getByRole("navigation", {
      name: "Table of contents 2",
      exact: true,
    }),
  ).toBeVisible()

  for (const toc of await contents.all()) {
    await toc
      .getByRole("link", {
        name: `Native TOC marker ${originalTitle}`,
        exact: true,
      })
      .click()
    await expect(renamed).toBeFocused()
    await expect
      .poll(() =>
        renamed.evaluate((element) => {
          const selection = element.ownerDocument.getSelection()

          return (
            selection?.isCollapsed === true &&
            element.contains(selection.anchorNode)
          )
        }),
      )
      .toBe(true)
  }

  const complete = await copyDocument(workspace, info, "toc-complete")
  expect(nodesOfType(complete.root, "editor-toc")).toHaveLength(2)
  await captureState(page, info, "toc-multiple-landmarks")
  await reopenFeature(workspace, "Table of Contents", complete, info)
  await expect(contents).toHaveCount(2)
  await lockWorkspace(workspace, editor)
  await expect(
    workspace.getByRole("button", {
      name: "Insert table of contents",
      exact: true,
    }),
  ).toBeDisabled()
  await contents
    .first()
    .getByRole("link", {
      name: `Native TOC marker ${originalTitle}`,
      exact: true,
    })
    .click()
  await expect(renamed).toBeFocused()
  expect(await copyDocument(workspace, info, "toc-readonly")).toEqual(complete)
  await captureState(page, info, "toc-readonly-navigation")
})

for (const title of ["Media Toolbar", "Upload"]) {
  test(`${title} uses URL insertion and bounded selected image controls, not an upload service @a11y`, async ({
    page,
  }, info) => {
    await page.route("https://media.test/**", (route) =>
      route.fulfill({
        contentType: "image/svg+xml",
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="320" height="180" fill="gray"/></svg>',
      }),
    )
    const { workspace, editor } = await openFeature(page, title)
    await editor.click()
    await editor.press("ControlOrMeta+End")
    await editor.press("Enter")
    const media = editor.locator('[data-slot="editor-media"]')
    const count = await media.count()
    await workspace
      .getByRole("button", { name: "Insert image", exact: true })
      .click()

    const insert = page.getByRole("dialog", {
      name: "Insert image",
      exact: true,
    })

    const url = insert.getByRole("textbox", { name: "Media URL", exact: true })
    await expect(insert.locator('input[type="file"]')).toHaveCount(0)

    for (const invalid of [
      "https://user:secret@media.test/private.svg",
      "http://media.test/private.svg",
    ]) {
      await url.fill(invalid)
      await insert.getByRole("button", { name: "Insert", exact: true }).click()
      await expect(insert.getByRole("alert").first()).toBeVisible()
      await expect(
        workspace
          .locator(
            '[data-slot="editor-content"][aria-label="Workspace document"]',
          )
          .locator('[data-slot="editor-media"]'),
      ).toHaveCount(count)
    }

    await captureState(page, info, "media-invalid-insert-url")
    await url.fill(imageURL)
    await insert.getByRole("button", { name: "Insert", exact: true }).click()
    await expect(insert).toHaveCount(0)
    await expect(media).toHaveCount(count + 1)
    const image = media.filter({ has: page.locator(`img[src="${imageURL}"]`) })
    await expect(image).toHaveCount(1)
    await expect
      .poll(() =>
        image
          .locator("img")
          .evaluate((element: HTMLImageElement) => element.naturalWidth),
      )
      .toBeGreaterThan(0)
    await image
      .getByRole("toolbar", { name: "Media actions", exact: true })
      .getByRole("button", { name: "Select media", exact: true })
      .click()

    const controls = workspace.getByRole("group", {
      name: "Selected image controls",
      exact: true,
    })

    const edit = controls.getByRole("button", {
      name: "Edit media source",
      exact: true,
    })

    await expect(edit).toBeEnabled()
    await edit.click()

    const dialog = page.getByRole("dialog", {
      name: "Edit media source",
      exact: true,
    })

    for (const invalid of [
      "javascript:alert(1)",
      "https://user:secret@media.test/private.svg",
      "https://media.test/private.svg?token=secret",
      "https://media.test/private.svg#secret",
    ]) {
      await dialog
        .getByRole("textbox", { name: "Media URL", exact: true })
        .fill(invalid)
      await dialog
        .getByRole("button", { name: "Apply source", exact: true })
        .click()
      await expect(dialog.getByRole("alert")).toBeVisible()
      await expect(
        workspace
          .locator(
            '[data-slot="editor-content"][aria-label="Workspace document"]',
          )
          .locator('[data-slot="editor-media"]')
          .filter({ has: page.locator(`img[src="${imageURL}"]`) })
          .locator("img"),
      ).toHaveAttribute("src", imageURL)
    }

    await captureState(page, info, "media-invalid-source")
    await dialog
      .getByRole("textbox", { name: "Media URL", exact: true })
      .fill(updatedImageURL)
    await dialog
      .getByRole("button", { name: "Apply source", exact: true })
      .click()

    const updated = media.filter({
      has: page.locator(`img[src="${updatedImageURL}"]`),
    })

    await expect(updated).toHaveCount(1)
    await expect(media).toHaveCount(count + 1)
    await workspace.getByRole("button", { name: "Undo", exact: true }).click()
    await expect(image).toHaveCount(1)
    await workspace.getByRole("button", { name: "Redo", exact: true }).click()
    await expect(updated).toHaveCount(1)
    await updated
      .getByRole("toolbar", { name: "Media actions", exact: true })
      .getByRole("button", { name: "Select media", exact: true })
      .click()

    const caption = controls.getByRole("textbox", {
      name: "Selected caption",
      exact: true,
    })

    const captionText = "Native caption\nSecond <line> & text"
    await caption.fill(captionText)
    await expect(updated.locator("figcaption")).toHaveText(captionText)
    await expect(caption).toHaveAttribute("maxlength", "10000")
    await workspace.getByRole("button", { name: "Undo", exact: true }).click()
    await expect(updated.locator("figcaption")).toHaveCount(0)
    await workspace.getByRole("button", { name: "Redo", exact: true }).click()
    await expect(updated.locator("figcaption")).toHaveText(captionText)
    await updated
      .getByRole("toolbar", { name: "Media actions", exact: true })
      .getByRole("button", { name: "Select media", exact: true })
      .click()

    const width = controls.getByRole("slider", {
      name: "Image width",
      exact: true,
    })

    const initialWidth = Number(await width.getAttribute("aria-valuenow"))
    expect(Number.isFinite(initialWidth)).toBe(true)
    expect(initialWidth).toBeGreaterThanOrEqual(64)
    await width.press("ArrowRight")
    const resizedWidth = Number(await width.getAttribute("aria-valuenow"))
    expect(resizedWidth).toBeGreaterThan(initialWidth)
    expect(resizedWidth).toBeLessThanOrEqual(4096)
    await workspace.getByRole("button", { name: "Undo", exact: true }).click()
    await updated
      .getByRole("toolbar", { name: "Media actions", exact: true })
      .getByRole("button", { name: "Select media", exact: true })
      .click()
    await expect(width).toHaveAttribute("aria-valuenow", String(initialWidth))
    await workspace.getByRole("button", { name: "Redo", exact: true }).click()
    await updated
      .getByRole("toolbar", { name: "Media actions", exact: true })
      .getByRole("button", { name: "Select media", exact: true })
      .click()
    await expect(width).toHaveAttribute("aria-valuenow", String(resizedWidth))
    await controls
      .getByRole("button", { name: "Align end", exact: true })
      .click()
    await expect(updated).toHaveAttribute("data-alignment", "end")
    const complete = await copyDocument(workspace, info, "media-complete")
    expect(nodesOfType(complete.root, "yopem-media")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          media: expect.objectContaining({
            kind: "image",
            url: updatedImageURL,
            caption: captionText,
            width: resizedWidth,
            alignment: "end",
          }),
        }),
      ]),
    )
    await updated
      .getByRole("toolbar", { name: "Media actions", exact: true })
      .getByRole("button", { name: "Select media", exact: true })
      .click()
    await captureState(page, info, "media-selected")
    await controls
      .getByRole("button", { name: "Delete media", exact: true })
      .click()
    await expect(media).toHaveCount(count)
    await workspace.getByRole("button", { name: "Undo", exact: true }).click()
    await expect(updated).toHaveCount(1)
    await reopenFeature(workspace, title, complete, info)
    await expect(updated.locator("figcaption")).toHaveText(captionText)
    await updated
      .getByRole("toolbar", { name: "Media actions", exact: true })
      .getByRole("button", { name: "Select media", exact: true })
      .click()
    await lockWorkspace(workspace, editor)
    await expect(edit).toBeDisabled()
    await expect(caption).toBeDisabled()
    await expect(width).toBeDisabled()
    await expect(
      controls.getByRole("button", { name: "Delete media", exact: true }),
    ).toBeDisabled()
    await expect(
      workspace.getByRole("button", { name: "Insert image", exact: true }),
    ).toBeDisabled()
    expect(await copyDocument(workspace, info, "media-readonly")).toEqual(
      complete,
    )
    await captureState(page, info, "media-readonly")
  })
}
