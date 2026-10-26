import { expect, test } from "@playwright/test"

test("gallery controls wait for hydration before mounting a live editor", async ({
  page,
}) => {
  test.slow()
  const scripts = Promise.withResolvers<void>()
  await page.route("**/assets/*.js", async (route) => {
    await scripts.promise
    await route.continue()
  })

  try {
    await page.goto("/editor/examples#public-word-clipboard", {
      waitUntil: "commit",
    })

    const example = page.getByTestId("editor-example-public-word-clipboard")

    const trigger = example.getByRole("button", {
      name: "Live preview",
      exact: true,
    })

    await expect(trigger).toBeVisible()
    await expect(trigger).toBeDisabled()
    await expect(
      example.getByRole("button", { name: "View source", exact: true }),
    ).toBeDisabled()
    await expect(
      example.getByRole("button", { name: "Copy source", exact: true }),
    ).toBeDisabled()
    scripts.resolve()
    await expect(trigger).toBeEnabled()
    await trigger.click()
    await expect(
      page.getByTestId("public-word-clipboard").getByRole("textbox", {
        name: "Word clipboard editor",
        exact: true,
      }),
    ).toHaveAttribute("contenteditable", "true")
  } finally {
    scripts.resolve()
    await page.unrouteAll({ behavior: "wait" })
  }
})
