import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page, type TestInfo } from "@playwright/test"
import { z } from "zod"

const original = "Keep "

const committed = "日本語"

async function prepareComposition(page: Page, errors: string[]) {
  page.on("pageerror", (cause) => errors.push(cause.message))
  await page.goto("/components/editor-review")

  const editor = page.getByRole("textbox", {
    name: "Review document",
    exact: true,
  })

  const panel = page.getByRole("complementary", {
    name: "Document review",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.fill(original)
  await page.getByRole("button", { name: "Suggest edits", exact: true }).click()
  await editor.click()
  await page.keyboard.press("ControlOrMeta+End")
  await editor.evaluate((element) => {
    const document = element.ownerDocument

    const observations: {
      type: string
      data: string | null
      inputType: string | null
      cancelable: boolean
      trusted: boolean
      composing: boolean
    }[] = []

    document.addEventListener(
      "beforeinput",
      function observeInput(event) {
        if (!event.composedPath().includes(element)) return
        observations.push({
          type: event.type,
          data: event.data,
          inputType: event.inputType,
          cancelable: event.cancelable,
          trusted: event.isTrusted,
          composing: event.isComposing,
        })
        document.body.dataset.reviewImeEvents = JSON.stringify(
          observations.slice(-32),
        )
      },
      true,
    )

    for (const type of ["compositionstart", "compositionend"] as const)
      document.addEventListener(
        type,
        function observeComposition(event) {
          if (!event.composedPath().includes(element)) return
          observations.push({
            type: event.type,
            data: event.data,
            inputType: null,
            cancelable: event.cancelable,
            trusted: event.isTrusted,
            composing: false,
          })
          document.body.dataset.reviewImeEvents = JSON.stringify(
            observations.slice(-32),
          )
        },
        true,
      )
  })

  return {
    editor,
    panel,
    suggestions: panel.getByRole("button", {
      name: "Go to suggestion",
      exact: true,
    }),
  }
}

async function expectNativeComposition(page: Page, text: string) {
  const events = z
    .array(
      z.object({
        type: z.enum(["compositionstart", "beforeinput", "compositionend"]),
        data: z.string().nullable(),
        inputType: z.string().nullable(),
        cancelable: z.boolean(),
        trusted: z.boolean(),
        composing: z.boolean(),
      }),
    )
    .parse(
      JSON.parse(
        (await page.locator("body").getAttribute("data-review-ime-events")) ??
          "[]",
      ),
    )

  const start = events.findIndex(
    (event) => event.type === "compositionstart" && event.trusted,
  )

  const input = events.findIndex(
    (event) =>
      event.type === "beforeinput" &&
      event.inputType === "insertCompositionText" &&
      !event.cancelable &&
      event.trusted &&
      event.composing,
  )

  const end = events.findIndex(
    (event) =>
      event.type === "compositionend" && event.data === text && event.trusted,
  )

  expect(start).toBeGreaterThanOrEqual(0)
  expect(input).toBeGreaterThan(start)
  expect(end).toBeGreaterThan(input)
}

async function attachComposition(
  page: Page,
  testInfo: TestInfo,
  errors: readonly string[],
) {
  await testInfo.attach("native-review-ime.json", {
    body: JSON.stringify({
      errors,
      events: await page.locator("body").getAttribute("data-review-ime-events"),
    }),
    contentType: "application/json",
  })
}

for (const decision of ["accept", "reject"] as const) {
  test(`native IME composition commits one review suggestion for ${decision}`, async ({
    page,
    context,
  }, testInfo) => {
    test.slow()
    const errors: string[] = []

    const { editor, panel, suggestions } = await prepareComposition(
      page,
      errors,
    )

    const cdp = await context.newCDPSession(page)

    try {
      await cdp.send("Input.imeSetComposition", {
        text: "にほん",
        selectionStart: 3,
        selectionEnd: 3,
      })
      await cdp.send("Input.imeSetComposition", {
        text: committed,
        selectionStart: 3,
        selectionEnd: 3,
      })
      await cdp.send("Input.insertText", { text: committed })
      await expectNativeComposition(page, committed)
      await expect
        .poll(() => editor.innerText())
        .toBe(`${original}${committed}`)
      await expect(suggestions).toHaveCount(1)
      await panel
        .getByRole("button", {
          name: `${decision === "accept" ? "Accept" : "Reject"} all suggestions`,
          exact: true,
        })
        .click()
      await expect(suggestions).toHaveCount(0)
      await expect
        .poll(() => editor.innerText())
        .toBe(decision === "accept" ? `${original}${committed}` : original)
      await editor.press("ControlOrMeta+z")
      await expect(suggestions).toHaveCount(1)
      await expect
        .poll(() => editor.innerText())
        .toBe(`${original}${committed}`)
      await editor.press("ControlOrMeta+Shift+z")
      await expect(suggestions).toHaveCount(0)
      await expect
        .poll(() => editor.innerText())
        .toBe(decision === "accept" ? `${original}${committed}` : original)
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
      expect(errors).toEqual([])
    } finally {
      await attachComposition(page, testInfo, errors)
      await cdp.detach()
    }
  })
}

test("cancelled native IME composition preserves content and continued review", async ({
  page,
  context,
}, testInfo) => {
  test.slow()
  const errors: string[] = []
  const { editor, suggestions } = await prepareComposition(page, errors)
  const cdp = await context.newCDPSession(page)

  try {
    await cdp.send("Input.imeSetComposition", {
      text: "にほん",
      selectionStart: 3,
      selectionEnd: 3,
    })
    await cdp.send("Input.imeSetComposition", {
      text: "",
      selectionStart: 0,
      selectionEnd: 0,
    })
    await expectNativeComposition(page, "")
    await expect.poll(() => editor.innerText()).toBe(original)
    await expect(suggestions).toHaveCount(0)
    await expect(editor).toBeFocused()
    await page.keyboard.insertText("next")
    await expect.poll(() => editor.innerText()).toBe(`${original}next`)
    await expect(suggestions).toHaveCount(1)
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
    expect(errors).toEqual([])
  } finally {
    await attachComposition(page, testInfo, errors)
    await cdp.detach()
  }
})
