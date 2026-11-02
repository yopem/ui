import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Locator } from "@playwright/test"
import {
  COMMAND_PRIORITY_HIGH,
  type CommandListenerPriority,
  type LexicalEditor,
} from "lexical"

declare global {
  interface HTMLDivElement {
    __lexicalEditor?: LexicalEditor
    releaseToolbarVeto?: () => void
    toolbarVetoCount?: number
  }
}

type NativeCommandPayload = Parameters<
  Parameters<LexicalEditor["registerCommand"]>[1]
>[0]

interface ToolbarVetoOptions {
  veto: "capture" | "command-consume" | "command-prevent"
  priority: CommandListenerPriority
}

async function expectBoundedControls(toolbar: Locator, viewportWidth: number) {
  await expect
    .poll(() =>
      toolbar.evaluate((element, width) => {
        const bounds = element.getBoundingClientRect()

        const controls = Array.from(
          element.querySelectorAll('button, [role="button"]'),
          (control) => control.getBoundingClientRect(),
        )

        return {
          toolbarHasLayout:
            element.isConnected && bounds.width > 0 && bounds.height > 0,
          toolbarStartsInViewport: bounds.x >= 0,
          toolbarEndsInViewport: bounds.right <= width,
          hasControls: controls.length > 0,
          controlsHaveLayout: controls.every(
            (box) => box.width > 0 && box.height > 0,
          ),
          controlsStartInside: controls.every((box) => box.x >= bounds.x - 1),
          controlsEndInside: controls.every(
            (box) => box.right <= bounds.right + 1,
          ),
        }
      }, viewportWidth),
    )
    .toEqual({
      toolbarHasLayout: true,
      toolbarStartsInViewport: true,
      toolbarEndsInViewport: true,
      hasControls: true,
      controlsHaveLayout: true,
      controlsStartInside: true,
      controlsEndInside: true,
    })
}

async function expectEditableRoot(editor: Locator) {
  await expect(editor).toHaveAttribute("data-lexical-editor", "true")
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await expect(editor).toHaveAttribute("aria-readonly", "false")
}

for (const width of [390, 768, 1280]) {
  test(`fixed toolbar groups fit at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 960 })
    await page.goto("/editor/fixed-toolbar")

    const toolbar = page.getByRole("toolbar", {
      name: "Toolbar menu document formatting",
      exact: true,
    })

    await expectEditableRoot(
      page.getByRole("textbox", { name: "Toolbar menu document", exact: true }),
    )
    await expect(toolbar).toBeVisible()
    const bold = toolbar.getByRole("button", { name: "Bold", exact: true })
    await expect(bold).toBeEnabled()
    await expectBoundedControls(toolbar, width)
    await bold.focus()
    await bold.press("ArrowRight")
    await expect(
      toolbar.getByRole("button", { name: "Italic", exact: true }),
    ).toBeFocused()
    await page.screenshot({
      path: testInfo.outputPath(`fixed-toolbar-${width}.png`),
      scale: "css",
    })
  })

  test(`floating toolbar groups fit at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 960 })
    await page.goto("/editor/floating-toolbar-buttons")

    const editor = page.getByRole("textbox", {
      name: "Grouped floating document",
      exact: true,
    })

    await expectEditableRoot(editor)
    await editor.click()
    await editor.press("ControlOrMeta+a")

    const toolbar = page.getByRole("toolbar", {
      name: "Grouped floating formatting",
      exact: true,
    })

    await expect(toolbar).toBeVisible()

    const firstEnabled = toolbar
      .locator(
        'button:not(:disabled):not([aria-disabled="true"]), a[href]:not([aria-disabled="true"])',
      )
      .first()

    await expect(firstEnabled).toBeEnabled()
    await expectBoundedControls(toolbar, width)
    await editor.press("Alt+F10")
    await expect(firstEnabled).toBeFocused()
    await page.keyboard.press("ArrowRight")
    await expect(
      toolbar.getByRole("button", { name: "Italic", exact: true }),
    ).toBeFocused()
    await page.screenshot({
      path: testInfo.outputPath(`floating-toolbar-${width}.png`),
      scale: "css",
    })
    await page.keyboard.press("Escape")
    await expect(editor).toBeFocused()
  })

  test(`core preset controls stay bounded and keyboard-operable at ${width}px @a11y`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 960 })
    await page.goto("/components/editor")

    const editor = page.getByRole("textbox", {
      name: "Rich text editor",
      exact: true,
    })

    const toolbar = page.getByRole("toolbar", {
      name: "Rich text editor formatting",
      exact: true,
    })

    await expectEditableRoot(editor)
    await expect(toolbar).toBeVisible()
    await expect(
      toolbar.getByRole("button", { name: "Bold", exact: true }),
    ).toBeEnabled()
    await expectBoundedControls(toolbar, width)
    await editor.click()
    await editor.pressSequentially("Preset text")
    await editor.press("ControlOrMeta+a")
    const bold = toolbar.getByRole("button", { name: "Bold", exact: true })
    await bold.click()
    await expect(editor.locator("strong, b")).toContainText("Preset text")
    await bold.focus()
    await bold.press("ArrowRight")
    const italic = toolbar.getByRole("button", { name: "Italic", exact: true })
    await expect(italic).toBeFocused()
    await italic.press("Enter")
    await expect(italic).toHaveAttribute("aria-pressed", "true")
    await expect(bold).toHaveAttribute("aria-pressed", "true")
    const text = editor.getByText("Preset text", { exact: true })
    await expect(text).toHaveCSS("font-style", "italic")
    await expect(text).toHaveCSS("font-weight", "600")
    await expect(editor).toHaveText("Preset text")
    await expect
      .poll(() =>
        editor.evaluate((element) => {
          if (!(element instanceof HTMLDivElement) || !element.__lexicalEditor)
            throw new Error("Missing connected native editor")

          return element.__lexicalEditor.getEditorState().toJSON().root.children
        }),
      )
      .toMatchObject([{ children: [{ text: "Preset text", format: 3 }] }])
    await editor.press("ControlOrMeta+z")
    await expect(italic).toHaveAttribute("aria-pressed", "false")
    await expect(editor.locator("strong, b")).toHaveText("Preset text")
    await expect(editor.getByText("Preset text", { exact: true })).toHaveCSS(
      "font-style",
      "normal",
    )
    const report = await new AxeBuilder({ page }).analyze()
    expect(report.violations).toEqual([])
    await testInfo.attach("core-toolbar-accessibility.json", {
      body: JSON.stringify(report),
      contentType: "application/json",
    })
    await page.screenshot({
      path: testInfo.outputPath(`core-preset-${width}.png`),
      scale: "css",
    })
  })
}

