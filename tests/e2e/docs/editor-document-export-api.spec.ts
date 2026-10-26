import { expect, test } from "@playwright/test"
import { z } from "zod"

const itemSchema = z.object({
  dependencies: z.array(z.string()).default([]),
  registryDependencies: z.array(z.string()).default([]),
  files: z.array(z.object({ path: z.string() })),
})

const apiSchema = z.object({
  parts: z.array(
    z.object({ name: z.string(), importPath: z.string().nullable() }),
  ),
})

test("print controls and optional image adapter have independent dependencies", async ({
  request,
}, testInfo) => {
  const controlsResponse = await request.get("/r/editor-document-export.json")

  const adapterResponse = await request.get(
    "/r/editor-document-export-image.json",
  )

  expect(controlsResponse.ok()).toBe(true)
  expect(adapterResponse.ok()).toBe(true)

  const controls = itemSchema.parse(await controlsResponse.json())
  const adapter = itemSchema.parse(await adapterResponse.json())

  expect(
    controls.dependencies.some((value) => value.startsWith("html-to-image@")),
  ).toBe(false)
  expect(
    adapter.dependencies.some((value) => value.startsWith("html-to-image@^")),
  ).toBe(true)
  expect(adapter.registryDependencies).toContain("editor-document-export")
  expect(
    controls.files.some((file) =>
      file.path.endsWith("document-export-model.ts"),
    ),
  ).toBe(true)
  expect(
    controls.files.some((file) =>
      file.path.endsWith("document-export-image.ts"),
    ),
  ).toBe(true)

  await testInfo.attach("document-export-distribution", {
    body: JSON.stringify({ controls, adapter }, null, 2),
    contentType: "application/json",
  })
})

for (const entry of [
  {
    item: "editor-document-export",
    path: "@/components/editor/document-export",
    names: [
      "EditorDocumentPrintControl",
      "EditorDocumentImageExportControl",
      "EditorDocumentExportControls",
    ],
  },
  {
    item: "editor-document-export-image",
    path: "@/components/editor/document-export-html-to-image",
    names: ["captureEditorDocumentImageWithHtmlToImage"],
  },
]) {
  test(`${entry.item} publishes canonical consumer API imports`, async ({
    request,
  }, testInfo) => {
    const response = await request.get(`/r/docs/${entry.item}.json`)

    expect(response.ok()).toBe(true)
    expect(response.headers()["content-type"]).toContain("application/json")

    const api = apiSchema.parse(await response.json())

    for (const name of entry.names)
      expect(api.parts.find((part) => part.name === name)?.importPath).toBe(
        entry.path,
      )

    await testInfo.attach("document-export-api", {
      body: JSON.stringify({ entry, api }, null, 2),
      contentType: "application/json",
    })
  })
}
