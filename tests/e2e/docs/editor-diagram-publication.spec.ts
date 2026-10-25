import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
import { z } from "zod"

const apiSchema = z.object({
  parts: z.array(
    z.object({ name: z.string(), importPath: z.string().nullable() }),
  ),
})

const parts = [
  ["Root", "root"],
  ["Toolbar", "toolbar"],
  ["InsertButton", "insert-button"],
  ["KindSelect", "kind-select"],
  ["ViewModeSelect", "view-mode-select"],
  ["RenderButton", "render-button"],
  ["DownloadButton", "download-button"],
  ["DeleteButton", "delete-button"],
  ["Status", "status"],
  ["Preview", "preview"],
] as const

test("diagram API keeps UI and portable helper imports separate", async ({
  request,
}, testInfo) => {
  const response = await request.get("/r/docs/editor-diagram.json")
  expect(response.ok()).toBe(true)
  const api = apiSchema.parse(await response.json())

  for (const [name] of parts)
    expect(
      api.parts.find((part) => part.name === `EditorDiagram${name}`)
        ?.importPath,
    ).toBe("@/components/editor/diagram")

  for (const [name, path] of [
    ["renderEditorDiagram", "render"],
    ["sanitizeEditorDiagramSvg", "render"],
    ["createEditorDiagramMetadata", "model"],
    ["createEditorDiagramHTMLConfig", "html"],
  ]) {
    expect(api.parts.find((part) => part.name === name)?.importPath).toBe(
      `@/components/editor/diagram-${path}`,
    )
  }

  await testInfo.attach("diagram-public-imports", {
    body: JSON.stringify(api),
    contentType: "application/json",
  })
})

test("unconfigured diagram controls keep native editing without implicit rendering", async ({
  page,
}, testInfo) => {
  test.slow()
  await page.goto("/editor/diagram-root")

  const preview = page.getByRole("group", {
    name: "EditorDiagramRoot live preview",
    exact: true,
  })

  const editor = preview.getByRole("textbox").first()
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.click()
  await editor.press("ControlOrMeta+End")
  await editor.press("Enter")
  await editor.pressSequentially("Source stays native")
  await expect(editor).toContainText("Source stays native")
  await expect(
    preview.getByRole("button", { name: "Render diagram", exact: true }),
  ).toBeDisabled()
  await expect(
    preview.getByRole("button", {
      name: "Download diagram as SVG",
      exact: true,
    }),
  ).toBeDisabled()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await testInfo.attach("unconfigured-diagram", {
    body: await preview.screenshot({ scale: "css" }),
    contentType: "image/png",
  })
})
