import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page, type TestInfo } from "@playwright/test"
import { editorPartLabel } from "@workspace/apps/docs/src/catalog/editor-parts"

async function openSelect(page: Page) {
  await page.goto("/editor/labels-select")
  const preview = page.getByTestId("labels-select-example")
  await expect(
    preview.getByRole("combobox", { name: "Choose labels" }),
  ).toBeVisible()
  await expect(
    preview.getByRole("textbox", { name: "Label document" }),
  ).toHaveAttribute("data-lexical-editor", "true")

  return preview
}

async function saveAccessibility(page: Page, testInfo: TestInfo, name: string) {
  const report = await new AxeBuilder({ page }).analyze()
  await testInfo.attach(`${name}.json`, {
    body: JSON.stringify(report, null, 2),
    contentType: "application/json",
  })
  expect(report.violations).toEqual([])
}

test("open labels preserve native Tab, pointer focus, chip input and cleanup", async ({
  page,
}, testInfo) => {
  const preview = await openSelect(page)
  const input = preview.getByRole("combobox", { name: "Choose labels" })

  const submit = preview.getByRole("button", {
    name: "Submit labels",
    exact: true,
  })

  const options = page.getByRole("listbox", { includeHidden: true })

  const tokens = preview
    .getByRole("textbox", { name: "Label document" })
    .locator('[data-slot="editor-label"]')

  await page.evaluate(() => {
    const samples: {
      phase: string
      hidden: boolean
      trusted: boolean
      tag: string
      name: string | null
    }[] = []

    document.addEventListener(
      "focusin",
      (event) => {
        if (!(event.target instanceof Element)) return

        samples.push({
          phase:
            document.documentElement.getAttribute("data-label-focus-phase") ??
            "setup",
          hidden:
            event.target.closest('[aria-hidden="true"], [inert]') !== null,
          trusted: event.isTrusted,
          tag: event.target.tagName,
          name:
            event.target.getAttribute("aria-label") ??
            event.target.textContent?.slice(0, 80) ??
            null,
        })
        document.documentElement.setAttribute(
          "data-label-focus-samples",
          JSON.stringify(samples),
        )
      },
      true,
    )
  })

  for (const key of ["Tab", "Shift+Tab"]) {
    await page.evaluate((phase) => {
      document.documentElement.setAttribute("data-label-focus-phase", phase)
    }, key)
    await input.fill("dia")
    await input.press("ArrowDown")
    await expect(
      page.getByRole("option", { name: "Dialog", exact: true }),
    ).toBeVisible()
    await expect(input).toBeFocused()
    await input.press(key)
    await expect(input).toHaveAttribute("aria-expanded", "false")
    await expect(options).toHaveCount(0)
    await expect(input).not.toBeFocused()
    await expect(page.locator(":focus")).toHaveCount(1)
    await expect(
      page
        .locator(":focus")
        .locator('xpath=ancestor-or-self::*[@aria-hidden="true" or @inert]'),
    ).toHaveCount(0)

    if (key === "Tab") await expect(submit).toBeFocused()
  }

  await page.evaluate(() => {
    document.documentElement.setAttribute("data-label-focus-phase", "pointer")
  })
  await input.fill("dia")
  await input.press("ArrowDown")
  await expect(
    page.getByRole("option", { name: "Dialog", exact: true }),
  ).toBeVisible()
  await preview
    .getByRole("button", {
      name: "Set host labels",
      exact: true,
      includeHidden: true,
    })
    .click()
  await expect(tokens).toHaveText(["Form"])
  await expect(options).toHaveCount(0)

  await page.evaluate(() => {
    document.documentElement.setAttribute("data-label-focus-phase", "chip")
  })
  await input.fill("")
  await input.press("ArrowDown")
  await expect(
    page.getByRole("option", { name: "Dialog", exact: true }),
  ).toBeVisible()
  await input.press("ArrowLeft")
  await expect(input).toHaveAttribute("aria-expanded", "false")
  await page.keyboard.press("Backspace")
  await expect(tokens).toHaveCount(0)

  const raw = await page
    .locator("html")
    .getAttribute("data-label-focus-samples")

  expect(raw).not.toBeNull()
  const samples: unknown = JSON.parse(raw ?? "null")
  expect(samples).not.toContainEqual(expect.objectContaining({ hidden: true }))

  for (const phase of ["Tab", "Shift+Tab", "pointer", "chip"])
    expect(samples).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ phase, trusted: true, hidden: false }),
      ]),
    )

  await testInfo.attach("native-combobox-focus.json", {
    body: raw ?? "null",
    contentType: "application/json",
  })
})

