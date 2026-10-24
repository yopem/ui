import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test.use({ hasTouch: true })

test("native touch scrolls suggestions without selection and inserts mentions and emoji", async ({
  page,
  context,
}, testInfo) => {
  test.slow()
  await page.route("**/typeahead-fixture?*", async (route) => {
    await route.fulfill({
      json: Array.from({ length: 25 }, (_, index) => ({
        id: `member-${index}`,
        label: `Member ${index}`,
      })),
    })
  })
  await page.goto("/docs/editor")

  const editor = page.getByRole("textbox", {
    name: "HTTP typeahead editor",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.tap()
  await page.keyboard.type("@Member")

  const firstMember = page.getByRole("option", {
    name: "Member 0",
    exact: true,
  })

  await expect(firstMember).toBeVisible()
  await expect
    .poll(async () => (await firstMember.boundingBox())?.height ?? 0)
    .toBeGreaterThanOrEqual(44)
  const mentionTargetHeight = (await firstMember.boundingBox())?.height

  const viewports = page.locator(
    '[data-slot="editor-inline-combobox-content"] [data-slot="popover-viewport"], [data-slot="editor-inline-combobox-content"] [data-slot="scroll-area-viewport"]',
  )

  const scrollIndex = await viewports.evaluateAll((elements) =>
    elements.findIndex(
      (element) =>
        element.scrollHeight > element.clientHeight &&
        /auto|scroll/.test(getComputedStyle(element).overflowY),
    ),
  )

  expect(scrollIndex).toBeGreaterThanOrEqual(0)
  const viewport = viewports.nth(scrollIndex)
  const before = await viewport.evaluate((element) => element.scrollTop)
  let after = before
  const bounds = await viewport.boundingBox()

  if (!bounds) throw new Error("Suggestions need visible scroll geometry")
  const size = page.viewportSize()

  if (!size) throw new Error("Touch workflow needs a fixed viewport")
  const x = bounds.x + bounds.width / 2
  const start = Math.min(bounds.y + bounds.height - 18, size.height - 18)
  const end = Math.max(bounds.y + 18, start - 200)
  expect(start - end).toBeGreaterThan(20)
  const session = await context.newCDPSession(page)

  try {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y: start }],
    })

    for (let step = 1; step <= 8; step += 1) {
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x, y: start + ((end - start) * step) / 8 }],
      })
    }

    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    })
    await expect
      .poll(() => viewport.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(before)
    after = await viewport.evaluate((element) => element.scrollTop)
    await expect(editor).toHaveText("@Member")
    await page.getByRole("option", { name: "Member 20", exact: true }).tap()
    await expect(editor.locator('[data-slot="editor-mention"]')).toHaveText(
      "@Member 20",
    )
    await expect(editor).toBeFocused()
  } finally {
    await session.detach()
  }

  const composed = page.getByRole("textbox", {
    name: "Typeahead editor",
    exact: true,
  })

  await expect(composed).toHaveAttribute("contenteditable", "true")
  await composed.tap()
  await page.keyboard.type("Touch ")
  await page
    .getByTestId("typeahead-example")
    .getByRole("button", { name: "Emoji", exact: true })
    .tap()
  await page
    .getByRole("combobox", { name: "Search emoji", exact: true })
    .fill("woman_technologist")

  const emojiOption = page.getByRole("option", {
    name: "👩‍💻 woman technologist",
    exact: true,
  })

  await expect
    .poll(async () => (await emojiOption.boundingBox())?.height ?? 0)
    .toBeGreaterThanOrEqual(44)
  const emojiTargetHeight = (await emojiOption.boundingBox())?.height

  await emojiOption.tap()
  await expect(composed).toContainText("Touch 👩‍💻")
  await expect(composed).toBeFocused()
  await expect(editor.locator('[data-slot="editor-mention"]')).toHaveText(
    "@Member 20",
  )

  const result = await new AxeBuilder({ page }).analyze()
  expect(result.violations).toEqual([])
  await testInfo.attach("native-touch-result", {
    body: JSON.stringify({
      protocol: "Input.dispatchTouchEvent",
      scrollBefore: before,
      scrollAfter: after,
      coarsePointer: await page.evaluate(
        () => matchMedia("(pointer: coarse)").matches,
      ),
      mentionTargetHeight,
      emojiTargetHeight,
      mention: await editor.textContent(),
      emoji: await composed.textContent(),
    }),
    contentType: "application/json",
  })
})
