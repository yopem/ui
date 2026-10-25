import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test.describe("Integrated playground workflows", () => {
  test.beforeEach(async ({ page }) => {
    test.slow()
    await page.goto("/editor/examples#public-playground")
    const example = page.getByTestId("editor-example-public-playground")
    await example
      .getByRole("button", { name: "Live preview", exact: true })
      .click()
    await expect(
      example.getByRole("textbox", {
        name: "Integrated playground editor",
        exact: true,
      }),
    ).toHaveAttribute("contenteditable", "true")
  })

  test("normal workspace: edits seeded content, inserts a table, and searches", async ({
    page,
  }) => {
    const workspace = page.getByTestId("public-playground-workspace")

    const editor = workspace.getByRole("textbox", {
      name: "Integrated playground editor",
      exact: true,
    })

    await expect(editor).toHaveAttribute("contenteditable", "true")
    await expect(editor.locator("h1")).toHaveCount(1)
    await expect(editor.locator("table")).toHaveCount(0)
    await workspace
      .getByRole("button", { name: "Insert table", exact: true })
      .click()
    await expect(editor.getByRole("table")).toBeVisible()
    await editor.press("ControlOrMeta+z")
    await expect(editor.getByRole("table")).toHaveCount(0)

    const search = workspace.getByRole("searchbox", {
      name: "Search document",
      exact: true,
    })

    await search.fill("review")
    await workspace
      .getByRole("button", { name: "Next match", exact: true })
      .click()
    await expect(editor).toBeFocused()
    await expect
      .poll(() =>
        page.evaluate(() =>
          window.getSelection()?.toString().toLocaleLowerCase(),
        ),
      )
      .toContain("review")
  })

  test("locale and variant remount: updates labels and restores the normal seed", async ({
    page,
  }) => {
    const workspace = page.getByTestId("public-playground-workspace")

    const editor = workspace.getByRole("textbox", {
      name: "Integrated playground editor",
      exact: true,
    })

    await editor.fill("Unsaved draft")
    await workspace
      .getByRole("button", { name: "简体中文", exact: true })
      .click()

    const localizedEditor = workspace.getByRole("textbox", {
      name: "集成编辑器",
      exact: true,
    })

    await expect(localizedEditor).toHaveText("Unsaved draft")
    await workspace
      .getByRole("button", { name: "Copilot", exact: true })
      .click()
    await expect(localizedEditor).toHaveCount(0)
    await workspace
      .getByRole("button", { name: "English", exact: true })
      .click()
    await workspace.getByRole("button", { name: "Normal", exact: true }).click()

    const normalEditor = workspace.getByRole("textbox", {
      name: "Integrated playground editor",
      exact: true,
    })

    await expect(normalEditor.locator("h1")).toHaveCount(1)
    await expect(normalEditor).not.toContainText("Unsaved draft")
  })

  test("review workspace: local policy enables comment creation", async ({
    page,
  }) => {
    const workspace = page.getByTestId("public-playground-workspace")

    const editor = workspace.getByRole("textbox", {
      name: "Integrated playground editor",
      exact: true,
    })

    const review = workspace.getByRole("complementary", {
      name: "Document review",
    })

    await expect(editor.locator("mark")).toContainText("Review anchor")
    await editor.press("ControlOrMeta+a")
    await workspace
      .getByRole("button", { name: "Comment on selection", exact: true })
      .click()
    await workspace
      .getByRole("textbox", { name: "New comment", exact: true })
      .fill("Check this seeded passage.")
    await workspace
      .getByRole("button", { name: "Add comment", exact: true })
      .click()
    await expect(review.getByRole("article")).toHaveCount(2)
  })

  test("Copilot setup: rejects cross-origin input and sends no automatic request", async ({
    page,
  }) => {
    const requests: string[] = []
    page.on("request", (request) => {
      if (
        request.url().includes("invalid.example") ||
        request.url().includes("/api/editor-ai")
      ) {
        requests.push(request.url())
      }
    })
    const workspace = page.getByTestId("public-playground-workspace")
    await workspace
      .getByRole("button", { name: "Copilot", exact: true })
      .click()
    await expect(
      workspace.getByText("No endpoint is configured.", { exact: true }),
    ).toBeVisible()
    await workspace
      .getByRole("textbox", { name: "Host endpoint", exact: true })
      .fill("https://invalid.example/api/ai")
    await workspace
      .getByRole("textbox", { name: "Host document ID", exact: true })
      .fill("fixture-document")
    await workspace
      .getByRole("textbox", { name: "Host CSRF token", exact: true })
      .fill("fixture-csrf")
    await workspace
      .getByRole("button", { name: "Configure Copilot", exact: true })
      .click()
    await expect(workspace.getByRole("alert")).toBeVisible()
    await expect(
      workspace.getByRole("textbox", {
        name: "Integrated playground editor",
        exact: true,
      }),
    ).toHaveCount(0)
    await expect.poll(() => requests.length).toBe(0)

    const sameOriginEndpoint = `${new URL(page.url()).origin}/api/editor-ai`
    await workspace
      .getByRole("textbox", { name: "Host endpoint", exact: true })
      .fill(sameOriginEndpoint)
    await workspace
      .getByRole("button", { name: "Configure Copilot", exact: true })
      .click()
    await expect(
      workspace.getByRole("textbox", {
        name: "Integrated playground editor",
        exact: true,
      }),
    ).toHaveAttribute("contenteditable", "true")
    await expect.poll(() => requests.length).toBe(0)
  })

  test("responsive states: editor stays contained and accessible", async ({
    page,
  }, testInfo) => {
    const workspace = page.getByTestId("public-playground-workspace")

    for (const width of [1440, 768, 390]) {
      await page.setViewportSize({ width, height: 900 })
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBeLessThanOrEqual(width + 1)

      const report = await new AxeBuilder({ page })
        .include('[data-testid="public-playground-workspace"]')
        .analyze()

      expect(report.violations).toEqual([])
      await testInfo.attach(`public-playground-${width}.png`, {
        body: await workspace.screenshot({ scale: "css" }),
        contentType: "image/png",
      })
    }
  })
})
