import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

const workspaceUrl = "/editor/examples/notion-like"

test("standalone workspace has usable public links and resources", async ({
  page,
  request,
}) => {
  const response = await request.get(workspaceUrl)
  expect(response.ok()).toBe(true)
  expect(response.headers()["content-type"]).toContain("text/html")

  const sitemap = await request.get("/sitemap.xml")
  expect(sitemap.ok()).toBe(true)
  expect(await sitemap.text()).toContain(`https://ui.yopem.com${workspaceUrl}`)

  const llms = await request.get("/llms.txt")
  expect(llms.ok()).toBe(true)
  expect(await llms.text()).toContain(workspaceUrl)

  const markdown = await request.get("/editor/examples.md")
  expect(markdown.ok()).toBe(true)
  expect(await markdown.text()).toContain(workspaceUrl)

  await page.goto("/editor/examples#notion-like")
  const section = page.getByTestId("editor-example-notion-like")
  await section
    .getByRole("link", { name: "Open workspace", exact: true })
    .click()
  await expect(page).toHaveURL(new RegExp(`${workspaceUrl}$`))
  await expect(page.getByTestId("notion-like-workspace")).toBeVisible()
})

for (const width of [390, 768, 1440]) {
  test(`standalone workspace has usable native controls and viewport at ${width}px @a11y`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(workspaceUrl)

    const main = page.getByRole("main", {
      name: "Notion-like workspace",
      exact: true,
    })

    await expect(main).toBeVisible()
    await expect(page.getByRole("main")).toHaveCount(1)
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Notion-like workspace",
        exact: true,
      }),
    ).toHaveCount(1)
    await expect(
      page.getByRole("navigation", { name: "Documentation", exact: true }),
    ).toHaveCount(0)

    const workspace = main.getByTestId("notion-like-workspace")

    const editor = workspace.getByRole("textbox", {
      name: "Workspace document",
      exact: true,
    })

    await expect(editor).toHaveAttribute("contenteditable", "true")
    expect(
      await workspace.evaluate((element) => ({
        horizontal: element.scrollWidth > element.clientWidth,
        vertical: element.scrollHeight > element.clientHeight,
      })),
    ).toEqual({ horizontal: false, vertical: false })

    for (const name of [
      "More page options",
      "Draft storage and workspace limits",
    ]) {
      const command = workspace.getByRole("button", { name, exact: true })
      await expect(command).toBeInViewport()
      const target = await command.boundingBox()

      if (!target) throw new Error(`Missing ${name} target geometry`)

      if (testInfo.project.use.hasTouch) {
        expect(target.width).toBeGreaterThanOrEqual(44)
        expect(target.height).toBeGreaterThanOrEqual(44)
      }
    }

    const beforeBackFocus = await workspace.boundingBox()
    await page.keyboard.press("Tab")
    await expect(
      page.getByRole("link", { name: "Back to editor examples", exact: true }),
    ).toBeFocused()
    const afterBackFocus = await workspace.boundingBox()

    if (!beforeBackFocus || !afterBackFocus)
      throw new Error("Missing workspace keyboard-focus geometry")
    expect(afterBackFocus.y).toBe(beforeBackFocus.y)

    const title = workspace.getByRole("textbox", {
      name: "Page title",
      exact: true,
    })

    await expect(title).toHaveValue("AI")

    const titleControl = workspace
      .locator('[data-slot="input-control"]')
      .filter({
        has: page.getByRole("textbox", { name: "Page title", exact: true }),
      })

    const unfocused = await titleControl.evaluate((element) => {
      const styles = getComputedStyle(element)

      return { border: styles.borderColor, shadow: styles.boxShadow }
    })

    await title.focus()
    await expect(title).toBeFocused()
    await expect
      .poll(() =>
        titleControl.evaluate((element) => {
          const styles = getComputedStyle(element)

          return { border: styles.borderColor, shadow: styles.boxShadow }
        }),
      )
      .not.toEqual(unfocused)
    await testInfo.attach(`standalone-title-focus-${width}.png`, {
      body: await page.screenshot({ scale: "css" }),
      contentType: "image/png",
    })
    await editor.click()
    await editor.press("ControlOrMeta+End")
    await page.keyboard.type(" Standalone native edit")
    await expect(editor).toContainText("Standalone native edit")
    await workspace.getByRole("button", { name: "Undo", exact: true }).click()
    await expect(editor).not.toContainText("Standalone native edit")
    await workspace.getByRole("button", { name: "Redo", exact: true }).click()
    await expect(editor).toContainText("Standalone native edit")

    const box = await workspace.boundingBox()

    if (!box) throw new Error("Missing standalone workspace geometry")
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(width)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true)

    const report = await new AxeBuilder({ page }).analyze()
    await testInfo.attach("standalone-workspace-axe.json", {
      body: JSON.stringify(report),
      contentType: "application/json",
    })
    expect(report.violations).toEqual([])
    await page.evaluate(() => window.scrollTo(0, 0))
    await testInfo.attach(`standalone-workspace-${width}.png`, {
      body: await page.screenshot({ scale: "css" }),
      contentType: "image/png",
    })
    await page
      .getByRole("link", { name: "Back to editor examples", exact: true })
      .focus()
    await page.keyboard.press("Enter")
    await expect(page).toHaveURL(/\/editor\/examples#notion-like$/)
  })

  test(`standalone document scroll keeps workspace controls available at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(workspaceUrl)

    const workspace = page.getByTestId("notion-like-workspace")

    const editor = workspace.getByRole("textbox", {
      name: "Workspace document",
      exact: true,
    })

    await expect(editor).toHaveAttribute("contenteditable", "true")
    await editor.fill(
      Array.from({ length: 120 }, (_, index) => `Scroll line ${index}`).join(
        "\n",
      ),
    )
    await expect(editor).toContainText("Scroll line 119")

    const viewport = workspace.getByRole("group", {
      name: "Page document",
      exact: true,
    })

    const controls = workspace.getByRole("button", {
      name: "Block controls",
      exact: true,
    })

    await expect(viewport).toBeInViewport()
    await expect(controls).toBeInViewport()
    await viewport.focus()
    await viewport.press("Home")
    await expect
      .poll(() => viewport.evaluate((element) => element.scrollTop))
      .toBe(0)

    const before = await controls.boundingBox()
    const frame = await viewport.boundingBox()

    if (!before || !frame) throw new Error("Missing workspace scroll geometry")
    expect(frame.y).toBeGreaterThanOrEqual(0)
    expect(frame.y + frame.height).toBeLessThanOrEqual(900)
    await page.mouse.move(frame.x + frame.width / 2, frame.y + frame.height / 2)
    await page.mouse.wheel(0, 480)
    await expect
      .poll(() => viewport.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(0)

    const wheelOffset = await viewport.evaluate((element) => element.scrollTop)
    await viewport.focus()
    await viewport.press("PageDown")
    await expect
      .poll(() => viewport.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(wheelOffset)
    await expect(viewport).toBeFocused()
    await expect(controls).toBeInViewport()

    const after = await controls.boundingBox()

    if (!after)
      throw new Error("Workspace controls disappeared during scrolling")
    expect(Math.abs(after.y - before.y)).toBeLessThanOrEqual(1)
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
    await testInfo.attach(`workspace-document-scroll-${width}.png`, {
      body: await page.screenshot({ scale: "css" }),
      contentType: "image/png",
    })
  })
}

test("workspace scope disclosure keeps keyboard access and full-page accessibility @a11y", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 500 })
  await page.goto(workspaceUrl)
  const workspace = page.getByTestId("notion-like-workspace")
  await expect(
    workspace.getByRole("textbox", { name: "Workspace document", exact: true }),
  ).toHaveAttribute("contenteditable", "true")

  const trigger = workspace.getByRole("button", {
    name: "Draft storage and workspace limits",
    exact: true,
  })

  await trigger.focus()
  await trigger.press("Enter")

  const disclosure = page.getByRole("dialog", {
    name: "Workspace limits",
    exact: true,
  })

  await expect(disclosure).toBeVisible()
  await expect(disclosure).toBeInViewport()

  const close = disclosure.getByRole("button", {
    name: "Close workspace limits",
    exact: true,
  })

  await expect(close).toBeFocused()
  const viewport = disclosure.locator('[data-slot="popover-viewport"]')
  await expect
    .poll(() =>
      viewport.evaluate(
        (element) => element.scrollHeight > element.clientHeight,
      ),
    )
    .toBe(true)
  await close.press("PageDown")
  await expect
    .poll(() => viewport.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0)
  const report = await new AxeBuilder({ page }).analyze()
  await testInfo.attach("workspace-scope-whole-page-axe.json", {
    body: JSON.stringify(report),
    contentType: "application/json",
  })
  expect(report.violations).toEqual([])
  await testInfo.attach("workspace-scope-mobile.png", {
    body: await page.screenshot({ scale: "css" }),
    contentType: "image/png",
  })
  await page.keyboard.press("Escape")
  await expect(disclosure).toHaveCount(0)
  await expect(trigger).toBeFocused()
  await trigger.press("Enter")
  await expect(close).toBeFocused()
  await close.click()
  await expect(disclosure).toHaveCount(0)
  await expect(trigger).toBeFocused()
})

test("standalone block controls respect a trusted native host cancellation", async ({
  page,
}) => {
  await page.goto(workspaceUrl)
  const workspace = page.getByTestId("notion-like-workspace")
  await expect(
    workspace.getByRole("textbox", { name: "Workspace document", exact: true }),
  ).toHaveAttribute("contenteditable", "true")

  const toggle = workspace.getByRole("button", {
    name: "Block controls",
    exact: true,
  })

  await expect(toggle).toHaveAttribute("aria-pressed", "false")
  await toggle.evaluate((button) => {
    button.addEventListener(
      "click",
      (event) => {
        button.setAttribute("data-host-cancelled", String(event.isTrusted))
        event.preventDefault()
      },
      { capture: true, once: true },
    )
  })
  await toggle.click()
  await expect(toggle).toHaveAttribute("data-host-cancelled", "true")
  await expect(toggle).toHaveAttribute("aria-pressed", "false")
  await expect(
    workspace.getByRole("button", { name: "Select block 1", exact: true }),
  ).toHaveCount(0)
  await toggle.click()
  await expect(toggle).toHaveAttribute("aria-pressed", "true")
  await expect(
    workspace.getByRole("button", { name: "Select block 1", exact: true }),
  ).toBeVisible()
})
