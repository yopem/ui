import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

function readButtonAppearance(element: Element) {
  const computed = getComputedStyle(element)

  return {
    background: computed.backgroundColor,
    border: computed.borderColor,
    shadow: computed.boxShadow,
    color: computed.color,
  }
}

const examples = [
  {
    slug: "basic-marks",
    commands: [
      "Bold",
      "Italic",
      "Underline",
      "Strikethrough",
      "Inline code",
      "Highlight",
      "Subscript",
      "Superscript",
      "Undo",
      "Redo",
    ],
  },
  {
    slug: "basic-nodes",
    commands: [
      "Paragraph",
      "Heading 1",
      "Heading 2",
      "Heading 3",
      "Quote",
      "Bold",
      "Undo",
      "Redo",
    ],
  },
  { slug: "link", commands: ["Link", "Undo", "Redo"] },
  {
    slug: "installation-next-02-marks",
    commands: ["Bold", "Italic", "Underline", "Undo", "Redo"],
  },
  {
    slug: "installation-next-03-elements",
    commands: [
      "Paragraph",
      "Heading 1",
      "Heading 2",
      "Heading 3",
      "Quote",
      "Bold",
      "Undo",
      "Redo",
    ],
  },
  {
    slug: "editor-default",
    commands: [
      "Bold",
      "Italic",
      "Underline",
      "Paragraph",
      "Heading 1",
      "Bullet list",
      "Numbered list",
      "Indent",
      "Outdent",
      "Link",
      "Insert table",
      "Undo",
      "Redo",
    ],
  },
  {
    slug: "editor-disabled",
    commands: ["Bold", "Italic", "Underline", "Undo", "Redo"],
  },
  {
    slug: "public-native-editing",
    commands: [
      "Paragraph",
      "Heading 1",
      "Heading 6",
      "Code block",
      "Quote",
      "Bullet list",
      "Numbered list",
      "Checklist",
      "Align center",
      "Indent",
      "Outdent",
      "Undo",
      "Redo",
    ],
  },
  {
    slug: "public-styles",
    commands: [
      "Align left",
      "Align center",
      "Align right",
      "Align justify",
      "Bold",
      "Indent",
      "Outdent",
      "Undo",
      "Redo",
    ],
  },
  { slug: "public-tables", commands: ["Insert table", "Undo", "Redo"] },
  {
    slug: "public-blocks",
    commands: [
      "Insert callout",
      "Insert toggle",
      "Toggle disclosure",
      "Link",
      "Indent",
      "Outdent",
      "Bullet list",
      "Bold",
      "Undo",
      "Redo",
    ],
  },
  {
    slug: "public-playground",
    commands: [
      "Bold",
      "Italic",
      "Underline",
      "Align left",
      "Align center",
      "Align right",
      "Clear formatting",
      "Insert callout",
      "Insert toggle",
      "Toggle disclosure",
      "Undo",
      "Redo",
    ],
  },
  { slug: "controlled", commands: ["Bold", "Undo", "Redo"] },
] as const

for (const { slug, commands } of examples) {
  test(`${slug}: standard toolbar actions have decorative icons and stable names`, async ({
    page,
  }, testInfo) => {
    await page.goto("/editor/examples")
    const example = page.getByTestId(`editor-example-${slug}`)
    await example
      .getByRole("button", { name: "Live preview", exact: true })
      .click()
    await expect(
      example.locator('[data-lexical-editor="true"]').first(),
    ).toBeVisible()
    const toolbars = example.getByRole("toolbar")
    await expect(toolbars.first()).toBeVisible()

    for (const name of commands) {
      const buttons = toolbars.getByRole("button", { name, exact: true })
      await expect(buttons.first()).toBeVisible()

      for (const button of await buttons.all()) {
        await expect(button).toHaveText("")
        await expect(button).toHaveAttribute("title", name)
        await expect(button.locator("svg").first()).toBeVisible()
        await expect(button.locator("svg").first()).toHaveAttribute(
          "aria-hidden",
          "true",
        )
        const bounds = await button.boundingBox()

        if (!bounds) throw new Error(`Missing ${name} icon button geometry`)
        expect(bounds.width).toBeCloseTo(bounds.height, 0)

        if (slug === "editor-disabled") await expect(button).toBeDisabled()
      }
    }

    await toolbars.first().scrollIntoViewIfNeeded()
    await testInfo.attach(`${slug}-icon-toolbar.png`, {
      body: await page.screenshot({ scale: "css" }),
      contentType: "image/png",
    })
  })
}

