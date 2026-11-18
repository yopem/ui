import type { Locator, Page } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

import { openPreview } from "./helpers"

const text = {
  name: "notes.txt",
  mimeType: "text/plain",
  buffer: Buffer.from("notes"),
}

const pdf = {
  name: "report.pdf",
  mimeType: "application/pdf",
  buffer: Buffer.from("pdf"),
}

const other = {
  name: "other.txt",
  mimeType: "text/plain",
  buffer: Buffer.from("other"),
}

const invalid = {
  name: "script.exe",
  mimeType: "application/octet-stream",
  buffer: Buffer.from("invalid"),
}

const large = {
  name: "large.txt",
  mimeType: "text/plain",
  buffer: Buffer.alloc(1048577),
}

function upload(page: Page, label = "Attachments") {
  return page.getByRole("group", { name: label, exact: true })
}

function input(group: Locator, label = "Attachments") {
  return group
    .locator('input[type="file"]')
    .and(group.getByLabel(`${label}: choose files`, { exact: true }))
}

async function drop(
  group: Locator,
  files: {
    name: string
    type: string
    content: string
    lastModified?: number
  }[],
) {
  const transfer = await group.page().evaluateHandle((items) => {
    const data = new DataTransfer()

    for (const item of items)
      data.items.add(
        new File([item.content], item.name, {
          type: item.type,
          lastModified: item.lastModified ?? 1,
        }),
      )

    return data
  }, files)

  await group.dispatchEvent("drop", { dataTransfer: transfer })
  await transfer.dispose()
}

async function expectCount(group: Locator, count: number) {
  await expect(group.getByRole("status")).toContainText(
    new RegExp(`\\b${count}\\b`),
  )
}

test.beforeEach(async ({ page }) => {
  await openPreview(page, "file-upload")
})

test("browse and drop add files, remove, reselect and clear without upload requests", async ({
  page,
}) => {
  await page.waitForLoadState("networkidle")
  const requests: string[] = []
  page.on("request", (request) => {
    if (request.method() !== "GET" && request.method() !== "HEAD")
      requests.push(`${request.method()} ${request.url()}`)
  })
  const group = upload(page)
  await expect(group).toHaveAttribute("data-slot", "file-upload")
  const chooser = input(group)
  await expect(chooser).toBeHidden()
  await expect(chooser).toHaveAttribute("accept", ".txt,.pdf")
  await expect(chooser).toHaveAttribute("multiple", "")
  await expect(
    group.getByRole("button", { name: "Browse files", exact: true }),
  ).toBeEnabled()
  await expect(
    group.getByRole("button", { name: "Clear files", exact: true }),
  ).toBeHidden()
  await expectCount(group, 0)
  await chooser.setInputFiles(text)
  await expect(group.getByText(text.name, { exact: true })).toBeVisible()
  await expectCount(group, 1)
  await drop(group, [{ name: pdf.name, type: pdf.mimeType, content: "pdf" }])
  await expect(group.getByText(pdf.name, { exact: true })).toBeVisible()
  await expectCount(group, 2)
  await group
    .getByRole("button", { name: `Remove ${text.name}`, exact: true })
    .click()
  await expect(
    group.getByRole("button", { name: "Browse files", exact: true }),
  ).toBeFocused()
  await expect(group.getByText(text.name, { exact: true })).toHaveCount(0)
  await chooser.setInputFiles(text)
  await expect(group.getByText(text.name, { exact: true })).toBeVisible()
  await expectCount(group, 2)
  await group.getByRole("button", { name: "Clear files", exact: true }).click()
  await expect(
    group.getByRole("button", { name: "Browse files", exact: true }),
  ).toBeFocused()
  await expectCount(group, 0)
  await expect(group.getByText(text.name, { exact: true })).toHaveCount(0)
  await expect(group.getByText(pdf.name, { exact: true })).toHaveCount(0)
  await expect(
    group.getByRole("button", { name: "Clear files", exact: true }),
  ).toBeHidden()
  expect(requests).toEqual([])
})

test("keyboard activates the file chooser exactly once", async ({ page }) => {
  const group = upload(page)

  const browse = group.getByRole("button", {
    name: "Browse files",
    exact: true,
  })

  let count = 0
  page.on("filechooser", () => {
    count += 1
  })
  await browse.focus()
  await expect(browse).toBeFocused()
  const chooser = page.waitForEvent("filechooser")
  await page.keyboard.press("Enter")
  await (await chooser).setFiles(text)
  await expect(group.getByText(text.name, { exact: true })).toBeVisible()
  await expect.poll(() => count).toBe(1)
})

