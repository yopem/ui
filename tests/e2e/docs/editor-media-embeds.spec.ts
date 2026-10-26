import type { Page } from "@playwright/test"

import { expect, test } from "@playwright/test"

const tweetEmbedUrl =
  "https://platform.twitter.com/embed/Tweet.html?id=1234567890123456789"

const iframeUrl = "https://embed.example.com/player/42"

async function openMediaEmbedsExample(page: Page) {
  await page.goto("/editor/examples#public-media-embeds")
  const example = page.getByTestId("editor-example-public-media-embeds")

  await expect(example).toBeVisible()
  await example
    .getByRole("button", { name: "Live preview", exact: true })
    .click()
  await expect(
    example.getByRole("textbox", {
      name: "Configured media editor",
      exact: true,
    }),
  ).toHaveAttribute("contenteditable", "true")

  return example
}

test("tweet and configured iframe content load only after consent", async ({
  page,
}) => {
  const requests: string[] = []

  await page.route("https://platform.twitter.com/**", async (route) => {
    requests.push(route.request().url())
    await route.fulfill({
      contentType: "text/html",
      body: "<!doctype html><title>Local embed fixture</title>",
    })
  })
  await page.route("https://embed.example.com/**", async (route) => {
    requests.push(route.request().url())
    await route.fulfill({
      contentType: "text/html",
      body: "<!doctype html><title>Local iframe fixture</title>",
    })
  })
  const example = await openMediaEmbedsExample(page)

  await expect(example.locator("iframe[src]")).toHaveCount(0)
  await expect(
    example.getByRole("link", {
      name: "Open external content from untrusted.example.net",
      exact: true,
    }),
  ).toBeVisible()
  expect(requests).toEqual([])

  const tweetConsent = example
    .getByRole("button", {
      name: "Load content from platform.twitter.com",
      exact: true,
    })
    .first()

  await tweetConsent.evaluate((element) => {
    element.addEventListener("click", (event) => event.preventDefault(), {
      once: true,
    })
  })
  await tweetConsent.click()
  await expect(example.locator(`iframe[src="${tweetEmbedUrl}"]`)).toHaveCount(0)
  expect(requests).toEqual([])

  await tweetConsent.click()

  const tweetFrame = example.getByTitle("Yopem UI announcement", {
    exact: true,
  })

  await expect(tweetFrame).toHaveAttribute("src", tweetEmbedUrl)
  await expect(tweetFrame).toHaveAttribute(
    "sandbox",
    "allow-scripts allow-presentation",
  )
  await expect(tweetFrame).toHaveAttribute("referrerpolicy", "no-referrer")
  await expect(tweetFrame).not.toHaveAttribute("allow")
  await expect.poll(() => requests.length).toBe(1)

  await example
    .getByRole("button", { name: "Disable X embeds", exact: true })
    .click()
  await expect(tweetFrame).toHaveCount(0)
  await expect(
    example.getByRole("button", {
      name: "Load content from platform.twitter.com",
      exact: true,
    }),
  ).toHaveCount(0)
  await example
    .getByRole("button", { name: "Enable X embeds", exact: true })
    .click()

  const renewedTweetConsent = example
    .getByRole("button", {
      name: "Load content from platform.twitter.com",
      exact: true,
    })
    .first()

  await expect(renewedTweetConsent).toBeVisible()
  expect(requests).toHaveLength(1)
  await renewedTweetConsent.click()
  await expect.poll(() => requests.length).toBe(2)

  const iframeConsent = example.getByRole("button", {
    name: "Load content from embed.example.com",
    exact: true,
  })

  await iframeConsent.click()

  const configuredFrame = example.getByTitle("Configured product frame", {
    exact: true,
  })

  await expect(configuredFrame).toHaveAttribute("src", iframeUrl)
  await expect.poll(() => requests.length).toBe(3)

  await example
    .getByRole("button", { name: "Change tweet source", exact: true })
    .click()
  await expect(tweetFrame).toHaveCount(0)
  await expect(tweetConsent.first()).toBeVisible()
  await expect.poll(() => requests.length).toBe(3)

  await expect(
    example.getByLabel("Video demo", { exact: true }),
  ).toHaveAttribute("controls", "")
  await expect(
    example.getByLabel("Audio demo", { exact: true }),
  ).toHaveAttribute("controls", "")
})

test("disabling a configured embed revokes consent until enabled again", async ({
  page,
}) => {
  await page.route("https://embed.example.com/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<!doctype html><title>Local iframe fixture</title>",
    }),
  )
  const example = await openMediaEmbedsExample(page)

  const consent = example.getByRole("button", {
    name: "Load content from embed.example.com",
    exact: true,
  })

  await consent.click()
  const frame = example.getByTitle("Configured product frame", { exact: true })
  await expect(frame).toHaveAttribute("src", iframeUrl)

  await example
    .getByRole("button", { name: "Disable configured embed", exact: true })
    .click()
  await expect(frame).toHaveCount(0)
  await expect(consent).toBeDisabled()

  await example
    .getByRole("button", { name: "Enable configured embed", exact: true })
    .click()
  await expect(consent).toBeEnabled()
  await expect(frame).toHaveCount(0)
})

test("consent stays local to each embed instance", async ({ page }) => {
  await page.route("https://platform.twitter.com/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<!doctype html><title>Local embed fixture</title>",
    }),
  )
  const example = await openMediaEmbedsExample(page)

  const consentButtons = example.getByRole("button", {
    name: "Load content from platform.twitter.com",
    exact: true,
  })

  await expect(consentButtons).toHaveCount(2)
  await consentButtons.first().click()
  await expect(
    example.getByTitle("Yopem UI announcement", { exact: true }),
  ).toBeVisible()
  await expect(consentButtons.nth(1)).toBeVisible()
})