for (const [rtl, previousKey] of [
  [false, "ArrowLeft"],
  [true, "ArrowRight"],
] as const) {
  test(`chip focus closes suggestions before native ${rtl ? "RTL" : "LTR"} navigation`, async ({
    page,
  }, testInfo) => {
    const preview = await openSelect(page)
    const input = preview.getByRole("combobox", { name: "Choose labels" })

    const tokens = preview
      .getByRole("textbox", { name: "Label document" })
      .locator('[data-slot="editor-label"]')

    await preview
      .getByRole("button", { name: "Set host labels", exact: true })
      .click()
    await expect(tokens).toHaveText(["Form"])

    if (rtl) {
      await preview
        .getByRole("button", { name: "Advanced host checks", exact: true })
        .click()
      await preview
        .getByRole("button", { name: "Right-to-left labels", exact: true })
        .click()
    }

    await input.scrollIntoViewIfNeeded()
    await input.fill("")
    await input.press("ArrowDown")
    await expect(input).toHaveAttribute("aria-expanded", "true")
    await input.press(previousKey)
    await expect(input).toHaveAttribute("aria-expanded", "false")
    await expect(
      preview.locator('[data-slot="editor-labels-tag"]'),
    ).toBeFocused()
    await expect(
      page
        .locator(":focus")
        .locator('xpath=ancestor-or-self::*[@aria-hidden="true" or @inert]'),
    ).toHaveCount(0)
    await expect(
      preview.locator('[data-slot="editor-labels-tag"]'),
    ).toBeInViewport()
    await testInfo.attach("chip-navigation.png", {
      body: await page.screenshot({ scale: "css" }),
      contentType: "image/png",
    })
    await page.keyboard.press("Backspace")
    await expect(tokens).toHaveCount(0)
    await preview.getByRole("button", { name: "Undo", exact: true }).click()
    await expect(tokens).toHaveText(["Form"])
  })
}

for (const veto of [
  "Prevent chip navigation",
  "Prevent Base UI chip navigation",
  "Prevent popup close",
] as const) {
  test(`chip focus honors ${veto}`, async ({ page }) => {
    const preview = await openSelect(page)
    const input = preview.getByRole("combobox", { name: "Choose labels" })

    const tokens = preview
      .getByRole("textbox", { name: "Label document" })
      .locator('[data-slot="editor-label"]')

    await preview
      .getByRole("button", { name: "Set host labels", exact: true })
      .click()
    await expect(tokens).toHaveText(["Form"])
    await preview
      .getByRole("button", { name: "Advanced host checks", exact: true })
      .click()
    const toggle = preview.getByRole("button", { name: veto, exact: true })
    await toggle.click()
    await input.fill("")
    await input.press("ArrowDown")
    await expect(input).toHaveAttribute("aria-expanded", "true")
    await input.press("ArrowLeft")
    await expect(input).toBeFocused()
    await expect(input).toHaveAttribute("aria-expanded", "true")
    await expect(
      preview
        .getByRole("textbox", { name: "Label document", includeHidden: true })
        .locator('[data-slot="editor-label"]'),
    ).toHaveText(["Form"])
    await input.press("Tab")
    await expect(input).toHaveAttribute("aria-expanded", "false")
    await expect(
      page.getByRole("listbox", { includeHidden: true }),
    ).toHaveCount(0)
    await toggle.click()
    await input.fill("")
    await input.press("ArrowDown")
    await input.press("ArrowLeft")
    await expect(input).toHaveAttribute("aria-expanded", "false")
    await expect(
      preview.locator('[data-slot="editor-labels-tag"]'),
    ).toBeFocused()
  })
}

