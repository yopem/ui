import type { Page } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

function eventStream(text: string) {
  return `event: text\ndata: ${JSON.stringify({ text })}\n\nevent: complete\ndata: {"version":1}\n\n`
}

async function mountPublicAi(page: Page) {
  await page.goto("/editor/examples#public-ai")
  const example = page.getByTestId("editor-example-public-ai")
  await expect(example).toBeVisible()
  await example
    .getByRole("button", { name: "Live preview", exact: true })
    .click()
  const setup = example.getByRole("region", { name: "AI host setup" })
  await setup.getByLabel("Host endpoint").fill("/__fixture-ai")
  await setup.getByLabel("Host document ID").fill("fixture-document")
  await setup.getByLabel("Host CSRF token").fill("fixture-csrf")
  await setup.getByRole("button", { name: "Configure AI" }).click()
  const editor = setup.getByRole("textbox", { name: "Public AI editor" })
  await expect(editor).toHaveAttribute("contenteditable", "true")

  return {
    example,
    editor,
    setup,
  }
}

async function installAiResponse(page: Page, text: string) {
  let calls = 0
  await page.route("**/__fixture-ai", async (route) => {
    calls++
    expect(route.request().headers()["x-csrf-token"]).toBe("fixture-csrf")
    await route.fulfill({
      contentType: "text/event-stream",
      body: eventStream(text),
    })
  })

  return () => calls
}

async function openCommand(page: Page, label: string) {
  const dialog = page.getByRole("dialog", { name: "AI command menu" })
  const search = dialog.getByRole("textbox", { name: "Search AI commands" })
  await search.fill(label)
  await search.press("Enter")
  await expect(
    dialog.locator('[data-slot="editor-ai-menu-status"]'),
  ).toHaveAttribute("data-state", "ready")

  return dialog
}

test("Mod+J searches commands and explicit approval replaces selection once", async ({
  page,
}) => {
  const calls = await installAiResponse(page, "Proposed copy")
  const { editor } = await mountPublicAi(page)
  await editor.fill("Selected copy")
  await editor.press("ControlOrMeta+a")
  await editor.press("ControlOrMeta+j")

  const dialog = page.getByRole("dialog", { name: "AI command menu" })
  await expect(dialog).toBeVisible()
  const search = dialog.getByRole("textbox", { name: "Search AI commands" })
  await search.fill("summarize")
  await search.press("Enter")
  await expect(
    dialog.locator('[data-slot="editor-ai-menu-status"]'),
  ).toHaveAttribute("data-state", "ready")
  await expect(editor).toHaveText("Selected copy")
  await expect(
    dialog.getByRole("group", { name: "AI chat history" }),
  ).toContainText("Proposed copy")
  await dialog.getByRole("button", { name: "Replace selection" }).click()
  await expect(editor).toHaveText("Proposed copy")
  await expect(dialog).toBeHidden()
  expect(calls()).toBe(1)

  await editor.click()
  await editor.press("ControlOrMeta+j")
  await expect(
    page.getByRole("dialog", { name: "AI command menu" }).getByRole("group", {
      name: "AI chat history",
    }),
  ).toContainText("Proposed copy")
  expect(calls()).toBe(1)
})

test("bounded chat sends follow-up context through the configured host", async ({
  page,
}) => {
  let calls = 0
  let followupBody = ""
  await page.route("**/__fixture-ai", async (route) => {
    calls++

    if (calls === 2) followupBody = route.request().postData() ?? ""

    await route.fulfill({
      contentType: "text/event-stream",
      body: eventStream(calls === 1 ? "First response" : "Second response"),
    })
  })
  const { editor } = await mountPublicAi(page)
  await editor.fill("Source text")
  await editor.press("ControlOrMeta+j")
  const dialog = page.getByRole("dialog", { name: "AI command menu" })
  const search = dialog.getByRole("textbox", { name: "Search AI commands" })
  await search.fill("Continue")
  await search.press("Enter")
  await expect(
    dialog.locator('[data-slot="editor-ai-menu-status"]'),
  ).toHaveAttribute("data-state", "ready")
  await dialog.getByRole("button", { name: "Discard proposal" }).click()
  const chat = dialog.getByRole("textbox", { name: "AI chat message" })
  await chat.fill("Explain this proposal")
  await chat.press("Enter")
  await expect(
    dialog.locator('[data-slot="editor-ai-menu-status"]'),
  ).toHaveAttribute("data-state", "ready")
  await expect.poll(() => calls).toBe(2)
  await expect.poll(() => followupBody).toContain("Explain this proposal")
  await expect.poll(() => followupBody).toContain("First response")
  await expect(editor).toHaveText("Source text")
  await expect(
    dialog.getByRole("group", { name: "AI chat history" }),
  ).toContainText("Second response")
})

