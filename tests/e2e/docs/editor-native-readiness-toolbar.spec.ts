import type { LexicalEditor } from "lexical"

import { expect, test } from "@playwright/test"

declare global {
  interface HTMLDivElement {
    __lexicalEditor?: LexicalEditor
    reconnectReadinessRoot?: () => void
  }
}

test("SSR mutations stay unavailable until the native editor connects", async ({
  page,
}, testInfo) => {
  const scripts = Promise.withResolvers<void>()
  await page.route("**/assets/*.js", async (route) => {
    await scripts.promise
    await route.continue()
  })

  try {
    await page.goto("/components/editor", { waitUntil: "commit" })

    const editor = page.getByRole("textbox", {
      name: "Rich text editor",
      exact: true,
    })

    const toolbar = page.getByRole("toolbar", {
      name: "Rich text editor formatting",
      exact: true,
    })

    const bold = toolbar.getByRole("button", { name: "Bold", exact: true })

    await expect(editor).toBeVisible()
    await expect(editor).toHaveAttribute("contenteditable", "false")
    await expect(editor).toHaveAttribute("aria-readonly", "true")
    await expect(editor).not.toHaveAttribute("data-lexical-editor", "true")
    const controls = toolbar.getByRole("button")
    expect(await controls.count()).toBeGreaterThan(0)

    for (let index = 0; index < (await controls.count()); index += 1)
      await expect(controls.nth(index)).toBeDisabled()

    await editor.click()
    await page.keyboard.type("Unbound input")
    await expect(editor).toBeEmpty()
    await testInfo.attach("prehydration-native-readiness.html", {
      body: await page.content(),
      contentType: "text/html",
    })

    scripts.resolve()
    await expect(editor).toHaveAttribute("data-lexical-editor", "true")
    await expect(editor).toHaveAttribute("contenteditable", "true")
    await expect(editor).toHaveAttribute("aria-readonly", "false")
    await expect(bold).toBeEnabled()
    await editor.click()
    await editor.pressSequentially("Connected input survives")
    await expect(editor).toHaveText("Connected input survives")
    await editor.press("ControlOrMeta+a")
    await bold.click()
    await expect(editor.locator("strong, b")).toHaveText(
      "Connected input survives",
    )
    await expect(bold).toHaveAttribute("aria-pressed", "true")
    await editor.press("ControlOrMeta+z")
    await expect(editor.locator("strong, b")).toHaveCount(0)
    await expect(editor).toHaveText("Connected input survives")
    await editor.press("ControlOrMeta+Shift+z")
    await expect(editor.locator("strong, b")).toHaveText(
      "Connected input survives",
    )
    await testInfo.attach("connected-native-input.html", {
      body: await editor.innerHTML(),
      contentType: "text/html",
    })
  } finally {
    scripts.resolve()
    await page.unrouteAll({ behavior: "wait" })
  }
})

test("native read-only and root reconnection update mutation controls without losing content", async ({
  page,
}, testInfo) => {
  await page.goto("/components/editor")

  const editor = page.getByRole("textbox", {
    name: "Rich text editor",
    exact: true,
  })

  const bold = page
    .getByRole("toolbar", { name: "Rich text editor formatting", exact: true })
    .getByRole("button", { name: "Bold", exact: true })

  await expect(editor).toHaveAttribute("data-lexical-editor", "true")
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await expect(bold).toBeEnabled()
  await editor.click()
  await editor.pressSequentially("Native readiness text")

  const original = await editor.evaluate((element) => {
    if (!(element instanceof HTMLDivElement) || !element.__lexicalEditor)
      throw new Error("Missing connected native editor")

    const state = element.__lexicalEditor.getEditorState().toJSON()
    element.__lexicalEditor.setEditable(false)

    return state
  })

  await expect(editor).toHaveAttribute("contenteditable", "false")
  await expect(editor).toHaveAttribute("aria-readonly", "true")
  await expect(bold).toBeDisabled()
  await editor.click()
  await page.keyboard.type("Rejected read-only input")
  await expect(editor).toHaveText("Native readiness text")
  await editor.evaluate((element) => {
    if (!(element instanceof HTMLDivElement) || !element.__lexicalEditor)
      throw new Error("Missing connected native editor")

    element.__lexicalEditor.setEditable(true)
  })
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await expect(editor).toHaveAttribute("aria-readonly", "false")
  await expect(bold).toBeEnabled()
  await editor.evaluate((element) => {
    if (!(element instanceof HTMLDivElement) || !element.__lexicalEditor)
      throw new Error("Missing connected native editor")

    const native = element.__lexicalEditor
    element.reconnectReadinessRoot = () => native.setRootElement(element)
    native.setRootElement(null)
  })

  try {
    await expect(editor).toHaveAttribute("contenteditable", "false")
    await expect(editor).toHaveAttribute("aria-readonly", "true")
    await expect(bold).toBeDisabled()
  } finally {
    await editor.evaluate((element) => {
      if (!(element instanceof HTMLDivElement))
        throw new Error("Missing native editor element")

      element.reconnectReadinessRoot?.()
      delete element.reconnectReadinessRoot
    })
  }

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await expect(editor).toHaveAttribute("aria-readonly", "false")
  await expect(bold).toBeEnabled()
  await expect(editor).toHaveText("Native readiness text")

  const restored = await editor.evaluate((element) => {
    if (!(element instanceof HTMLDivElement) || !element.__lexicalEditor)
      throw new Error("Missing connected native editor")

    return element.__lexicalEditor.getEditorState().toJSON()
  })

  expect(restored).toEqual(original)
  await editor.click()
  await editor.press("ControlOrMeta+End")
  await editor.pressSequentially(" retained")
  await expect(editor).toHaveText("Native readiness text retained")
  await testInfo.attach("reconnected-native-state.json", {
    body: JSON.stringify(restored),
    contentType: "application/json",
  })
})

test("a connected read-only editor can still export its document", async ({
  page,
}, testInfo) => {
  await page.goto("/editor/docx-export-control")

  const editor = page.getByRole("textbox", {
    name: "Native Word document",
    exact: true,
  })

  await expect(editor).toHaveAttribute("data-lexical-editor", "true")
  await expect(editor).toHaveAttribute("contenteditable", "true")
  const before = await editor.innerText()
  await page
    .getByRole("button", { name: "Enable Word read-only", exact: true })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "false")
  await expect(editor).toHaveAttribute("aria-readonly", "true")

  const download = page.getByRole("button", {
    name: "Download Word document",
    exact: true,
  })

  await expect(download).toBeEnabled()
  const pending = page.waitForEvent("download")
  await download.click()
  const output = await pending
  expect(output.suggestedFilename()).toBe("document.docx")
  expect(await output.failure()).toBeNull()
  await output.saveAs(testInfo.outputPath("read-only-document.docx"))
  await expect(editor).toHaveText(before)
})
