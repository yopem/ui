import { expect, test } from "@playwright/test"
import { registryItemSchema } from "@registry/schema"

const previewSelector = '[aria-label$="live preview"]'

test("chooses a theme with keyboard and pointer and restores the saved preference", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ colorScheme: "dark" })
  await page.goto("/components/theme-switcher")
  const preview = page.locator(previewSelector)
  const choices = preview.getByRole("group", { name: "Color theme" })
  const light = choices.getByRole("button", { name: "Light" })
  const dark = choices.getByRole("button", { name: "Dark" })
  const system = choices.getByRole("button", { name: "System" })
  const root = page.locator("html")
  const previewToggle = preview.getByRole("button", { name: /^Switch to/ })

  await expect(root).toHaveAttribute("data-theme", "dark")
  await expect(system).toBeEnabled()
  await expect(system).toHaveAttribute("aria-pressed", "true")
  await expect(dark).toHaveAttribute("aria-pressed", "false")
  await light.focus()
  await light.press("ArrowRight")
  await expect(dark).toBeFocused()
  await expect(system).toHaveAttribute("aria-pressed", "true")
  await dark.press("Space")
  await expect(dark).toHaveAttribute("aria-pressed", "true")
  await dark.click()
  await expect(dark).toHaveAttribute("aria-pressed", "true")

  await previewToggle.click()
  await expect(light).toHaveAttribute("aria-pressed", "true")
  await expect(root).toHaveAttribute("data-theme", "light")
  await page.reload()
  await expect(light).toHaveAttribute("aria-pressed", "true")
  await expect(root).toHaveAttribute("data-theme", "light")

  await system.click()
  await expect(system).toHaveAttribute("aria-pressed", "true")
  await expect(root).toHaveAttribute("data-theme", "dark")
  await page.emulateMedia({ colorScheme: "light" })
  await expect(root).toHaveAttribute("data-theme", "light")
  await expect(system).toHaveAttribute("aria-pressed", "true")
  await preview.screenshot({ path: testInfo.outputPath("theme-switcher.png") })
})

test("theme controls stay disabled without hydration", async ({ page }) => {
  await page.route("**/*", (route) =>
    route.request().resourceType() === "script"
      ? route.abort()
      : route.continue(),
  )
  await page.goto("/components/theme-switcher")
  const preview = page.locator(previewSelector)
  await expect(
    preview.getByRole("button", { name: /^Switch to/ }),
  ).toBeDisabled()
  const choices = preview.getByRole("group", { name: "Color theme" })

  for (const name of ["Light", "Dark", "System"])
    await expect(choices.getByRole("button", { name })).toBeDisabled()
})

test("homepage links to the theme switcher and loads its preview", async ({
  page,
}) => {
  await page.goto("/")
  const card = page.getByRole("region", { name: "Theme Switcher", exact: true })
  await card.scrollIntoViewIfNeeded()
  await expect(card.getByRole("group", { name: "Color theme" })).toBeVisible()
  await expect(card.getByRole("link")).toHaveAttribute(
    "href",
    "/components/theme-switcher",
  )
})

test("published registry and documentation expose the theme switcher", async ({
  request,
}) => {
  const response = await request.get("/r/theme-switcher.json")
  expect(response.ok()).toBe(true)

  const item = registryItemSchema.parse(await response.json())
  expect(item).toMatchObject({ name: "theme-switcher", type: "registry:ui" })
  expect(item.registryDependencies).toEqual(
    expect.arrayContaining([
      "button",
      "toggle-group",
      "theme",
      "use-event-callback",
    ]),
  )

  const source = item.files.find(
    (file) => file.target === "@/components/ui/theme-switcher.tsx",
  )

  expect(source?.content).toContain('"@/theme/theme-provider"')
  expect(source?.content).not.toContain("@registry/")

  const docs = await request.get("/components/theme-switcher.md")
  expect(docs.ok()).toBe(true)
  expect(await docs.text()).toContain("@/components/ui/theme-switcher")

  for (const path of ["/sitemap.xml", "/llms.txt"]) {
    const index = await request.get(path)
    expect(index.ok()).toBe(true)
    expect(await index.text()).toContain("/components/theme-switcher")
  }
})