for (const veto of ["capture", "command-consume", "command-prevent"] as const) {
  test(`floating shortcut preserves ${veto} host veto`, async ({
    page,
  }, testInfo) => {
    await page.goto("/editor/floating-toolbar-buttons")

    const editor = page.getByRole("textbox", {
      name: "Grouped floating document",
      exact: true,
    })

    const toolbar = page.getByRole("toolbar", {
      name: "Grouped floating formatting",
      exact: true,
    })

    await expectEditableRoot(editor)
    const hostChecks = page.getByLabel("Advanced host checks", { exact: true })
    const disclosure = page.locator("details").filter({ has: hostChecks })

    const showDisabled = page.getByRole("checkbox", {
      name: "Show disabled controls",
      exact: true,
    })

    await hostChecks.click()
    await expect(disclosure).toHaveAttribute("open", "")
    await expect(showDisabled).toBeVisible()
    await hostChecks.press("Space")
    await expect(disclosure).not.toHaveAttribute("open", "")
    await expect(showDisabled).toBeHidden()
    await hostChecks.press("Enter")
    await expect(disclosure).toHaveAttribute("open", "")
    await expect(showDisabled).toBeVisible()
    await showDisabled.check()
    await editor.click()
    await editor.press("ControlOrMeta+a")
    await expect(toolbar).toBeVisible()
    await expect(
      toolbar.getByRole("button", { name: "Unavailable bold", exact: true }),
    ).toBeDisabled()
    await expect(
      toolbar.getByRole("button", { name: "Unavailable italic", exact: true }),
    ).toBeDisabled()
    const original = await editor.innerText()

    await editor.evaluate(
      (element, { veto, priority }: ToolbarVetoOptions) => {
        if (!(element instanceof HTMLDivElement) || !element.__lexicalEditor)
          throw new Error("Missing connected native editor")

        const probe = element
        const native = probe.__lexicalEditor
        const view = probe.ownerDocument.defaultView

        if (!native || !view) throw new Error("Missing connected native editor")

        const KeyboardEventClass = view.KeyboardEvent
        probe.toolbarVetoCount = 0

        function reject(payload: NativeCommandPayload) {
          if (
            !(payload instanceof KeyboardEventClass) ||
            payload.key !== "F10" ||
            !payload.altKey
          )
            return false
          probe.toolbarVetoCount = (probe.toolbarVetoCount ?? 0) + 1

          if (veto !== "command-consume") payload.preventDefault()

          return veto === "command-consume"
        }

        if (veto === "capture") {
          probe.ownerDocument.addEventListener("keydown", reject, true)
          probe.releaseToolbarVeto = () =>
            probe.ownerDocument.removeEventListener("keydown", reject, true)
        } else {
          const unregister = Array.from(native._commands.keys(), (command) =>
            native.registerCommand(command, reject, priority),
          )

          probe.releaseToolbarVeto = () => {
            for (const stop of unregister) stop()
          }
        }
      },
      { veto, priority: COMMAND_PRIORITY_HIGH } satisfies ToolbarVetoOptions,
    )

    try {
      await editor.press("Alt+F10")
      await expect
        .poll(() =>
          editor.evaluate((element) =>
            element instanceof HTMLDivElement ? element.toolbarVetoCount : null,
          ),
        )
        .toBe(1)
      await expect(editor).toBeFocused()
      await expect(editor).toHaveText(original)
      await expect(toolbar).toBeVisible()
    } finally {
      await editor.evaluate((element) => {
        if (!(element instanceof HTMLDivElement))
          throw new Error("Missing native editor element")

        element.releaseToolbarVeto?.()
        delete element.releaseToolbarVeto
        delete element.toolbarVetoCount
      })
    }

    await editor.press("Alt+F10")
    await expect(
      toolbar
        .locator(
          'button:not(:disabled):not([aria-disabled="true"]), a[href]:not([aria-disabled="true"])',
        )
        .first(),
    ).toBeFocused()
    await page.keyboard.press("ArrowRight")
    await expect(
      toolbar.getByRole("button", { name: "Italic", exact: true }),
    ).toBeFocused()
    await page.keyboard.press("Escape")
    await expect(toolbar).toBeHidden()
    await expect(editor).toBeFocused()
    await expect(editor).toHaveText(original)
    await testInfo.attach(`floating-${veto}-focus.png`, {
      body: await page.screenshot({ scale: "css" }),
      contentType: "image/png",
    })
  })
}
