import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test("header GitHub link supports keyboard navigation", async ({
  page,
}, testInfo) => {
  await page.goto("/components/button")
  const link = page.getByRole("banner").getByRole("link", { name: "GitHub" })

  await expect(link).toBeVisible()
  await expect(link).toHaveAttribute("href", "https://github.com/yopem/ui")
  await link.focus()
  await expect(link).toBeFocused()
  await expect(link).toHaveAttribute("target", "_blank")
  await expect(link).toHaveAttribute("rel", "noopener noreferrer")
  await page.screenshot({ path: testInfo.outputPath("github-navigation.png") })
})

const groups = ["Setup", "Components", "Layout", "Typography", "Hooks"]

test("@a11y grouped navigation preserves inventory, keyboard collapse, and mobile dismissal", async ({
  page,
  request,
}, testInfo) => {
  const response = await request.get("/components.md")
  expect(response.status()).toBe(200)

  const componentHrefs =
    (await response.text()).match(/(?<=\]\()\/components\/[\w-]+(?=\.md\))/g) ??
    []

  expect(componentHrefs.length).toBeGreaterThan(0)

  await page.goto("/components/button")
  const mobile = (page.viewportSize()?.width ?? 0) < 768
  const trigger = page.getByRole("button", { name: "Open navigation" })

  if (mobile) await trigger.click()

  const nav = mobile
    ? page
        .getByRole("dialog", { name: "Documentation" })
        .getByRole("navigation", { name: "Documentation", exact: true })
    : page
        .getByRole("complementary")
        .first()
        .getByRole("navigation", { name: "Documentation", exact: true })

  for (const group of groups) {
    await expect(
      nav.getByRole("button", { name: group, exact: true }),
    ).toHaveAttribute(
      "aria-expanded",
      group === "Components" ? "true" : "false",
    )
  }

  for (const group of groups) {
    const button = nav.getByRole("button", { name: group, exact: true })

    if ((await button.getAttribute("aria-expanded")) === "false")
      await button.click()
  }

  const layout = nav
    .locator('[data-slot="collapsible"]')
    .filter({ has: page.getByRole("button", { name: "Layout", exact: true }) })

  await expect(
    layout.getByRole("link", { name: "Absolute Center", exact: true }),
  ).toBeVisible()
  await expect(
    layout.getByRole("link", { name: "Button", exact: true }),
  ).toHaveCount(0)

  const hooks = nav
    .locator('[data-slot="collapsible"]')
    .filter({ has: page.getByRole("button", { name: "Hooks", exact: true }) })

  for (const href of [
    "/components/use-event-callback",
    "/components/use-media-query",
  ])
    await expect(hooks.locator(`a[href="${href}"]`)).toHaveCount(1)

  const hrefs = await nav
    .getByRole("link")
    .evaluateAll((links) => links.map((link) => link.getAttribute("href")))

  expect(hrefs.filter((href) => href?.startsWith("/components/"))).toHaveLength(
    componentHrefs.length,
  )

  for (const href of componentHrefs) expect(hrefs).toContain(href)

  for (const href of [
    "/",
    "/components",
    "/docs/getting-started",
    "/docs/installation",
    "/docs/cli",
    "/docs/theming",
    "/docs/layout",
    "/docs/styling",
    "/docs/lint",
    "/llms.txt",
  ])
    expect(hrefs).toContain(href)
  await expect(
    nav.getByRole("link", { name: "Button", exact: true }),
  ).toHaveAttribute("aria-current", "page")
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])

  const components = nav.getByRole("button", {
    name: "Components",
    exact: true,
  })

  await components.focus()
  await components.press("Enter")
  await expect(components).toHaveAttribute("aria-expanded", "false")
  await expect(
    nav.getByRole("link", { name: "Button", exact: true }),
  ).toBeHidden()
  await expect(components).toBeFocused()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await components.press("Space")
  await expect(components).toHaveAttribute("aria-expanded", "true")
  await nav.getByRole("link", { name: "Absolute Center", exact: true }).click()
  await expect(page).toHaveURL(/\/components\/absolute-center$/)

  if (mobile) {
    await expect(
      page.getByRole("dialog", { name: "Documentation" }),
    ).toBeHidden()
    await expect(trigger).toBeFocused()
    await trigger.click()
    await expect(
      nav.getByRole("button", { name: "Layout", exact: true }),
    ).toHaveAttribute("aria-expanded", "true")
    await page.keyboard.press("Escape")
    await expect(trigger).toBeFocused()
  }

  await testInfo.attach("grouped-navigation", {
    body: await page.screenshot({ animations: "disabled" }),
    contentType: "image/png",
  })
})

for (const [path, previous, next] of [
  ["/docs/lint", "/docs/styling", "/components"],
  ["/components", "/docs/lint", "/components/accordion"],
  ["/components/tooltip", "/components/toolbar", "/components/absolute-center"],
  ["/components/wrap", "/components/vstack", "/components/blockquote"],
  ["/components/text", "/components/prose", "/components/use-event-callback"],
  ["/components/use-media-query", "/components/use-event-callback", null],
] as const) {
  test(`global page sequence at ${path}`, async ({ page }) => {
    await page.goto(path)

    const nav = page.getByRole("navigation", {
      name: "Documentation pages",
      exact: true,
    })

    for (const [direction, href] of [
      ["Previous", previous],
      ["Next", next],
    ] as const) {
      const link = nav.getByRole("link", { name: new RegExp(`^${direction}:`) })

      if (href) await expect(link).toHaveAttribute("href", href)
      else await expect(link).toHaveCount(0)
    }

    if (next) {
      await nav.getByRole("link", { name: /^Next:/ }).click()
      await expect(page).toHaveURL(new RegExp(`${next}$`))

      const mobile = (page.viewportSize()?.width ?? 0) < 768

      if (mobile)
        await page.getByRole("button", { name: "Open navigation" }).click()

      const sidebar = mobile
        ? page
            .getByRole("dialog", { name: "Documentation" })
            .getByRole("navigation", { name: "Documentation", exact: true })
        : page.getByRole("navigation", {
            name: "Documentation",
            exact: true,
          })

      await expect(sidebar.locator('[aria-current="page"]')).toHaveAttribute(
        "href",
        next,
      )
      await expect(
        sidebar.locator(
          '[data-slot="collapsible-trigger"][aria-expanded="true"]',
        ),
      ).toHaveCount(1)

      if (mobile) await page.keyboard.press("Escape")

      await page
        .getByRole("navigation", { name: "Documentation pages" })
        .getByRole("link", { name: /^Previous:/ })
        .click()
      await expect(page).toHaveURL(new RegExp(`${path}$`))
    }
  })
}

test("desktop sidebar keyboard navigation keeps focused link", async ({
  page,
}) => {
  test.skip((page.viewportSize()?.width ?? 0) < 768, "Desktop sidebar only")
  await page.goto("/components/button")

  const nav = page.getByRole("navigation", {
    name: "Documentation",
    exact: true,
  })

  const link = nav.getByRole("link", { name: "Calendar", exact: true })
  await link.focus()
  await link.press("Enter")
  await expect(page).toHaveURL(/\/components\/calendar$/)
  await expect(link).toBeFocused()
  await expect(link).toHaveAttribute("aria-current", "page")
  await page.keyboard.press("Tab")
  await expect(
    nav.getByRole("link", { name: "Card", exact: true }),
  ).toBeFocused()
})