test("chat truncation keeps well-formed Unicode in follow-up requests", async ({
  page,
}) => {
  let calls = 0
  let followupBody = ""
  await page.route("**/__fixture-ai", async (route) => {
    calls++

    if (calls === 2) followupBody = route.request().postData() ?? ""
    await route.fulfill({
      contentType: "text/event-stream",
      body: eventStream(calls === 1 ? "x".repeat(2047) + "😀" : "Follow-up"),
    })
  })
  const { editor } = await mountPublicAi(page)
  await editor.fill("Unicode source")
  await editor.press("ControlOrMeta+j")
  const dialog = await openCommand(page, "Continue")
  const history = dialog.getByRole("group", { name: "AI chat history" })
  await expect(history).toContainText("x".repeat(2047))
  await expect
    .poll(() =>
      history.evaluate((node) => node.scrollHeight > node.clientHeight),
    )
    .toBe(true)
  await history.focus()
  await page.keyboard.press("ArrowDown")
  await expect
    .poll(() => history.evaluate((node) => node.scrollTop))
    .toBeGreaterThan(0)

  const proposal = dialog.getByRole("group", {
    name: "AI proposal",
    exact: true,
  })

  await expect
    .poll(() =>
      proposal.evaluate((node) => node.scrollHeight > node.clientHeight),
    )
    .toBe(true)
  await proposal.focus()
  await page.keyboard.press("ArrowDown")
  await expect
    .poll(() => proposal.evaluate((node) => node.scrollTop))
    .toBeGreaterThan(0)
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  expect(await history.textContent()).not.toContain("\ud83d")
  await dialog.getByRole("button", { name: "Discard proposal" }).click()
  const chat = dialog.getByRole("textbox", { name: "AI chat message" })
  await chat.fill("Continue this conversation")
  await chat.press("Enter")
  await expect.poll(() => calls).toBe(2)
  expect(followupBody).not.toContain("\\ud83d")
})

test("empty-block Space and unselected context action open the menu", async ({
  page,
}) => {
  await installAiResponse(page, "Unused")
  const { editor } = await mountPublicAi(page)
  await editor.click()
  await editor.press("Space")
  let dialog = page.getByRole("dialog", { name: "AI command menu" })
  await expect(dialog).toBeVisible()
  await expect(editor).toBeEmpty()
  await dialog.getByRole("button", { name: "Close" }).click()

  await editor.fill("Context block")
  await editor.locator("p").click({ button: "right" })
  dialog = page.getByRole("dialog", { name: "AI command menu" })
  await expect(dialog).toBeVisible()
  await expect(editor).toHaveText("Context block")
})

test("toolbar Ask AI preserves selected text while opening the menu", async ({
  page,
}) => {
  await installAiResponse(page, "Unused")
  const { editor, example } = await mountPublicAi(page)
  await editor.fill("Selected source")
  await editor.press("ControlOrMeta+a")
  await example.getByRole("button", { name: "Ask AI" }).click()
  await expect(
    page.getByRole("dialog", { name: "AI command menu" }),
  ).toBeVisible()
  await expect(editor).toHaveText("Selected source")
})

test("Stop aborts a pending request and keeps document unchanged", async ({
  page,
}) => {
  let calls = 0
  let finish: (() => void) | undefined
  await page.route("**/__fixture-ai", async (route) => {
    calls++
    await new Promise<void>((resolve) => {
      finish = resolve
    })
    await route
      .fulfill({
        contentType: "text/event-stream",
        body: eventStream("Late proposal"),
      })
      .catch(() => undefined)
  })
  const { editor } = await mountPublicAi(page)
  await editor.fill("Keep this text")
  await editor.press("ControlOrMeta+j")
  const dialog = page.getByRole("dialog", { name: "AI command menu" })
  const search = dialog.getByRole("textbox", { name: "Search AI commands" })
  await search.fill("Continue")
  await search.press("Enter")

  try {
    await expect(
      dialog.locator('[data-slot="editor-ai-menu-status"]'),
    ).toHaveAttribute("data-state", "streaming")
    await expect.poll(() => calls).toBe(1)
    await dialog.getByRole("button", { name: "Stop" }).click()
    await expect(
      dialog.locator('[data-slot="editor-ai-menu-status"]'),
    ).toHaveAttribute("data-state", "cancelled")
    await expect(editor).toHaveText("Keep this text")
  } finally {
    finish?.()
  }
})

test("all menu actions use the configured stream and remain plain text proposals", async ({
  page,
}) => {
  const calls = await installAiResponse(page, "Plain proposal")
  const { editor } = await mountPublicAi(page)
  await editor.fill("Source text")
  await editor.press("ControlOrMeta+j")
  const dialog = page.getByRole("dialog", { name: "AI command menu" })
  const search = dialog.getByRole("textbox", { name: "Search AI commands" })

  for (const label of [
    "Continue",
    "Summarize",
    "Explain",
    "Improve",
    "Emojify",
    "Shorten",
    "Lengthen",
    "Fix grammar",
    "Simplify",
    "Comment",
    "Markdown sample",
    "MDX sample",
  ]) {
    await search.fill(label)
    await search.press("Enter")
    await expect(
      dialog.locator('[data-slot="editor-ai-menu-status"]'),
    ).toHaveAttribute("data-state", "ready")
    await expect(
      dialog.getByRole("group", { name: "AI chat history" }),
    ).toContainText("Plain proposal")
    await dialog.getByRole("button", { name: "Discard proposal" }).click()
  }

  expect(calls()).toBe(12)
  const history = dialog.getByRole("group", { name: "AI chat history" })
  await expect(history.getByText("You", { exact: true })).toHaveCount(6)
  await expect(history.getByText("AI", { exact: true })).toHaveCount(6)
  await expect(editor).toHaveText("Source text")
})

