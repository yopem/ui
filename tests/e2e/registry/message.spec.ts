import { expect, test } from "@playwright/test"

import { openPreview } from "./helpers"

test("message examples have independent previews and heading anchors", async ({
  page,
}) => {
  await openPreview(page, "message")

  const examples = [
    ["Avatar", "avatar"],
    ["Group", "group"],
    ["Header and footer", "header-and-footer"],
    ["Actions", "actions"],
    ["Attachment", "attachment"],
    ["Status updates", "status-updates"],
  ] as const

  const previews = page.locator('[aria-label$="live preview"]')
  await expect(previews).toHaveCount(examples.length + 1)
  await expect(previews.nth(0)).toHaveAttribute(
    "aria-label",
    "Basic conversation live preview",
  )

  for (const [index, [name, id]] of examples.entries()) {
    await expect(previews.nth(index + 1)).toHaveAttribute(
      "aria-label",
      `${name} live preview`,
    )
    const heading = page.getByRole("heading", { name, exact: true })
    await expect(heading).toBeVisible()
    await expect(heading).toHaveAttribute("id", id)
    await page.goto(`/components/message#${id}`)
    await expect(page).toHaveURL(new RegExp(`#${id}$`))
    await expect(heading).toBeVisible()
  }
})

test("message examples copy their own source", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await openPreview(page, "message")

  const sources: string[] = []

  for (const name of ["Avatar", "Group"]) {
    await page
      .getByRole("button", { name: `Copy ${name} source`, exact: true })
      .click()
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .not.toBe(sources.at(-1) ?? "")
    const source = await page.evaluate(() => navigator.clipboard.readText())
    expect(source).toContain('from "@/components/ui/message"')
    expect(source).toContain("Preview")
    expect(source).not.toContain("@registry/")
    sources.push(source)
  }

  expect(sources[0]).not.toContain("MessageGroup")
  expect(sources[1]).toContain("MessageGroup")
  expect(sources[1]).not.toContain("Copy message")
  expect(sources[0]).not.toBe(sources[1])
})

test("message previews mirror layout and keep grouped content aligned", async ({
  page,
}, testInfo) => {
  await openPreview(page, "message")

  const avatars = page.getByLabel("Avatar live preview", { exact: true })

  const messages = avatars.locator('[data-slot="message"]')

  await expect(messages.nth(1)).toBeVisible()

  for (const [direction, startBeforeEnd] of [
    ["ltr", true],
    ["rtl", false],
  ] as const) {
    await avatars.evaluate(
      (element, value) => element.setAttribute("dir", value),
      direction,
    )

    for (const [index, avatarFirst] of [
      startBeforeEnd,
      !startBeforeEnd,
    ].entries()) {
      const message = messages.nth(index)

      const avatar = await message
        .locator('[data-slot="message-avatar"]')
        .boundingBox()

      const content = await message
        .locator('[data-slot="message-content"]')
        .boundingBox()

      expect(avatar).not.toBeNull()
      expect(content).not.toBeNull()

      if (!avatar || !content) throw new Error("Message slots are not visible")

      if (avatarFirst)
        expect(avatar.x + avatar.width).toBeLessThanOrEqual(content.x)
      else expect(content.x + content.width).toBeLessThanOrEqual(avatar.x)
    }
  }

  await avatars.evaluate((element) => element.removeAttribute("dir"))

  const group = page.getByLabel("Group live preview", { exact: true })

  const groupMessages = group.locator('[data-slot="message"]')

  const emptyAvatar = group
    .locator('[data-slot="message-avatar"]:empty')
    .first()

  await expect(group.locator('[data-slot="message-group"]')).toBeVisible()

  const emptyWidth = await emptyAvatar.evaluate(
    (element) => element.getBoundingClientRect().width,
  )

  const filledBox = await group
    .locator('[data-slot="message-avatar"]:not(:empty)')
    .first()
    .boundingBox()

  expect(filledBox).not.toBeNull()

  if (!filledBox) throw new Error("The avatar is not visible")

  expect(emptyWidth).toBeCloseTo(filledBox.width, 0)

  const firstContent = await groupMessages
    .first()
    .locator('[data-slot="message-content"]')
    .boundingBox()

  const lastContent = await groupMessages
    .last()
    .locator('[data-slot="message-content"]')
    .boundingBox()

  expect(firstContent).not.toBeNull()
  expect(lastContent).not.toBeNull()

  if (!firstContent || !lastContent)
    throw new Error("Grouped content is not visible")

  expect(firstContent.x).toBeCloseTo(lastContent.x, 0)

  const details = page.getByLabel("Header and footer live preview", {
    exact: true,
  })

  const content = details.locator('[data-slot="message-content"]').first()

  await expect(content.locator('[data-slot="message-header"]')).toBeVisible()
  await expect(content.locator('[data-slot="message-footer"]')).toBeVisible()

  await testInfo.attach("message-layout", {
    body: await page.screenshot({ fullPage: true, animations: "disabled" }),
    contentType: "image/png",
  })
})