test("custom label composition keeps consumer and internal chip refs", async ({
  page,
}) => {
  const preview = await openSelect(page)
  await preview
    .getByRole("button", { name: "Set host labels", exact: true })
    .click()
  await preview
    .getByRole("button", { name: "Advanced host checks", exact: true })
    .click()
  await preview
    .getByRole("button", { name: "Use custom label field", exact: true })
    .click()
  const input = preview.getByRole("combobox", { name: "Choose labels" })
  await input.fill("")
  await input.press("ArrowDown")
  await expect(
    preview.getByLabel("Custom field ref on open", { exact: true }),
  ).toHaveText("connected")
  await expect(input).toHaveAttribute("aria-expanded", "true")
  await input.press("ArrowLeft")
  await expect(input).toHaveAttribute("aria-expanded", "false")
  await expect(preview.locator('[data-slot="editor-labels-tag"]')).toBeFocused()
  await expect(
    page
      .locator(":focus")
      .locator('xpath=ancestor-or-self::*[@aria-hidden="true" or @inert]'),
  ).toHaveCount(0)
  await page.keyboard.press("Backspace")
  await expect(
    preview
      .getByRole("textbox", { name: "Label document" })
      .locator('[data-slot="editor-label"]'),
  ).toHaveCount(0)
})

for (const modifier of ["Shift", "Control", "Meta", "Alt"] as const) {
  test(`modified chip arrow preserves native ${modifier} input`, async ({
    page,
  }) => {
    const preview = await openSelect(page)
    const input = preview.getByRole("combobox", { name: "Choose labels" })
    await preview
      .getByRole("button", { name: "Set host labels", exact: true })
      .click()
    await preview
      .getByRole("button", { name: "Advanced host checks", exact: true })
      .click()
    await preview
      .getByRole("button", { name: "Right-to-left labels", exact: true })
      .click()
    await input.fill("")
    await input.press("ArrowDown")
    await expect(input).toHaveAttribute("aria-expanded", "true")
    await input.press(`${modifier}+ArrowRight`)
    await expect(input).toBeFocused()
    await expect(input).toHaveAttribute("aria-expanded", "true")
  })
}

for (const action of [
  "Read-only on popup close",
  "Disable on popup close",
  "Unmount on popup close",
  "Focus submit on popup close",
] as const) {
  test(`chip navigation rejects stale target: ${action}`, async ({ page }) => {
    const preview = await openSelect(page)
    const input = preview.getByRole("combobox", { name: "Choose labels" })
    await preview
      .getByRole("button", { name: "Set host labels", exact: true })
      .click()
    await preview
      .getByRole("button", { name: "Advanced host checks", exact: true })
      .click()
    await preview.getByRole("button", { name: action, exact: true }).click()
    await input.fill("")
    await input.press("ArrowDown")
    await expect(input).toHaveAttribute("aria-expanded", "true")
    await page.evaluate(() => {
      document.documentElement.setAttribute("data-stale-chip-focus", "false")
      document.addEventListener(
        "focusin",
        (event) => {
          if (
            event.target instanceof Element &&
            event.target.closest("[data-combobox-chip]")
          )
            document.documentElement.setAttribute(
              "data-stale-chip-focus",
              "true",
            )
        },
        true,
      )
    })
    await input.press("ArrowLeft")
    await expect(
      page.getByRole("listbox", { includeHidden: true }),
    ).toHaveCount(0)
    await expect(page.locator("html")).toHaveAttribute(
      "data-stale-chip-focus",
      "false",
    )
    await expect(
      preview
        .getByRole("textbox", { name: "Label document" })
        .locator('[data-slot="editor-label"]'),
    ).toHaveText(["Form"])

    if (action === "Unmount on popup close") {
      await expect(input).toHaveCount(0)
    } else {
      await expect(input).toHaveAttribute("aria-expanded", "false")

      if (action === "Read-only on popup close") {
        await expect(input).toHaveAttribute("readonly", "")
        await expect(
          preview.getByRole("textbox", { name: "Label document" }),
        ).toHaveAttribute("contenteditable", "false")
      } else if (action === "Disable on popup close") {
        await expect(input).toBeDisabled()
      } else {
        await expect(
          preview.getByRole("button", { name: "Submit labels", exact: true }),
        ).toBeFocused()
      }
    }
  })
}