for (const theme of ["light", "dark"] as const) {
  for (const width of [390, 1280]) {
    test(`icon toolbar preserves native formatting, history and keyboard navigation at ${width}px in ${theme} theme @a11y`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 900 })
      await page.addInitScript(
        (value) => localStorage.setItem("yopem-ui-theme", value),
        theme,
      )
      await page.goto("/editor/examples")
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme)
      const example = page.getByTestId("editor-example-basic-marks")
      await example
        .getByRole("button", { name: "Live preview", exact: true })
        .click()

      const editor = example.getByRole("textbox", {
        name: "Basic marks editor",
        exact: true,
      })

      await expect(editor).toHaveAttribute("contenteditable", "true")
      const toolbar = example.getByRole("toolbar")
      const bold = toolbar.getByRole("button", { name: "Bold", exact: true })

      const italic = toolbar.getByRole("button", {
        name: "Italic",
        exact: true,
      })

      await bold.focus()
      await page.keyboard.press("ArrowRight")
      await expect(italic).toBeFocused()
      await editor.fill("Keep this native text")
      await expect(italic).toHaveAttribute("aria-pressed", "false")
      await page.mouse.move(0, 0)
      const inactiveAppearance = await italic.evaluate(readButtonAppearance)
      const pointerAction = testInfo.project.use.hasTouch ? "tap" : "click"
      const undo = toolbar.getByRole("button", { name: "Undo", exact: true })
      const redo = toolbar.getByRole("button", { name: "Redo", exact: true })

      await editor.press("ControlOrMeta+a")
      await italic[pointerAction]()
      await expect(italic).toHaveAttribute("aria-pressed", "true")
      await page.mouse.move(0, 0)
      await expect
        .poll(() => italic.evaluate(readButtonAppearance))
        .not.toEqual(inactiveAppearance)
      await expect(editor).toHaveText("Keep this native text")
      await undo[pointerAction]()
      await expect(italic).toHaveAttribute("aria-pressed", "false")
      await page.mouse.move(0, 0)
      await expect
        .poll(() => italic.evaluate(readButtonAppearance))
        .toEqual(inactiveAppearance)
      await redo[pointerAction]()
      await expect(italic).toHaveAttribute("aria-pressed", "true")
      await page.mouse.move(0, 0)
      await expect
        .poll(() => italic.evaluate(readButtonAppearance))
        .not.toEqual(inactiveAppearance)
      await expect(editor).toHaveText("Keep this native text")
      const bounds = await toolbar.boundingBox()

      if (!bounds) throw new Error("Missing icon toolbar geometry")
      expect(bounds.x).toBeGreaterThanOrEqual(0)
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width)
      expect(
        await toolbar.evaluate(
          (element) => element.scrollWidth <= element.clientWidth,
        ),
      ).toBe(true)

      const report = await new AxeBuilder({ page })
        .options({ resultTypes: ["violations", "incomplete"] })
        .analyze()

      await testInfo.attach("icon-toolbar-axe.json", {
        body: JSON.stringify(report),
        contentType: "application/json",
      })
      expect(report.violations).toEqual([])
      await toolbar.scrollIntoViewIfNeeded()
      await testInfo.attach(`icon-toolbar-${theme}-${width}.png`, {
        body: await page.screenshot({ scale: "css" }),
        contentType: "image/png",
      })
    })
  }
}