test("message content wraps within a narrow viewport", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 })
  await openPreview(page, "message")

  const content = page
    .getByLabel("Basic conversation live preview", { exact: true })
    .locator('[data-slot="message-content"]')
    .first()

  const messageText = content.locator('[data-slot="text"]')

  await messageText.evaluate((element) => {
    element.textContent = "Unbroken".repeat(50)
  })

  const size = await content.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
    height: element.getBoundingClientRect().height,
  }))

  const lineHeight = await messageText.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).lineHeight),
  )

  expect(size.scrollWidth).toBeLessThanOrEqual(size.clientWidth + 1)
  expect(size.height).toBeGreaterThan(lineHeight * 2)
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320)
})

test("message actions copy text and download an attachment", async ({
  page,
  context,
  hasTouch,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await openPreview(page, "message")

  const actions = page.getByLabel("Actions live preview", { exact: true })

  const action = actions.getByRole("button", {
    name: "Copy message",
    exact: true,
  })

  if (hasTouch) await action.tap()
  else {
    await action.focus()
    await expect(action).toBeFocused()
    await page.keyboard.press("Enter")
  }

  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe("I can send the notes this afternoon.")

  const like = actions.getByRole("button", {
    name: "Like message",
    exact: true,
  })

  const dislike = actions.getByRole("button", {
    name: "Dislike message",
    exact: true,
  })

  await like.click()
  await expect(like).toHaveAttribute("aria-pressed", "true")
  await dislike.click()
  await expect(like).toHaveAttribute("aria-pressed", "false")
  await expect(dislike).toHaveAttribute("aria-pressed", "true")

  const retry = actions.getByRole("button", { name: "Retry send", exact: true })

  await retry.click()
  await expect(retry).toBeDisabled()

  const attachment = page
    .getByLabel("Attachment live preview", { exact: true })
    .getByRole("link", {
      name: "Meeting notes.txt",
      exact: true,
    })

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    attachment.click(),
  ])

  expect(download.suggestedFilename()).toBe("Meeting notes.txt")
  expect(await download.failure()).toBeNull()
})

test("message uses portraits when available and falls back on image failure", async ({
  page,
}) => {
  await page.route("https://images.pexels.com/photos/220453/**", (route) =>
    route.abort(),
  )

  await openPreview(page, "message")

  const example = page.getByLabel("Avatar live preview", { exact: true })

  const image = example.locator('[data-slot="avatar-image"]')
  const fallback = example.locator('[data-slot="avatar-fallback"]')

  await expect(image).toHaveCount(1)
  await expect(image).toHaveAttribute(
    "src",
    /^https:\/\/images\.pexels\.com\/photos\//,
  )
  await expect
    .poll(() =>
      image.evaluate(
        (element) =>
          element instanceof HTMLImageElement && element.naturalWidth > 0,
      ),
    )
    .toBe(true)
  await expect(fallback).toHaveCount(1)
  await expect(fallback).toBeVisible()
})