test("retry uses the same captured target; discard never changes the document", async ({
  page,
}) => {
  let calls = 0
  await page.route("**/__fixture-ai", async (route) => {
    calls++
    expect(route.request().headers()["x-csrf-token"]).toBe("fixture-csrf")
    await route.fulfill({
      contentType: "text/event-stream",
      body:
        calls === 1
          ? 'event: error\ndata: {"code":"provider_unavailable"}\n\n'
          : eventStream("Retry proposal"),
    })
  })
  const { editor } = await mountPublicAi(page)
  await editor.fill("Keep this text")
  await editor.press("ControlOrMeta+a")
  await editor.press("ControlOrMeta+j")
  const dialog = page.getByRole("dialog", { name: "AI command menu" })
  const search = dialog.getByRole("textbox", { name: "Search AI commands" })
  await search.fill("Improve")
  await search.press("Enter")
  await expect(
    dialog.locator('[data-slot="editor-ai-menu-status"]'),
  ).toHaveAttribute("data-state", "failed")
  await dialog.getByRole("button", { name: "Retry" }).click()
  await expect(
    dialog.locator('[data-slot="editor-ai-menu-status"]'),
  ).toHaveAttribute("data-state", "ready")
  await dialog.getByRole("button", { name: "Discard proposal" }).click()
  await expect(editor).toHaveText("Keep this text")
  expect(calls).toBe(2)
})

test("insert below preserves the selected block; undo removes only the proposal", async ({
  page,
}) => {
  await installAiResponse(page, "Below proposal")
  const { editor, example } = await mountPublicAi(page)
  await editor.fill("First block")
  await editor.press("Enter")
  await editor.pressSequentially("Following block")
  await editor.locator("p").first().click()
  await editor.press("Home")
  await editor.press("Shift+End")
  await editor.press("ControlOrMeta+j")
  const dialog = await openCommand(page, "Improve")
  await expect(editor.locator("p")).toHaveCount(2)
  await dialog.getByRole("button", { name: "Insert below" }).click()
  await expect(editor.locator("p")).toHaveCount(3)
  await expect(editor.locator("p").nth(0)).toHaveText("First block")
  await expect(editor.locator("p").nth(1)).toHaveText("Below proposal")
  await expect(editor.locator("p").nth(2)).toHaveText("Following block")
  await expect(dialog).toBeHidden()
  await example
    .getByRole("toolbar", { name: "AI tools" })
    .getByRole("button", { name: "Undo" })
    .click()
  await expect(editor.locator("p")).toHaveCount(2)
  await expect(editor.locator("p").first()).toHaveText("First block")
  await expect(editor.locator("p").last()).toHaveText("Following block")
})

test("review comments require explicit approval and support rejection", async ({
  page,
}) => {
  await installAiResponse(page, "Proposed review comment")
  const { editor, example } = await mountPublicAi(page)
  await editor.fill("Review this sentence")
  await editor.press("ControlOrMeta+a")
  await editor.press("ControlOrMeta+j")
  let dialog = await openCommand(page, "Comment")
  const review = example.getByRole("complementary", { name: "Document review" })
  await dialog.getByRole("button", { name: "Discard proposal" }).click()
  await dialog.getByRole("button", { name: "Close" }).click()
  await expect(review.getByRole("article")).toHaveCount(0)

  await editor.fill("Review this sentence")
  await editor.press("ControlOrMeta+a")
  await editor.press("ControlOrMeta+j")
  dialog = await openCommand(page, "Comment")
  await dialog.getByRole("button", { name: "Create review comment" }).click()
  await expect(dialog).toBeHidden()
  await expect(review.getByRole("article")).toHaveCount(1)
  await expect(editor).toHaveText("Review this sentence")
})

test("Markdown and MDX samples insert as text and never execute markup", async ({
  page,
}) => {
  let calls = 0
  await page.route("**/__fixture-ai", async (route) => {
    calls++
    await route.fulfill({
      contentType: "text/event-stream",
      body: eventStream(calls === 1 ? "## Markdown source" : "<Callout />"),
    })
  })
  const { editor } = await mountPublicAi(page)
  await editor.click()
  await editor.press("ControlOrMeta+j")
  let dialog = await openCommand(page, "Markdown sample")
  await dialog.getByRole("button", { name: "Insert at caret" }).click()
  await expect(editor).toContainText("## Markdown source")
  await expect(editor.locator("h2")).toHaveCount(0)
  await expect(dialog).toBeHidden()

  await editor.click()
  await editor.press("ControlOrMeta+j")
  dialog = await openCommand(page, "MDX sample")
  await dialog.getByRole("button", { name: "Insert at caret" }).click()
  await expect(editor).toContainText("<Callout />")
  await expect(editor.locator("callout")).toHaveCount(0)
  expect(calls).toBe(2)
})