for (const method of ["browse", "drop"] as const) {
  test(`${method} rejects invalid mixed, oversized and over-count batches atomically`, async ({
    page,
  }) => {
    const group = upload(page)
    const chooser = input(group)
    await chooser.setInputFiles(text)

    async function select(files: (typeof text)[]) {
      if (method === "browse") await chooser.setInputFiles(files)
      else
        await drop(
          group,
          files.map((file) => ({
            name: file.name,
            type: file.mimeType,
            content: file.buffer.toString(),
          })),
        )
    }

    for (const batch of [
      [pdf, invalid],
      [pdf, large],
      [pdf, other, { ...other, name: "third.txt" }],
    ]) {
      await select(batch)
      await expect(group.getByRole("alert")).toBeVisible()
      await expectCount(group, 1)
      await expect(group.getByText(text.name, { exact: true })).toBeVisible()

      for (const file of batch)
        await expect(group.getByText(file.name, { exact: true })).toHaveCount(0)
    }

    await select([pdf])
    await expect(group.getByText(pdf.name, { exact: true })).toBeVisible()
    await expectCount(group, 2)
  })
}

for (const file of [
  {
    name: "boundary.txt",
    mimeType: "text/plain",
    buffer: Buffer.alloc(1048576),
  },
  { name: "empty.txt", mimeType: "text/plain", buffer: Buffer.alloc(0) },
  {
    name: "uppercase.TXT",
    mimeType: "text/plain",
    buffer: Buffer.from("text"),
  },
]) {
  test(`accepts ${file.name}`, async ({ page }) => {
    const group = upload(page)
    await input(group).setInputFiles(file)
    await expect(group.getByText(file.name, { exact: true })).toBeVisible()
    await expectCount(group, 1)
    await expect(group.getByRole("alert")).toHaveCount(0)
  })
}

test("duplicate identity is ignored, but distinct metadata is retained", async ({
  page,
}) => {
  const group = upload(page)

  const item = {
    name: "duplicate.txt",
    type: "text/plain",
    content: "same",
    lastModified: 123,
  }

  await drop(group, [item])
  await drop(group, [item])
  await expectCount(group, 1)
  await expect(
    group.getByRole("button", { name: "Remove duplicate.txt", exact: true }),
  ).toHaveCount(1)
  await drop(group, [{ ...item, lastModified: 124 }])
  await expectCount(group, 2)
  await expect(
    group.getByRole("button", {
      name: "Remove duplicate.txt (file 1)",
      exact: true,
    }),
  ).toHaveCount(1)
  await expect(
    group.getByRole("button", {
      name: "Remove duplicate.txt (file 2)",
      exact: true,
    }),
  ).toHaveCount(1)
})

test("single selection replaces the previous file and rejects a multi-file drop", async ({
  page,
}) => {
  const group = upload(page, "Profile image")
  const chooser = input(group, "Profile image")
  await expect(chooser).toHaveAttribute("accept", "image/*")
  await expect(chooser).not.toHaveAttribute("multiple", "")
  await chooser.setInputFiles({
    name: "one.png",
    mimeType: "image/png",
    buffer: Buffer.from("one"),
  })
  await chooser.setInputFiles({
    name: "two.png",
    mimeType: "image/png",
    buffer: Buffer.from("two"),
  })
  await expect(group.getByText("one.png", { exact: true })).toHaveCount(0)
  await expect(group.getByText("two.png", { exact: true })).toBeVisible()
  await drop(group, [
    { name: "three.png", type: "image/png", content: "three" },
    { name: "four.png", type: "image/png", content: "four" },
  ])
  await expect(group.getByRole("alert")).toBeVisible()
  await expect(group.getByText("two.png", { exact: true })).toBeVisible()
  await expect(group.getByText("three.png", { exact: true })).toHaveCount(0)
  await expect(group.getByText("four.png", { exact: true })).toHaveCount(0)
  await expectCount(group, 1)
})