test("chip navigation closes a nonempty query only at its native boundary", async ({
  page,
}) => {
  const preview = await openSelect(page)
  const input = preview.getByRole("combobox", { name: "Choose labels" })
  await preview
    .getByRole("button", { name: "Set host labels", exact: true })
    .click()
  await input.fill("Dialog")
  await input.press("End")
  await input.press("ArrowLeft")
  await expect(input).toBeFocused()
  await expect(input).toHaveAttribute("aria-expanded", "true")
  await expect(input).toHaveValue("Dialog")
  await input.press("Home")
  await input.press("ArrowLeft")
  await expect(input).toHaveAttribute("aria-expanded", "false")
  await expect(input).toHaveValue("")
  await expect(preview.locator('[data-slot="editor-labels-tag"]')).toBeFocused()
})

test("native composition does not move focus into an open label chip", async ({
  page,
}, testInfo) => {
  const preview = await openSelect(page)
  const input = preview.getByRole("combobox", { name: "Choose labels" })
  await preview
    .getByRole("button", { name: "Set host labels", exact: true })
    .click()
  await input.fill("")
  await input.press("ArrowDown")
  await page.evaluate(() => {
    document.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "ArrowLeft")
          document.documentElement.setAttribute(
            "data-composing-chip-key",
            JSON.stringify({
              trusted: event.isTrusted,
              composing: event.isComposing,
              which: event.which,
            }),
          )
      },
      true,
    )
  })
  const session = await page.context().newCDPSession(page)
  await session.send("Input.imeSetComposition", {
    text: "に",
    selectionStart: 0,
    selectionEnd: 0,
  })
  await expect(input).toHaveValue("に")
  await session.send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "ArrowLeft",
    code: "ArrowLeft",
    windowsVirtualKeyCode: 229,
  })
  await expect(input).toBeFocused()
  await expect(input).toHaveAttribute("aria-expanded", "true")

  const event = await page
    .locator("html")
    .getAttribute("data-composing-chip-key")

  expect(event).not.toBeNull()
  const parsed: unknown = JSON.parse(event ?? "null")
  expect(parsed).toEqual(expect.objectContaining({ trusted: true, which: 229 }))
  await testInfo.attach("native-chip-composition.json", {
    body: event ?? "null",
    contentType: "application/json",
  })
  await session.send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: "ArrowLeft",
    code: "ArrowLeft",
    windowsVirtualKeyCode: 229,
  })
  await session.send("Input.imeSetComposition", {
    text: "",
    selectionStart: 0,
    selectionEnd: 0,
  })
  await session.detach()
})

