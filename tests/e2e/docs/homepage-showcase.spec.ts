import type { Page } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

function showcase(page: Page, slug: string) {
  return page.locator(`section[aria-labelledby="showcase-${slug}"]`)
}

async function openHomepage(page: Page) {
  await page.goto("/")
  await expect(
    page.getByRole("button", { name: "Search documentation", exact: true }),
  ).toBeEnabled()
}

test("distant previews load on approach and retain edited state", async ({
  page,
}) => {
  await openHomepage(page)
  const label = showcase(page, "label")
  await expect(label.getByRole("textbox")).toHaveCount(0)
  await label.scrollIntoViewIfNeeded()
  const email = label.getByRole("textbox")
  await email.fill("preview@example.com")
  await page.getByRole("heading", { level: 1 }).scrollIntoViewIfNeeded()
  await label.scrollIntoViewIfNeeded()
  await expect(email).toHaveValue("preview@example.com")
})

test("previews load when IntersectionObserver is unavailable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Reflect.deleteProperty(window, "IntersectionObserver")
  })
  await openHomepage(page)
  await expect(showcase(page, "label").getByRole("textbox")).toHaveCount(1)
})

for (const theme of ["light", "dark"] as const) {
  test.describe(`${theme} homepage`, () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" })
      await page.addInitScript(
        (value) => localStorage.setItem("yopem-ui-theme", value),
        theme,
      )
    })

    test("@a11y gallery exposes live examples and component links without overflow", async ({
      page,
      request,
    }, testInfo) => {
      test.setTimeout(90_000)
      const errors: string[] = []
      page.on("pageerror", (error) => errors.push(error.message))
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text())
      })
      await openHomepage(page)
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme)

      const response = await request.get("/components.md")
      expect(response.status()).toBe(200)

      const showcaseSlugs = Array.from(
        (await response.text()).matchAll(/\]\(\/components\/([\w-]+)\.md\)/g),
        (match) => match[1],
      ).filter((slug) => !slug.startsWith("use-"))

      expect(showcaseSlugs.length).toBeGreaterThan(0)
      await expect(
        page.locator("section[aria-labelledby^='showcase-']"),
      ).toHaveCount(showcaseSlugs.length)

      for (const group of ["Components", "Layout", "Typography"]) {
        await expect(
          page.getByRole("heading", { name: group, level: 2, exact: true }),
        ).toBeVisible()
      }

      for (const slug of showcaseSlugs) {
        const card = showcase(page, slug)
        await card.scrollIntoViewIfNeeded()
        await expect(
          card.getByRole("status", { name: /^Loading .* preview$/ }),
        ).toHaveCount(0)
        await expect(card.locator("h1, h2")).toHaveCount(0)
        await expect(
          card.getByRole("heading", { level: 3 }).first(),
        ).toBeVisible()
        await expect(
          card.getByTestId("homepage-preview").locator(":scope > *").first(),
        ).toBeVisible()
        await expect(
          card.getByRole("link", { name: /source and API$/ }),
        ).toHaveAttribute("href", `/components/${slug}`)
      }

      for (const slug of ["button", "badge", "avatar"]) {
        const preview = showcase(page, slug).getByLabel(/live preview$/)
        const component = preview.locator(`[data-slot="${slug}"]`).first()
        const canvasBox = await preview.boundingBox()
        const componentBox = await component.boundingBox()

        expect(canvasBox).not.toBeNull()
        expect(componentBox).not.toBeNull()
        expect(componentBox!.width).toBeLessThan(canvasBox!.width * 0.75)
      }

      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth - innerWidth,
          ),
        )
        .toBeLessThanOrEqual(1)
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
      expect(errors).toEqual([])
      await testInfo.attach(`homepage-gallery-${theme}`, {
        body: await page.screenshot({ fullPage: true, animations: "disabled" }),
        contentType: "image/png",
      })

      await showcase(page, "tabs")
        .getByRole("link", { name: /source and API$/ })
        .click()
      await expect(page).toHaveURL(/\/components\/tabs$/)
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    })

    test("selection examples keep independent state and support keyboard input", async ({
      page,
    }) => {
      await openHomepage(page)
      const reservation = showcase(page, "card")
      await reservation
        .getByRole("textbox", { name: "Name", exact: true })
        .fill("Wetland survey")
      await expect(
        reservation.getByRole("textbox", { name: "Name", exact: true }),
      ).toHaveValue("Wetland survey")
      await reservation.getByRole("combobox").click()
      await page
        .getByRole("option", { name: "Audio recording", exact: true })
        .click()
      await expect(reservation.getByRole("combobox")).toContainText(
        "Audio recording",
      )

      const tabs = showcase(page, "tabs")
      await tabs.scrollIntoViewIfNeeded()
      await tabs
        .getByRole("tab", { name: "Meeting point", exact: true })
        .focus()
      await page.keyboard.press("ArrowRight")
      await expect(
        tabs.getByRole("tab", { name: "Equipment", exact: true }),
      ).toBeFocused()
      await page.keyboard.press("Enter")
      await expect(
        tabs.getByRole("tab", { name: "Equipment", exact: true }),
      ).toHaveAttribute("aria-selected", "true")
      await expect(tabs.getByRole("tabpanel")).toBeVisible()

      await reservation
        .getByRole("button", { name: "Reserve kit", exact: true })
        .click()
      await expect(reservation.getByRole("status")).toBeVisible()
      await expect(
        tabs.getByRole("tab", { name: "Equipment", exact: true }),
      ).toHaveAttribute("aria-selected", "true")

      const radios = showcase(page, "radio-group")
      await radios.scrollIntoViewIfNeeded()
      await radios.getByRole("radio", { name: /Birdwatching/ }).focus()
      await page.keyboard.press("ArrowDown")
      await expect(
        radios.getByRole("radio", { name: /Audio recording/ }),
      ).toBeChecked()
      const checkboxes = showcase(page, "checkbox-group")
      await checkboxes.scrollIntoViewIfNeeded()

      const audio = checkboxes.getByRole("checkbox", {
        name: "Audio recording",
        exact: true,
      })

      await audio.focus()
      await page.keyboard.press("Space")
      await expect(audio).toBeChecked()
      await expect(
        checkboxes.getByRole("checkbox", { name: "Birdwatching", exact: true }),
      ).toBeChecked()
      await expect(reservation.getByRole("combobox")).toContainText(
        "Audio recording",
      )

      await showcase(page, "combobox").scrollIntoViewIfNeeded()
      const equipment = showcase(page, "combobox").getByRole("combobox")
      await equipment.fill("no-such-equipment")
      await expect(page.getByRole("option")).toHaveCount(0)
      await equipment.fill("Audio")
      await page
        .getByRole("option", { name: "Audio recorder", exact: true })
        .click()
      await expect(equipment).toHaveValue("Audio recorder")

      const marquee = showcase(page, "marquee")
      await marquee.scrollIntoViewIfNeeded()
      await marquee.getByRole("link", { name: "Layout guide" }).focus()
      await page.keyboard.press("Tab")
      await expect(
        marquee.getByRole("link", { name: "Component catalog" }),
      ).toBeFocused()
    })

    test("input examples accept values and preserve disabled controls", async ({
      page,
    }) => {
      await openHomepage(page)

      await showcase(page, "number-field").scrollIntoViewIfNeeded()

      const quantity = showcase(page, "number-field").getByRole("textbox", {
        name: "Quantity",
      })

      await quantity.focus()
      await quantity.press("ArrowUp")
      await expect(quantity).toHaveValue("1")

      const code = showcase(page, "otp-field")
      await code.scrollIntoViewIfNeeded()

      const first = code.getByRole("textbox", {
        name: "One-time password",
        exact: true,
      })

      await first.fill("4")
      await expect(
        code.getByRole("textbox", { name: "Character 2 of 6" }),
      ).toBeFocused()
      await page.keyboard.type("82716")
      await expect(first).toHaveValue("4")

      for (const [index, value] of ["8", "2", "7", "1", "6"].entries()) {
        await expect(
          code.getByRole("textbox", { name: `Character ${index + 2} of 6` }),
        ).toHaveValue(value)
      }

      await showcase(page, "slider").scrollIntoViewIfNeeded()

      const volume = showcase(page, "slider").getByRole("slider", {
        name: "Volume",
      })

      await volume.focus()
      await volume.press("ArrowRight")
      await expect(volume).toHaveAttribute("aria-valuenow", "51")
      const ratings = showcase(page, "rating")
      await ratings.scrollIntoViewIfNeeded()
      await ratings
        .getByRole("radiogroup", { name: "Rate this component" })
        .getByRole("radio", { name: "4 stars" })
        .click()
      await expect(
        ratings
          .getByRole("radiogroup", { name: "Rate this component" })
          .getByRole("radio", { name: "4 stars" }),
      ).toBeChecked()

      for (const radio of await ratings
        .getByRole("radiogroup", { name: "Disabled rating" })
        .getByRole("radio")
        .all()) {
        await expect(radio).toBeDisabled()
      }

      await showcase(page, "input-group").scrollIntoViewIfNeeded()

      const search = showcase(page, "input-group").getByRole("searchbox", {
        name: "Search",
        exact: true,
      })

      await search.fill("Button")
      await expect(search).toHaveValue("Button")
    })

    test("@a11y overlays open from keyboard and restore trigger focus", async ({
      page,
    }, testInfo) => {
      await openHomepage(page)

      await showcase(page, "dialog").scrollIntoViewIfNeeded()

      const dialogTrigger = showcase(page, "dialog").getByRole("button", {
        name: "Open Dialog",
        exact: true,
      })

      await dialogTrigger.focus()
      await dialogTrigger.press("Enter")

      const dialog = page.getByRole("dialog", {
        name: "Edit reservation",
        exact: true,
      })

      await expect(dialog).toBeVisible()
      await expect(dialog.locator(":focus")).toBeVisible()
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
      await page.keyboard.press("Escape")
      await expect(dialog).toBeHidden()
      await expect(dialogTrigger).toBeFocused()

      await showcase(page, "popover").scrollIntoViewIfNeeded()

      const popoverTrigger = showcase(page, "popover").getByRole("button", {
        name: "Open Popover",
        exact: true,
      })

      await popoverTrigger.focus()
      await popoverTrigger.press("Enter")

      const feedback = page.getByRole("textbox", {
        name: "Send feedback",
        exact: true,
      })

      await expect(feedback).toBeVisible()
      await feedback.fill("Example feedback")
      await expect(feedback).toHaveValue("Example feedback")
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
      await testInfo.attach(`homepage-popover-${theme}`, {
        body: await page.screenshot({ animations: "disabled" }),
        contentType: "image/png",
      })
      await page.keyboard.press("Escape")
      await expect(feedback).toBeHidden()
      await expect(popoverTrigger).toBeFocused()
    })
  })
}
