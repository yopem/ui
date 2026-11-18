import { expect, test } from "@playwright/test"

import { openPreview } from "./helpers"

test("highlighted code follows edits, languages, aliases, and blank lines", async ({
  page,
}) => {
  await openPreview(page, "use-highlighted-code")

  const code = page.getByRole("textbox", { name: "Code" })
  const language = page.getByRole("textbox", { name: "Language" })
  const lines = page.getByTestId("highlighted-line")
  await expect(code).toBeVisible()
  await expect(language).toBeVisible()
  await expect(lines).toHaveCount(1)
  await expect(lines.first()).toHaveText("const answer = 42")
  await expect(lines.first().locator("span").first()).toHaveCSS("color", /.+/)
  await expect
    .poll(() => lines.first().locator("span").count())
    .toBeGreaterThan(1)

  await code.fill("const answer = 42\n\nanswer")
  await expect(code).toHaveValue("const answer = 42\n\nanswer")
  await expect(lines).toHaveCount(3)
  await expect(lines.nth(1)).toHaveText("")
  await expect(lines.nth(2)).toHaveText("answer")
  await code.fill("const answer = 42\n\nanswer + 1\n")
  await expect(lines).toHaveCount(3)
  await expect(lines.nth(2)).toHaveText("answer + 1")

  await language.fill("unknown-language")
  await expect(lines.first()).toHaveText("const answer = 42")
  await expect(lines.first().locator("span")).toHaveCount(0)
  await code.fill("hello\n\nworld")
  await expect(lines).toHaveCount(3)
  await expect(lines.nth(1)).toHaveText("")
  await expect(lines.nth(2)).toHaveText("world")

  await code.fill("const answer = 42")
  await language.fill("js")
  await expect
    .poll(() => lines.first().locator("span").count())
    .toBeGreaterThan(1)
  await language.fill("python")
  await code.fill("def answer():\n    return 42")
  await expect(lines).toHaveCount(2)
  await expect
    .poll(() => lines.first().locator("span").count())
    .toBeGreaterThan(1)
  await language.fill("PY")
  await expect
    .poll(() => lines.first().locator("span").count())
    .toBeGreaterThan(1)

  await language.fill("ansi")
  await code.fill("\u001b[31mError\u001b[0m\n\nDone")
  await expect(lines).toHaveCount(3)
  await expect(lines.first()).toHaveText("Error")
  await expect(lines.nth(2)).toHaveText("Done")

  await code.fill("\u001b[1;3;4;44mFormatted\u001b[0m")
  const formatted = lines.first().locator("span").first()
  await expect(formatted).toHaveText("Formatted")
  await expect(formatted).toHaveCSS("font-weight", "700")
  await expect(formatted).toHaveCSS("font-style", "italic")
  await expect(formatted).toHaveCSS("text-decoration-line", "underline")
  await expect(formatted).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)")

  await code.fill("\u001b[9mRemoved\u001b[0m")
  await expect(lines.first().locator("span").first()).toHaveCSS(
    "text-decoration-line",
    "line-through",
  )

  await language.fill("html")
  await code.fill("<script>window.highlightInjected = true</script>")
  await expect(lines.first()).toHaveText(
    "<script>window.highlightInjected = true</script>",
  )
  expect(
    await page.evaluate(() => Reflect.has(window, "highlightInjected")),
  ).toBe(false)
})
