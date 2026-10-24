import { expect, test } from "@playwright/test"

const selections = [
  "whole",
  "full-text",
  "full-backward",
  "summary",
  "body",
  "cross",
  "backward",
] as const

test.beforeEach(async ({ page, context }) => {
  test.slow()
  await page.goto("/docs/editor", { waitUntil: "domcontentloaded" })
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: new URL(page.url()).origin,
  })

  const editor = page.getByRole("textbox", {
    name: "Blocks editor",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.fill("Target:")
  await page
    .getByRole("toolbar", { name: "Blocks", exact: true })
    .getByRole("button", { name: "Insert toggle", exact: true })
    .click()
  await editor.press("ControlOrMeta+b")
  await editor.pressSequentially("Title")
  await editor.press("ControlOrMeta+b")
  await editor.press("Enter")
  await editor.press("ControlOrMeta+i")
  await editor.pressSequentially("Body one")
  await editor.press("ControlOrMeta+i")
  await editor.press("Enter")
  await editor.pressSequentially("Body two")
  await expect(editor.locator("[data-editor-toggle-summary]")).toHaveText(
    "Title",
  )
  await expect(editor.locator("details p")).toHaveText(["Body one", "Body two"])
})

for (const selection of selections) {
  for (const operation of ["copy", "cut"] as const) {
    test(`native ${operation} retains ${selection} toggle selection`, async ({
      page,
    }, testInfo) => {
      const errors: string[] = []
      page.on("pageerror", (error) => errors.push(error.message))

      const editor = page.getByRole("textbox", {
        name: "Blocks editor",
        exact: true,
      })

      const details = editor.locator("[data-editor-toggle]")

      const selected = await details.evaluate((element, kind) => {
        const document = element.ownerDocument
        const summary = element.querySelector("[data-editor-toggle-summary]")
        const paragraph = element.querySelector("[data-editor-toggle-body] p")

        if (!summary || !paragraph)
          throw new Error("Missing block selection fixture")

        const summaryText = document
          .createTreeWalker(summary, NodeFilter.SHOW_TEXT)
          .nextNode()

        const bodyText = document
          .createTreeWalker(paragraph, NodeFilter.SHOW_TEXT)
          .nextNode()

        const browserSelection = document.getSelection()

        if (!summaryText || !bodyText || !browserSelection)
          throw new Error("Missing native block selection")
        const range = document.createRange()

        if (kind === "whole") range.selectNode(element)
        else if (kind === "full-text" || kind === "full-backward") {
          const last = element.querySelector(
            "[data-editor-toggle-content] p:last-child",
          )

          const lastText =
            last &&
            document.createTreeWalker(last, NodeFilter.SHOW_TEXT).nextNode()

          if (!lastText) throw new Error("Missing final body text")
          range.setStart(summaryText, 0)
          range.setEnd(lastText, lastText.textContent?.length ?? 0)
        } else if (kind === "summary") {
          range.setStart(summaryText, 1)
          range.setEnd(summaryText, 4)
        } else if (kind === "body") {
          range.setStart(bodyText, 3)
          range.setEnd(bodyText, 7)
        } else {
          range.setStart(summaryText, 1)
          range.setEnd(bodyText, 3)
        }

        browserSelection.removeAllRanges()
        browserSelection.addRange(range)

        if (kind === "full-backward")
          browserSelection.setBaseAndExtent(
            range.endContainer,
            range.endOffset,
            range.startContainer,
            range.startOffset,
          )

        if (kind === "backward")
          browserSelection.setBaseAndExtent(bodyText, 3, summaryText, 1)

        return browserSelection.toString().replace(/\s+/g, "")
      }, selection)

      const expected = {
        whole: "TitleBodyoneBodytwo",
        "full-text": "TitleBodyoneBodytwo",
        "full-backward": "TitleBodyoneBodytwo",
        summary: "itl",
        body: "yon",
        cross: "itleBod",
        backward: "itleBod",
      }[selection]

      expect(selected).toBe(expected)
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => resolve()),
          ),
      )
      const before = await editor.textContent()
      await page.keyboard.press(
        operation === "copy" ? "ControlOrMeta+c" : "ControlOrMeta+x",
      )

      if (operation === "cut")
        await expect.poll(() => editor.textContent()).not.toBe(before)
      else await expect(editor).toHaveText(before ?? "")

      const sourceWrappers = await details.count()

      const sourceTexts = (await details.allTextContents()).map((text) =>
        text.replace(/\s+/g, ""),
      )

      const destination = editor.locator(":scope > p").first()
      await expect(destination).toHaveText("Target:")
      await destination.click()
      await page.keyboard.press("End")
      await page.keyboard.press("ControlOrMeta+v")

      if (["whole", "full-text", "full-backward"].includes(selection)) {
        await expect(details).toHaveCount(sourceWrappers + 1)
        await expect
          .poll(async () =>
            (await details.allTextContents())
              .map((text) => text.replace(/\s+/g, ""))
              .sort(),
          )
          .toEqual([...sourceTexts, expected].sort())
        await expect(
          details
            .locator("[data-editor-toggle-summary] strong")
            .filter({ hasText: "Title" }),
        ).toHaveCount(operation === "copy" ? 2 : 1)
        await expect(
          details
            .locator("[data-editor-toggle-content] em")
            .filter({ hasText: "Body one" }),
        ).toHaveCount(operation === "copy" ? 2 : 1)
        await expect(destination).toHaveText("Target:")
      } else {
        await expect
          .poll(async () =>
            (await editor.locator(":scope > p").allTextContents())
              .join("")
              .replace(/\s+/g, ""),
          )
          .toBe(`Target:${expected}`)
      }

      await page
        .getByRole("button", { name: "Roundtrip blocks JSON", exact: true })
        .click()
      await expect(page.getByRole("alert")).toHaveCount(0)
      expect(errors).toEqual([])
      await testInfo.attach("native-block-clipboard.json", {
        body: Buffer.from(
          JSON.stringify({
            selection,
            operation,
            selected,
            sourceWrappers,
            sourceTexts,
            errors,
          }),
        ),
        contentType: "application/json",
      })
    })
  }
}