test("disabled upload ignores file changes and drops", async ({ page }) => {
  const group = upload(page, "Disabled upload")
  const chooser = input(group, "Disabled upload")
  await expect(chooser).toBeDisabled()
  await expect(
    group.getByRole("button", { name: "Browse files", exact: true }),
  ).toBeDisabled()
  await chooser.evaluate((element) => {
    if (!(element instanceof HTMLInputElement))
      throw new Error("Expected file input")
    const data = new DataTransfer()
    data.items.add(new File(["notes"], "notes.txt", { type: "text/plain" }))
    element.files = data.files
    element.dispatchEvent(new Event("change", { bubbles: true }))
  })
  await drop(group, [
    { name: text.name, type: text.mimeType, content: "notes" },
  ])
  await expect(group.getByText(text.name, { exact: true })).toHaveCount(0)
  await expectCount(group, 0)
  await expect(group.getByRole("button", { name: /^Remove / })).toHaveCount(0)
})

test("non-file and nested file drags maintain the correct active state", async ({
  page,
}) => {
  const group = upload(page)
  const child = group.getByRole("button", { name: "Browse files", exact: true })

  const nonFile = await page.evaluateHandle(() => {
    const data = new DataTransfer()
    data.setData("text/plain", "hello")

    return data
  })

  await group.dispatchEvent("dragenter", { dataTransfer: nonFile })
  await group.dispatchEvent("dragover", { dataTransfer: nonFile })
  await expect(group).not.toHaveAttribute("data-dragging", /.*/)
  await group.dispatchEvent("drop", { dataTransfer: nonFile })
  await expectCount(group, 0)
  await nonFile.dispose()

  const files = await page.evaluateHandle(() => {
    const data = new DataTransfer()
    data.items.add(new File(["notes"], "notes.txt", { type: "text/plain" }))

    return data
  })

  await group.dispatchEvent("dragenter", { dataTransfer: files })
  await expect(group).toHaveAttribute("data-dragging", /.*/)
  await child.dispatchEvent("dragenter", { dataTransfer: files })
  await child.dispatchEvent("dragleave", { dataTransfer: files })
  await expect(group).toHaveAttribute("data-dragging", /.*/)
  await group.dispatchEvent("dragleave", { dataTransfer: files })
  await expect(group).not.toHaveAttribute("data-dragging", /.*/)
  await files.dispose()
})

test("controlled upload follows external reset and can select again", async ({
  page,
}) => {
  const group = upload(page, "Controlled upload")
  const chooser = input(group, "Controlled upload")
  await chooser.setInputFiles(text)
  await expect(group.getByText(text.name, { exact: true })).toBeVisible()
  await page
    .getByRole("button", { name: "Reset selection", exact: true })
    .click()
  await expect(group.getByText(text.name, { exact: true })).toHaveCount(0)
  await expectCount(group, 0)
  await chooser.setInputFiles(text)
  await expect(group.getByText(text.name, { exact: true })).toBeVisible()
})

for (const theme of ["light", "dark"] as const) {
  test(`@a11y ${theme} selected and error states`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" })
    await page.evaluate(
      (value) => localStorage.setItem("yopem-ui-theme", value),
      theme,
    )
    await openPreview(page, "file-upload")
    const group = upload(page)
    await input(group).setInputFiles(text)
    await expectCount(group, 1)
    expect(
      (
        await new AxeBuilder({ page })
          .include('[data-slot="file-upload"]')
          .analyze()
      ).violations,
    ).toEqual([])
    await input(group).setInputFiles(invalid)
    await expect(group.getByRole("alert")).toBeVisible()
    expect(
      (
        await new AxeBuilder({ page })
          .include('[data-slot="file-upload"]')
          .analyze()
      ).violations,
    ).toEqual([])
    await testInfo.attach(`file-upload-${theme}`, {
      body: await group.screenshot(),
      contentType: "image/png",
    })
  })
}

test("homepage preview selects and removes a file", async ({ page }) => {
  await page.goto("/")
  await expect(
    page.getByRole("button", { name: "Search documentation", exact: true }),
  ).toBeEnabled()

  const showcase = page.locator(
    'section[aria-labelledby="showcase-file-upload"]',
  )

  await showcase.scrollIntoViewIfNeeded()

  const group = showcase.getByRole("group", {
    name: "Attachments",
    exact: true,
  })

  await input(group).setInputFiles(text)
  await expect(group.getByText(text.name, { exact: true })).toBeVisible()
  await group
    .getByRole("button", { name: `Remove ${text.name}`, exact: true })
    .click()
  await expect(group.getByText(text.name, { exact: true })).toHaveCount(0)
})
