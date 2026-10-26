import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page, type TestInfo } from "@playwright/test"

const parts = [
  ["review-structural-proposals", "EditorReviewStructuralProposals"],
  ["review-structural-proposal", "EditorReviewStructuralProposal"],
  ["review-structural-change-list", "EditorReviewStructuralChangeList"],
  [
    "review-structural-decision-controls",
    "EditorReviewStructuralDecisionControls",
  ],
] as const

async function openStructuralPart(page: Page, slug: string, name: string) {
  await page.goto(`/editor/${slug}`)

  const preview = page.getByRole("group", {
    name: `${name} live preview`,
    exact: true,
  })

  const editor = preview.getByRole("textbox", {
    name: "Structural review document",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")

  return { preview, editor }
}

async function scan(page: Page, info: TestInfo, state: string) {
  const report = await new AxeBuilder({ page }).analyze()
  await info.attach(`${state}-axe.json`, {
    body: JSON.stringify(report, null, 2),
    contentType: "application/json",
  })
  expect(report.violations).toEqual([])
}

for (const [slug, name] of parts) {
  test(`${name} creates and decides structural changes with anchors and native history`, async ({
    page,
  }, info) => {
    test.slow()
    const { preview, editor } = await openStructuralPart(page, slug, name)
    const before = await editor.innerText()
    await expect(editor.locator("mark")).toHaveText("Anchor remains unique.")

    await preview
      .getByRole("button", { name: "Propose structural changes", exact: true })
      .click()

    const accept = preview.getByRole("button", {
      name: "Accept structural proposal",
      exact: true,
    })

    const reject = preview.getByRole("button", {
      name: "Reject structural proposal",
      exact: true,
    })

    await expect(accept).toBeEnabled()
    await expect(reject).toBeEnabled()

    for (const action of [accept, reject]) {
      await action.evaluate((button) => {
        button.addEventListener("click", (event) => event.preventDefault(), {
          capture: true,
          once: true,
        })
      })
      await action.click()
      await expect(accept).toBeEnabled()
      await expect(reject).toBeEnabled()
      expect(await editor.innerText()).toBe(before)
    }

    expect(await editor.innerText()).toBe(before)
    await expect(
      preview
        .getByRole("list", { name: "Structural changes", exact: true })
        .getByRole("listitem")
        .first(),
    ).toBeVisible()
    await scan(page, info, "pending")

    await reject.click()
    await expect(accept).toHaveCount(0)
    expect(await editor.innerText()).toBe(before)
    await preview.getByRole("button", { name: "Undo", exact: true }).click()
    await expect(accept).toBeEnabled()
    await accept.click()
    await expect(
      editor.getByRole("heading", { name: "Reviewed section", exact: true }),
    ).toBeVisible()
    await expect(editor.locator("blockquote")).toContainText(
      "Moved review context",
    )
    await expect(editor.locator("mark")).toHaveText("Anchor remains unique.")
    await expect(accept).toHaveCount(0)
    await preview.getByRole("button", { name: "Undo", exact: true }).click()
    expect(await editor.innerText()).toBe(before)
    await expect(accept).toBeEnabled()
    await preview.getByRole("button", { name: "Redo", exact: true }).click()
    await expect(
      editor.getByRole("heading", { name: "Reviewed section", exact: true }),
    ).toBeVisible()
    await expect(editor.locator("mark")).toHaveText("Anchor remains unique.")
    await scan(page, info, "accepted")
    await info.attach("structural-review.png", {
      body: await preview.screenshot({ scale: "css" }),
      contentType: "image/png",
    })
  })
}

test("structural decisions follow current permissions, read-only state, and document changes", async ({
  page,
}, info) => {
  test.slow()
  const { preview, editor } = await openStructuralPart(page, ...parts[0])
  await preview
    .getByRole("button", { name: "Propose structural changes", exact: true })
    .click()

  const accept = preview.getByRole("button", {
    name: "Accept structural proposal",
    exact: true,
  })

  const reject = preview.getByRole("button", {
    name: "Reject structural proposal",
    exact: true,
  })

  await expect(accept).toBeEnabled()
  await preview
    .getByRole("button", { name: "Revoke decision permission", exact: true })
    .click()
  await expect(accept).toBeDisabled()
  await expect(reject).toBeDisabled()
  await preview
    .getByRole("button", { name: "Allow decision permission", exact: true })
    .click()
  await expect(accept).toBeEnabled()
  await preview
    .getByRole("button", {
      name: "Make structural editor read-only",
      exact: true,
    })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "false")
  await expect(accept).toBeDisabled()
  await expect(reject).toBeDisabled()
  await scan(page, info, "read-only")
  await preview
    .getByRole("button", { name: "Enable structural editing", exact: true })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.fill("Host document changed")

  if (await accept.count()) await expect(accept).toBeDisabled()
  await expect(editor).toHaveText("Host document changed")
  await expect(editor.getByRole("heading")).toHaveCount(0)
})
