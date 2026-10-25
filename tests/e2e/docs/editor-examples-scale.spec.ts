import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

async function openScaleExample(page: Page) {
  await page.goto("/editor/examples#public-scale")
  await expect(
    page.getByRole("button", { name: "Search documentation", exact: true }),
  ).toBeEnabled()
  const example = page.getByTestId("editor-example-public-scale")
  await example
    .getByRole("button", { name: "Live preview", exact: true })
    .click()

  return example
}

test("huge-document: stays inert until opened, edits, and unmounts locally", async ({
  page,
}, testInfo) => {
  test.skip(
    process.env.RUN_EDITOR_SCALE !== "1",
    "Set RUN_EDITOR_SCALE=1 to admit memory-intensive fixtures",
  )
  test.slow()
  const example = await openScaleExample(page)
  await expect(example.locator('[data-slot="editor-content"]')).toHaveCount(0)
  await expect(example.getByRole("note").first()).toBeVisible()

  const count = example.getByRole("combobox", {
    name: "Document block count",
    exact: true,
  })

  await count.selectOption("500")
  await example
    .getByRole("button", { name: "Open long-document fixture", exact: true })
    .click()

  const editor = example.getByRole("textbox", {
    name: "Long document fixture",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await expect(editor.locator(":scope > p")).toHaveCount(500)
  const lastBlock = editor.locator(":scope > p").last()
  await editor.press("ControlOrMeta+End")
  await editor.pressSequentially(" edited")
  await expect(lastBlock).toContainText("edited")

  const toolbar = example.getByRole("toolbar", {
    name: "Long document history",
    exact: true,
  })

  await toolbar.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(lastBlock).not.toContainText("edited")
  await toolbar.getByRole("button", { name: "Redo", exact: true }).click()
  await expect(lastBlock).toContainText("edited")

  const report = await new AxeBuilder({ page })
    .include('[data-testid="editor-example-public-scale"]')
    .analyze()

  expect(report.violations).toEqual([])
  await testInfo.attach("long-document-axe.json", {
    body: JSON.stringify(report, null, 2),
    contentType: "application/json",
  })

  await example
    .getByRole("button", {
      name: "Reset and unmount long document",
      exact: true,
    })
    .click()
  await expect(example.locator('[data-slot="editor-content"]')).toHaveCount(0)
})

test("hundreds-editors: mounts separate roots on request and isolates edits", async ({
  page,
}, testInfo) => {
  test.skip(
    process.env.RUN_EDITOR_SCALE !== "1",
    "Set RUN_EDITOR_SCALE=1 to admit memory-intensive fixtures",
  )
  test.slow()
  const example = await openScaleExample(page)
  await expect(example.locator('[data-slot="editor-content"]')).toHaveCount(0)
  await expect(example.getByRole("note").first()).toBeVisible()

  await example
    .getByRole("combobox", {
      name: "Independent editor count",
      exact: true,
    })
    .selectOption("200")
  await example
    .getByRole("button", {
      name: "Open independent-editor fixture",
      exact: true,
    })
    .click()

  const editors = example.getByRole("textbox")
  await expect(editors).toHaveCount(200)

  const first = example.getByRole("textbox", {
    name: "Independent editor 1",
    exact: true,
  })

  const second = example.getByRole("textbox", {
    name: "Independent editor 2",
    exact: true,
  })

  const last = example.getByRole("textbox", {
    name: "Independent editor 200",
    exact: true,
  })

  await expect(first).toHaveText("Independent root 1")
  await expect(second).toHaveText("Independent root 2")
  await last.scrollIntoViewIfNeeded()
  await last.fill("Only the last root changed")
  await expect(first).toHaveText("Independent root 1")
  await expect(second).toHaveText("Independent root 2")
  await first.fill("Only the first root changed")
  await expect(last).toHaveText("Only the last root changed")

  const report = await new AxeBuilder({ page })
    .include('[data-testid="editor-example-public-scale"]')
    .analyze()

  expect(report.violations).toEqual([])
  await testInfo.attach("independent-editors-axe.json", {
    body: JSON.stringify(report, null, 2),
    contentType: "application/json",
  })

  await example
    .getByRole("button", {
      name: "Unmount independent editors",
      exact: true,
    })
    .click()
  await expect(example.locator('[data-slot="editor-content"]')).toHaveCount(0)
})

test("scale controls mount no editor before explicit fixture admission", async ({
  page,
}) => {
  const example = await openScaleExample(page)
  await expect(example.locator('[data-slot="editor-content"]')).toHaveCount(0)
  await expect(
    example.getByRole("button", {
      name: "Open long-document fixture",
      exact: true,
    }),
  ).toBeVisible()
  await expect(
    example.getByRole("button", {
      name: "Open independent-editor fixture",
      exact: true,
    }),
  ).toBeVisible()
})

test("admitting another scale fixture unmounts the previous one", async ({
  page,
}) => {
  test.skip(
    process.env.RUN_EDITOR_SCALE !== "1",
    "Set RUN_EDITOR_SCALE=1 to admit memory-intensive fixtures",
  )
  test.slow()
  const example = await openScaleExample(page)
  await example
    .getByRole("button", { name: "Open long-document fixture", exact: true })
    .click()
  await expect(
    example.getByRole("textbox", {
      name: "Long document fixture",
      exact: true,
    }),
  ).toHaveAttribute("contenteditable", "true")
  await example
    .getByRole("button", {
      name: "Open independent-editor fixture",
      exact: true,
    })
    .click()
  await expect(
    example.getByRole("textbox", {
      name: "Long document fixture",
      exact: true,
    }),
  ).toHaveCount(0)
  await expect(example.getByRole("textbox")).toHaveCount(100)
  await example
    .getByRole("button", { name: "Open long-document fixture", exact: true })
    .click()
  await expect(example.getByRole("textbox")).toHaveCount(1)
  await expect(
    example.getByRole("textbox", { name: "Independent editor 1", exact: true }),
  ).toHaveCount(0)
})
