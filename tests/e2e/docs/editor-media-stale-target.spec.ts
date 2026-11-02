import AxeBuilder from "@axe-core/playwright"
import {
  expect,
  test,
  type Locator,
  type Page,
  type TestInfo,
} from "@playwright/test"

const original = "Before selected after"

const replacement = "Replacement alpha beta"

async function prepare(page: Page) {
  await page.goto("/editor/media-insert-control")

  const editor = page.getByRole("textbox", {
    name: "Media content",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.fill(original)
  await editor.press("Home")

  for (let index = 0; index < 7; index++) await editor.press("ArrowRight")

  for (let index = 0; index < 8; index++) await editor.press("Shift+ArrowRight")
  expect(await page.evaluate(() => document.getSelection()?.toString())).toBe(
    "selected",
  )

  return editor
}

async function openFile(page: Page) {
  await page.getByRole("button", { name: "Insert file", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "Insert file", exact: true })
  const input = dialog.getByLabel("Media URL", { exact: true })
  await expect(dialog).toBeVisible()
  await input.fill("https://media.test/stale.txt")
  await expect(
    dialog.getByRole("button", { name: "Insert", exact: true }),
  ).toBeEnabled()

  return { dialog, input }
}

async function closeOrSubmit(page: Page) {
  const dialog = page.getByRole("dialog", { name: "Insert file", exact: true })
  const insert = dialog.getByRole("button", { name: "Insert", exact: true })

  if (await insert.isEnabled()) await insert.click()

  if (await dialog.isVisible())
    await dialog.getByLabel("Media URL", { exact: true }).press("Escape")
  await expect(dialog).toHaveCount(0)
}

async function expectMediaAfterText(media: Locator, text: string) {
  await expect
    .poll(() =>
      media.evaluate((node) => {
        const root = node.closest('[data-slot="editor-content"]')

        if (!root) return null

        const before = document.createRange()
        before.selectNodeContents(root)
        before.setEndBefore(node)
        const after = document.createRange()
        after.selectNodeContents(root)
        after.setStartAfter(node)

        return { before: before.toString(), after: after.toString() }
      }),
    )
    .toEqual({ before: text, after: "" })
}

async function freshInsertion(page: Page, text: string) {
  const editor = page.getByRole("textbox", {
    name: "Media content",
    exact: true,
  })

  await editor.click()
  await editor.press("ControlOrMeta+End")
  const { dialog, input } = await openFile(page)
  await input.fill("https://media.test/fresh.txt")
  await dialog.getByRole("button", { name: "Insert", exact: true }).click()
  await expect(dialog).toHaveCount(0)
  const media = editor.locator('[data-slot="editor-media"]')
  await expect(
    media.locator('a[href="https://media.test/fresh.txt"]'),
  ).toHaveCount(1)
  await expectMediaAfterText(media, text)
  await expect(editor).toBeFocused()
  await editor.press("ControlOrMeta+z")
  await expect(media).toHaveCount(0)
  await expect(editor).toHaveText(text)
  await editor.press("ControlOrMeta+Shift+z")
  await expect(
    media.locator('a[href="https://media.test/fresh.txt"]'),
  ).toHaveCount(1)
  await expectMediaAfterText(media, text)
}

async function fullPageAxe(page: Page, info: TestInfo, name: string) {
  const report = await new AxeBuilder({ page }).analyze()
  await info.attach(name, {
    body: JSON.stringify(report),
    contentType: "application/json",
  })
  expect(report.violations).toEqual([])
}

for (const phase of ["target", "bubble"]) {
  for (const key of ["r", "p", "u", "e", "s"]) {
    test(`descendant ${phase} cancellation vetoes trusted ${key} shortcut`, async ({
      page,
    }) => {
      await prepare(page)
      const editor = page.locator('[data-slot="editor-content"]')
      const { dialog, input } = await openFile(page)
      await input.evaluate(
        (element, { currentPhase, currentKey }) => {
          const target =
            currentPhase === "target" ? element : element.closest("form")

          if (!target) throw new Error("Missing dialog form")

          target.addEventListener("keydown", (event) => {
            if (!(event instanceof KeyboardEvent)) return

            if (
              event.ctrlKey &&
              event.altKey &&
              event.code === `Key${currentKey.toUpperCase()}`
            ) {
              element.setAttribute("data-veto-trusted", String(event.isTrusted))
              element.setAttribute(
                "data-veto-cancelable",
                String(event.cancelable),
              )
              element.setAttribute("data-veto-phase", String(event.eventPhase))
              event.preventDefault()
              element.setAttribute(
                "data-veto-prevented",
                String(event.defaultPrevented),
              )
            }
          })
        },
        { currentPhase: phase, currentKey: key },
      )
      await input.press(`Control+Alt+${key}`)
      await expect(input).toHaveAttribute("data-veto-trusted", "true")
      await expect(input).toHaveAttribute("data-veto-cancelable", "true")
      await expect(input).toHaveAttribute(
        "data-veto-phase",
        phase === "target" ? "2" : "3",
      )
      await expect(input).toHaveAttribute("data-veto-prevented", "true")
      await expect(dialog).toBeVisible()
      await expect(editor).toHaveText(original)
      await expect(editor).toHaveAttribute("contenteditable", "true")
      await expect(input).toBeFocused()

      if (key === "s") {
        await expect(
          dialog.getByRole("status", { name: "Selection action" }),
        ).toHaveCount(0)
        await input.press("Control+Alt+p")
        await expect(editor).toHaveText("Before DEMO after")
      }
    })
  }
}

test("emulated AltGraph on trusted shortcuts does not run host actions", async ({
  page,
}) => {
  for (const key of ["r", "p", "u", "e"]) {
    await prepare(page)
    const editor = page.locator('[data-slot="editor-content"]')
    const { dialog, input } = await openFile(page)
    await input.evaluate((element) => {
      element.addEventListener("keydown", (event) => {
        if (!(event instanceof KeyboardEvent)) return

        if (event.ctrlKey && event.altKey && event.code.startsWith("Key")) {
          const originalState = event.getModifierState.bind(event)
          Object.defineProperty(event, "getModifierState", {
            value: (modifier: string) =>
              modifier === "AltGraph" || originalState(modifier),
          })
          element.setAttribute("data-altgraph-trusted", String(event.isTrusted))
          element.setAttribute(
            "data-altgraph-emulated",
            String(event.getModifierState("AltGraph")),
          )
        }
      })
    })
    await input.press(`Control+Alt+${key}`)
    await expect(input).toHaveAttribute("data-altgraph-trusted", "true")
    await expect(input).toHaveAttribute("data-altgraph-emulated", "true")
    await expect(dialog).toBeVisible()
    await expect(editor).toHaveText(original)
    await expect(editor).toHaveAttribute("contenteditable", "true")
    await expect(input).toBeFocused()
  }
})

test("vetoed and emulated AltGraph selection shortcuts retain the selected target", async ({
  page,
}) => {
  for (const mode of ["veto", "altgraph"]) {
    const editor = await prepare(page)
    await editor.evaluate((element, currentMode) => {
      element.addEventListener("keydown", (event) => {
        if (!(event instanceof KeyboardEvent)) return

        if (event.ctrlKey && event.altKey && event.code === "KeyS") {
          element.setAttribute(
            "data-selection-event-trusted",
            String(event.isTrusted),
          )

          if (currentMode === "veto") {
            event.preventDefault()
            element.setAttribute(
              "data-selection-vetoed",
              String(event.defaultPrevented),
            )
          } else {
            const originalState = event.getModifierState.bind(event)
            Object.defineProperty(event, "getModifierState", {
              value: (modifier: string) =>
                modifier === "AltGraph" || originalState(modifier),
            })
            element.setAttribute(
              "data-selection-altgraph",
              String(event.getModifierState("AltGraph")),
            )
          }
        }
      })
    }, mode)
    await editor.press("Control+Alt+s")
    await expect(editor).toHaveAttribute("data-selection-event-trusted", "true")
    await expect(editor).toHaveAttribute(
      mode === "veto" ? "data-selection-vetoed" : "data-selection-altgraph",
      "true",
    )
    await editor.press("Control+Alt+p")
    await expect(editor).toHaveText("Before DEMO after")
  }
})

test("composing, key 229, native cancellation, and synthetic events do not run host actions", async ({
  page,
}) => {
  for (const mode of ["composition", "key229", "base-ui", "synthetic"]) {
    await prepare(page)
    const editor = page.locator('[data-slot="editor-content"]')
    const { input } = await openFile(page)

    if (mode === "synthetic") {
      const trusted = await input.evaluate((element) => {
        const event = new KeyboardEvent("keydown", {
          bubbles: true,
          cancelable: true,
          ctrlKey: true,
          altKey: true,
          code: "KeyR",
          key: "r",
        })

        element.dispatchEvent(event)

        return event.isTrusted
      })

      expect(trusted).toBe(false)
    } else {
      await input.evaluate((element, currentMode) => {
        element.addEventListener("keydown", (event) => {
          if (!(event instanceof KeyboardEvent)) return

          if (event.ctrlKey && event.altKey && event.code === "KeyR") {
            const property =
              currentMode === "composition"
                ? "isComposing"
                : currentMode === "key229"
                  ? "keyCode"
                  : "baseUIHandlerPrevented"

            Object.defineProperty(event, property, {
              value: currentMode === "key229" ? 229 : true,
            })
            element.setAttribute(
              "data-composition-event-trusted",
              String(event.isTrusted),
            )
          }
        })
      }, mode)
      await input.press("Control+Alt+r")
      await expect(input).toHaveAttribute(
        "data-composition-event-trusted",
        "true",
      )
    }

    await expect(editor).toHaveText(original)
    await expect(input).toBeFocused()
  }
})

test("shared media shortcut respects descendant vetoes and input guards", async ({
  page,
}) => {
  for (const mode of [
    "target",
    "bubble",
    "altgraph",
    "composition",
    "key229",
    "base-ui",
    "synthetic",
    "normal",
  ]) {
    await page.goto("/components/editor-media")

    const host = page.getByRole("region", { name: "Media editor", exact: true })

    const editor = host.getByRole("textbox", {
      name: "Media content",
      exact: true,
    })

    await expect(editor).toHaveAttribute("contenteditable", "true")
    await editor.fill(original)
    await host.getByRole("button", { name: "Insert file", exact: true }).click()

    const dialog = page.getByRole("dialog", {
      name: "Insert file",
      exact: true,
    })

    const input = dialog.getByLabel("Media URL", { exact: true })
    const backgroundEditor = page.locator('[data-slot="editor-content"]')

    await expect(dialog).toBeVisible()
    await input.fill("https://media.test/stale.txt")

    if (mode === "synthetic") {
      expect(
        await input.evaluate((element) => {
          const event = new KeyboardEvent("keydown", {
            bubbles: true,
            cancelable: true,
            ctrlKey: true,
            altKey: true,
            code: "KeyE",
            key: "e",
          })

          element.dispatchEvent(event)

          return event.isTrusted
        }),
      ).toBe(false)
    } else {
      await input.evaluate((element, currentMode) => {
        const target =
          currentMode === "bubble" ? element.closest("form") : element

        if (!target) throw new Error("Missing dialog form")

        target.addEventListener("keydown", (event) => {
          if (
            !(event instanceof KeyboardEvent) ||
            event.code !== "KeyE" ||
            !event.ctrlKey ||
            !event.altKey
          )
            return

          element.setAttribute("data-shortcut-trusted", String(event.isTrusted))
          element.setAttribute("data-shortcut-phase", String(event.eventPhase))

          if (currentMode === "target" || currentMode === "bubble") {
            event.preventDefault()
            element.setAttribute(
              "data-shortcut-veto",
              String(event.defaultPrevented),
            )
          } else if (currentMode === "altgraph") {
            const originalState = event.getModifierState.bind(event)

            Object.defineProperty(event, "getModifierState", {
              value: (modifier: string) =>
                modifier === "AltGraph" || originalState(modifier),
            })
          } else if (
            currentMode === "composition" ||
            currentMode === "key229" ||
            currentMode === "base-ui"
          ) {
            const property =
              currentMode === "composition"
                ? "isComposing"
                : currentMode === "key229"
                  ? "keyCode"
                  : "baseUIHandlerPrevented"

            Object.defineProperty(event, property, {
              value: currentMode === "key229" ? 229 : true,
            })
          }
        })
      }, mode)
      await input.press("Control+Alt+e")
      await expect(input).toHaveAttribute("data-shortcut-trusted", "true")

      if (mode === "target" || mode === "bubble") {
        await expect(input).toHaveAttribute("data-shortcut-veto", "true")
        await expect(input).toHaveAttribute(
          "data-shortcut-phase",
          mode === "target" ? "2" : "3",
        )
      }
    }

    await expect(dialog).toBeVisible()
    await expect(input).toBeFocused()
    await expect(backgroundEditor).toHaveText(original)
    await expect(backgroundEditor).toHaveAttribute(
      "contenteditable",
      mode === "normal" ? "false" : "true",
    )

    if (mode === "normal") {
      await input.press("Control+Alt+e")
      await expect(backgroundEditor).toHaveAttribute("contenteditable", "true")
    }
  }
})

test("host actions select and replace the final word", async ({ page }) => {
  const editor = await prepare(page)
  await editor.press("Control+Alt+s")
  await editor.press("Control+Alt+p")
  await expect(editor).toHaveText("Before selected DEMO")
  await editor.click()
  await editor.press("ControlOrMeta+z")
  await expect(editor).toHaveText(original)
  await editor.press("ControlOrMeta+Shift+z")
  await expect(editor).toHaveText("Before selected DEMO")
})

test("host document replacement commits and has independent history", async ({
  page,
}) => {
  const editor = await prepare(page)
  await editor.press("Control+Alt+r")
  await expect(editor).toHaveText(replacement)
  await editor.click()
  await editor.press("ControlOrMeta+z")
  await expect(editor).toHaveText(original)
  await editor.press("ControlOrMeta+Shift+z")
  await expect(editor).toHaveText(replacement)
})

test("host replacement invalidates an open file session", async ({
  page,
}, info) => {
  const editor = await prepare(page)
  const { dialog, input } = await openFile(page)
  await input.press("Control+Alt+r")
  await expect(input).toBeFocused()
  await expect(page.locator('[data-slot="editor-content"]')).toHaveText(
    replacement,
  )
  await expect(dialog).toBeVisible()
  await fullPageAxe(page, info, "replacement-dialog-axe.json")
  await closeOrSubmit(page)
  await expect(
    page.getByLabel("Selection check", { exact: true }),
  ).toHaveAttribute("data-check-id", "0")
  await expect(editor).toHaveText(replacement)
  await expect(editor.locator('[data-slot="editor-media"]')).toHaveCount(0)
  await freshInsertion(page, replacement)
})

test("a changed non-null selection must not restore the old target", async ({
  page,
}, info) => {
  const editor = await prepare(page)
  const { dialog, input } = await openFile(page)
  await input.press("Control+Alt+s")
  await expect(input).toBeFocused()
  await expect(dialog).toBeVisible()
  await expect(
    dialog.getByRole("status", { name: "Selection action" }),
  ).toHaveText("Selection action succeeded")
  await expect(
    dialog.getByRole("status", { name: "New selection" }),
  ).toHaveText("New selection confirmed")
  await fullPageAxe(page, info, "selection-dialog-axe.json")

  const insert = dialog.getByRole("button", { name: "Insert", exact: true })
  const check = page.locator('[aria-label="Selection check"]')
  await expect(check).toHaveAttribute("data-original-selection", "true")
  await expect(check).toHaveAttribute("data-original-selected", "true")
  const previousCheck = Number(await check.getAttribute("data-check-id"))
  const closingDialog = page.locator('[data-slot="dialog-popup"]')
  const blocked = !(await insert.isEnabled())
  let submissionHandled = false

  if (!blocked) {
    await expect(input).toHaveAttribute("aria-invalid", "false")
    await insert.evaluate((button) => {
      if (!(button instanceof HTMLButtonElement) || !button.form)
        throw new Error("Missing insert form")

      button.form.addEventListener(
        "submit",
        (event) => {
          const check = document.querySelector('[aria-label="Selection check"]')

          if (!check) throw new Error("Missing selection check")
          check.setAttribute("data-observed-trusted", String(event.isTrusted))
          check.setAttribute(
            "data-observed-prevented",
            String(event.defaultPrevented),
          )
          check.setAttribute(
            "data-observed-submitter",
            String(event.submitter === button),
          )
        },
        { capture: true, once: true },
      )
    })
    await insert.click()
    await expect(check).toBeVisible()
    await expect(check).toHaveText("Selection confirmed")
    await expect(check).toHaveAttribute("data-check-kind", "submit")
    await expect(check).toHaveAttribute("data-check-valid", "true")
    await expect(check).toHaveAttribute("data-check-disabled", "false")
    await expect(check).toHaveAttribute("data-check-trusted", "true")
    await expect(check).toHaveAttribute("data-check-prevented", "false")
    const checkId = await check.getAttribute("data-check-id")
    expect(Number(checkId)).toBeGreaterThan(previousCheck)
    await expect(check).toHaveAttribute("data-observed-trusted", "true")
    await expect(check).toHaveAttribute("data-observed-prevented", "false")
    await expect(check).toHaveAttribute("data-observed-submitter", "true")
    await expect
      .poll(async () => {
        if ((await closingDialog.count()) === 0) return true

        if ((await closingDialog.getAttribute("data-closed")) !== null)
          return true

        return (await closingDialog.getByRole("alert").count()) > 0
      })
      .toBe(true)

    if (
      (await closingDialog.count()) > 0 &&
      (await closingDialog.getAttribute("data-closed")) === null
    ) {
      await expect(input).toHaveAttribute("aria-invalid", "true")
      submissionHandled = true
      await input.press("Escape")
    }
  } else {
    await input.press("Control+Alt+c")
    await expect(check).toBeVisible()
    await expect(check).toHaveText("Selection confirmed")
    await expect(check).toHaveAttribute("data-check-kind", "manual")
    await expect(check).toHaveAttribute("data-check-valid", "true")
    await expect(check).toHaveAttribute("data-check-disabled", "true")
    await expect(check).toHaveAttribute("data-check-trusted", "true")
    expect(Number(await check.getAttribute("data-check-id"))).toBeGreaterThan(
      previousCheck,
    )
    await input.press("Escape")
  }

  await expect(closingDialog).toHaveCount(0)
  await expect(editor).toHaveText(original)
  await expect(editor.locator('[data-slot="editor-media"]')).toHaveCount(0)
  await page.keyboard.press("Control+Alt+p")
  const text = await editor.textContent()
  expect(text).not.toBe("Before DEMO after")

  if (text === original)
    info.annotations.push({
      type: "inconclusive",
      description:
        "Post-close selection was not observable through the host edit.",
    })
  else expect(text).toBe("Before selected DEMO")
  const lastCheck = await check.getAttribute("data-check-id")
  await freshInsertion(page, text ?? original)
  await expect(check).toHaveAttribute("data-check-id", lastCheck ?? "")

  if (blocked)
    info.annotations.push({
      type: "blocked",
      description:
        "Insert was disabled after a confirmed new selection; no stale-target submission occurred.",
    })
  else if (!submissionHandled)
    info.annotations.push({
      type: "inconclusive",
      description:
        "The submission handler outcome was not observed; insertion or rejection is not proven.",
    })
})

test("read-only transition expires the old session and permits a fresh insertion", async ({
  page,
}, info) => {
  const editor = await prepare(page)
  const { dialog, input } = await openFile(page)
  const backgroundEditor = page.locator('[data-slot="editor-content"]')
  const insert = dialog.getByRole("button", { name: "Insert", exact: true })
  await input.press("Control+Alt+e")
  await expect(backgroundEditor).toHaveAttribute("contenteditable", "false")
  await expect(insert).toBeDisabled()
  await input.press("Control+Alt+e")
  await expect(backgroundEditor).toHaveAttribute("contenteditable", "true")
  await expect(input).toBeFocused()
  await expect(insert).toBeDisabled()
  await fullPageAxe(page, info, "readonly-dialog-axe.json")
  await input.press("Escape")
  await expect(dialog).toHaveCount(0)
  await expect(editor).toHaveText(original)
  await expect(editor.locator('[data-slot="editor-media"]')).toHaveCount(0)
  await page.keyboard.press("Control+Alt+p")
  const text = await editor.textContent()
  expect(text).not.toBe("Before DEMO after")

  if (text === original)
    info.annotations.push({
      type: "inconclusive",
      description:
        "Post-close selection was not observable through the host edit.",
    })
  else expect(text).toBe("Before selected DEMO")
  await freshInsertion(page, text ?? original)
  await fullPageAxe(page, info, "fresh-media-axe.json")
})

test("removing the entire root closes the dialog and creates a fresh editor", async ({
  page,
}, info) => {
  await prepare(page)
  const { dialog, input } = await openFile(page)
  await input.press("Control+Alt+u")
  await expect(dialog).toHaveCount(0)
  await expect(page.locator('[data-slot="editor-content"]')).toHaveCount(0)

  const restore = page.getByRole("button", {
    name: "Restore demo editor",
    exact: true,
  })

  expect(await page.evaluate(() => document.activeElement?.isConnected)).toBe(
    true,
  )

  await restore.click()

  const remove = page.getByRole("button", {
    name: "Remove demo editor",
    exact: true,
  })

  await expect(remove).toBeFocused()
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      }),
  )
  await expect(remove).toBeFocused()

  const editor = page.getByRole("textbox", {
    name: "Media content",
    exact: true,
  })

  await expect(editor).toHaveText("")
  await expect(editor.locator('[data-slot="editor-media"]')).toHaveCount(0)
  await freshInsertion(page, "")
  await fullPageAxe(page, info, "remounted-editor-axe.json")
})