test("label select filters, selects and removes native tokens with history @a11y", async ({
  page,
}, testInfo) => {
  const preview = await openSelect(page)
  const input = preview.getByRole("combobox", { name: "Choose labels" })
  const editor = preview.getByRole("textbox", { name: "Label document" })
  const tokens = editor.locator('[data-slot="editor-label"]')
  await input.fill("dia")
  await expect(
    page.getByRole("option", { name: "Dialog", exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole("option", { name: "Button", exact: true }),
  ).toHaveCount(0)
  await saveAccessibility(page, testInfo, "labels-filtered")
  await page.getByRole("option", { name: "Dialog", exact: true }).click()
  await expect(tokens).toHaveText(["Dialog"])
  await expect(input).toBeFocused()
  await input.fill("but")
  await input.press("ArrowDown")
  await input.press("Enter")
  await expect(tokens).toHaveText(["Dialog", "Button"])
  await input.press("Tab")
  await preview
    .getByRole("button", { name: "Remove Dialog", exact: true })
    .click()
  await expect(tokens).toHaveText(["Button"])
  await preview.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(tokens).toHaveText(["Dialog", "Button"])
  await preview.getByRole("button", { name: "Redo", exact: true }).click()
  await expect(tokens).toHaveText(["Button"])
  await input.fill("")
  await input.press("ArrowLeft")
  await page.keyboard.press("Backspace")
  await expect(tokens).toHaveCount(0)
  await saveAccessibility(page, testInfo, "labels-empty")
  await testInfo.attach("labels-select.png", {
    body: await preview.screenshot(),
    contentType: "image/png",
  })
})

test("Escape clears a closed label field and Undo restores form values @a11y", async ({
  page,
}, testInfo) => {
  const preview = await openSelect(page)
  const input = preview.getByRole("combobox", { name: "Choose labels" })
  const editor = preview.getByRole("textbox", { name: "Label document" })
  const tokens = editor.locator('[data-slot="editor-label"]')

  const submit = preview.getByRole("button", {
    name: "Submit labels",
    exact: true,
  })

  const output = preview.getByLabel("Submitted labels", { exact: true })

  await input.fill("editor")
  await page.getByRole("option", { name: "Editor", exact: true }).click()
  await expect(tokens).toHaveText(["Editor"])
  await expect(input).toHaveAttribute("aria-expanded", "false")
  await expect(page.getByRole("listbox", { includeHidden: true })).toHaveCount(
    0,
  )
  await input.press("Escape")
  await expect(tokens).toHaveCount(0)
  await expect(
    preview.getByRole("button", { name: "Remove Editor", exact: true }),
  ).toHaveCount(0)
  await submit.click()
  await expect(output).toHaveText("[]")
  const undo = preview.getByRole("button", { name: "Undo", exact: true })
  await expect(undo).toBeEnabled()
  await undo.click()
  await expect(tokens).toHaveText(["Editor"])
  await submit.click()
  await expect(output).toHaveText('["Editor"]')
  await saveAccessibility(page, testInfo, "labels-closed-escape")
})

test("host control, cancellation, form values, disabled and read-only @a11y", async ({
  page,
}, testInfo) => {
  const preview = await openSelect(page)
  const input = preview.getByRole("combobox", { name: "Choose labels" })

  const tokens = preview
    .getByRole("textbox", { name: "Label document" })
    .locator('[data-slot="editor-label"]')

  await preview
    .getByRole("button", { name: "Use host control", exact: true })
    .click()
  await input.fill("editor")
  await page.getByRole("option", { name: "Editor", exact: true }).click()
  await expect(tokens).toHaveText(["Editor"])
  await input.press("Tab")
  await preview
    .getByRole("button", { name: "Submit labels", exact: true })
    .click()
  await expect(
    preview.getByLabel("Submitted labels", { exact: true }),
  ).toHaveText('["Editor"]')
  await preview
    .getByRole("button", { name: "Block changes", exact: true })
    .click()
  await input.fill("dialog")
  await page.getByRole("option", { name: "Dialog", exact: true }).click()
  await expect(
    preview
      .getByRole("textbox", { name: "Label document", includeHidden: true })
      .locator('[data-slot="editor-label"]'),
  ).toHaveText(["Editor"])
  await input.press("Tab")
  await expect(tokens).toHaveText(["Editor"])
  await preview
    .getByRole("button", { name: "Allow changes", exact: true })
    .click()
  await preview
    .getByRole("button", { name: "Set host labels", exact: true })
    .click()
  await expect(tokens).toHaveText(["Form"])
  await expect(
    preview.getByRole("button", { name: "Remove Form", exact: true }),
  ).toBeVisible()
  await preview
    .getByRole("button", { name: "Disable select", exact: true })
    .click()
  await expect(input).toBeDisabled()
  await expect(
    preview.getByRole("button", { name: "Remove Form", exact: true }),
  ).toBeDisabled()
  await preview
    .getByRole("button", { name: "Enable select", exact: true })
    .click()
  await preview
    .getByRole("button", { name: "Make read-only", exact: true })
    .click()
  await expect(input).toHaveAttribute("readonly", "")
  await expect(
    preview.getByRole("button", { name: "Remove Form", exact: true }),
  ).toBeDisabled()
  await expect(tokens).toHaveText(["Form"])
  await saveAccessibility(page, testInfo, "labels-read-only")
})

test("bounds, invalid host values, native cancellation and unsupported content preserve document", async ({
  page,
}, testInfo) => {
  const preview = await openSelect(page)
  const input = preview.getByRole("combobox", { name: "Choose labels" })
  const editor = preview.getByRole("textbox", { name: "Label document" })
  const tokens = editor.locator('[data-slot="editor-label"]')

  for (const label of [
    "Editor",
    "Button",
    "Command",
    "Dialog",
    "Form",
    "Input",
    "Label",
    "Popover",
    "Tag",
    "Table",
  ]) {
    await input.fill(label)
    await page.getByRole("option", { name: label, exact: true }).click()
  }

  await expect(tokens).toHaveCount(10)
  await input.fill("Tree")
  await expect(
    page.getByRole("option", { name: "Tree", exact: true }),
  ).toBeDisabled()
  await expect(input).toHaveAttribute("aria-expanded", "true")
  await input.press("Escape")
  await expect(input).toHaveAttribute("aria-expanded", "false")
  await expect(tokens).toHaveCount(10)
  await preview
    .getByRole("button", { name: "Try invalid labels", exact: true })
    .click()
  await expect(tokens).toHaveCount(10)
  await preview
    .getByRole("button", { name: "Clear labels", exact: true })
    .click()
  await expect(tokens).toHaveCount(0)
  await editor.click()
  await editor.pressSequentially("Keep text")
  await input.fill("Dialog")
  await page.getByRole("option", { name: "Dialog", exact: true }).click()

  const retainedEditor = preview.getByRole("textbox", {
    name: "Label document",
    includeHidden: true,
  })

  await expect(retainedEditor).toHaveText("Keep text")
  await expect(
    retainedEditor.locator('[data-slot="editor-label"]'),
  ).toHaveCount(0)
  await input.press("Tab")
  await expect(editor).toHaveText("Keep text")
  await expect(tokens).toHaveCount(0)
  await preview
    .getByRole("button", { name: "Block native input", exact: true })
    .click()
  await editor.click()
  await editor.press("ControlOrMeta+End")
  await editor.pressSequentially("blocked")
  await expect(editor).toHaveText("Keep text")
  await input.fill("not an option")
  await expect(page.getByRole("option")).toHaveCount(0)
  await saveAccessibility(page, testInfo, "labels-unsupported")
})

for (const [action, labels, cancelled] of [
  ["Queue host labels", ["Editor"], true],
  ["Commit host labels", ["Editor"], true],
  ["Set host read-only", ["Form"], true],
  ["Disable select on change", ["Form"], true],
  ["Unmount select on change", ["Form"], true],
  ["Replace editor surface on change", ["Form"], true],
  ["Leave host document unchanged", ["Form", "Dialog"], false],
] as const) {
  test(`reentrant callback: ${action}`, async ({ page }, testInfo) => {
    const preview = await openSelect(page)
    const input = preview.getByRole("combobox", { name: "Choose labels" })
    const editor = preview.getByRole("textbox", { name: "Label document" })
    const tokens = editor.locator('[data-slot="editor-label"]')

    const advanced = preview.getByRole("button", {
      name: "Advanced host checks",
      exact: true,
    })

    await expect(advanced).toHaveAttribute("aria-expanded", "false")
    await preview
      .getByRole("button", { name: "Set host labels", exact: true })
      .click()

    await expect(tokens).toHaveText(["Form"])
    await advanced.click()
    const checks = preview.getByRole("region", { name: "Advanced host checks" })
    await checks.getByRole("button", { name: action, exact: true }).click()
    await input.fill("Dialog")
    await page.getByRole("option", { name: "Dialog", exact: true }).click()
    await expect(
      preview
        .getByRole("textbox", { name: "Label document", includeHidden: true })
        .locator('[data-slot="editor-label"]'),
    ).toHaveText([...labels])
    await expect(
      checks.getByLabel("Host change result", { exact: true }),
    ).toHaveText(cancelled ? "cancelled" : "accepted")

    if (action === "Unmount select on change") {
      await expect(input).toHaveCount(0)
    } else {
      const locked =
        action === "Set host read-only" || action === "Disable select on change"

      await expect(input).toHaveValue(cancelled && !locked ? "Dialog" : "")

      if (locked) {
        await expect(input).toHaveAttribute("aria-expanded", "false")
        await expect(
          page.getByRole("listbox", { includeHidden: true }),
        ).toHaveCount(0)
      }

      if (action === "Set host read-only") {
        await expect(editor).toHaveAttribute("contenteditable", "false")
        await expect(input).toHaveAttribute("readonly", "")
      } else if (action === "Disable select on change") {
        await expect(input).toBeDisabled()
      }

      await page.keyboard.press("Tab")
      await expect(tokens).toHaveText([...labels])

      if (locked) {
        await preview
          .getByRole("button", {
            name:
              action === "Disable select on change"
                ? "Enable select"
                : "Make editable",
            exact: true,
          })
          .click()
        await expect(input).toBeEnabled()
        await expect(input).not.toHaveAttribute("readonly", "")
        await expect(input).toHaveValue("")
        await expect(input).toHaveAttribute("aria-expanded", "false")
        await expect(
          page.getByRole("listbox", { includeHidden: true }),
        ).toHaveCount(0)
      }

      await preview
        .getByRole("button", { name: "Submit labels", exact: true })
        .click()

      await expect(
        preview.getByLabel("Submitted labels", { exact: true }),
      ).toHaveText(JSON.stringify(labels))
    }

    await testInfo.attach("host-change-result.json", {
      body: JSON.stringify({
        action,
        labels: await tokens.allTextContents(),
        result: await checks
          .getByLabel("Host change result", { exact: true })
          .textContent(),
      }),
      contentType: "application/json",
    })
  })
}

test("controlled callback can queue its native label mirror @a11y", async ({
  page,
}, testInfo) => {
  const preview = await openSelect(page)
  const input = preview.getByRole("combobox", { name: "Choose labels" })

  const tokens = preview
    .getByRole("textbox", { name: "Label document" })
    .locator('[data-slot="editor-label"]')

  await preview
    .getByRole("button", { name: "Set host labels", exact: true })
    .click()

  await expect(tokens).toHaveText(["Form"])
  await preview
    .getByRole("button", { name: "Use host control", exact: true })
    .click()

  await preview
    .getByRole("button", { name: "Advanced host checks", exact: true })
    .click()
  const checks = preview.getByRole("region", { name: "Advanced host checks" })
  await checks
    .getByRole("button", { name: "Queue host labels", exact: true })
    .click()
  await input.fill("Dialog")
  await page.getByRole("option", { name: "Dialog", exact: true }).click()
  await expect(tokens).toHaveText(["Form", "Dialog"])
  await expect(input).toHaveValue("")
  await expect(
    checks.getByLabel("Host change result", { exact: true }),
  ).toHaveText("accepted")
  await input.press("Tab")
  await preview
    .getByRole("button", { name: "Submit labels", exact: true })
    .click()
  await expect(
    preview.getByLabel("Submitted labels", { exact: true }),
  ).toHaveText('["Form","Dialog"]')
  await saveAccessibility(page, testInfo, "labels-controlled-host-callback")
})

for (const [slug, name] of [
  ["labels-select", "EditorLabelsSelect"],
  ["labels-input", "EditorLabelsInput"],
  ["labels-content", "EditorLabelsContent"],
  ["labels-tag", "EditorLabelsTag"],
]) {
  test(`${name} has public preview and copyable source @a11y`, async ({
    page,
    context,
  }, testInfo) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"])
    const response = await page.goto(`/editor/${slug}`)
    expect(response?.status()).toBe(200)
    await expect(
      page.getByRole("heading", {
        name: editorPartLabel(name),
        exact: true,
        level: 1,
      }),
    ).toBeVisible()
    await expect(
      page.getByRole("combobox", { name: "Choose labels" }),
    ).toBeVisible()
    await page
      .getByRole("button", { name: `Copy ${name} usage`, exact: true })
      .click()
    const source = await page.evaluate(() => navigator.clipboard.readText())
    expect(source).toContain('from "@/components/editor/labels"')
    expect(source).not.toMatch(
      /@registry\/|@workspace\/|@yopem-ui\/|@\/catalog\//,
    )
    await saveAccessibility(page, testInfo, slug)
  })
}
