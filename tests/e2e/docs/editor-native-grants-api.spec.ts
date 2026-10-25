import { expect, test } from "@playwright/test"
import { z } from "zod"

const apiSchema = z.object({
  parts: z.array(
    z.object({
      name: z.string(),
      source: z.string(),
      importPath: z.string().nullable(),
    }),
  ),
})

for (const item of [
  {
    name: "editor-collaboration-native",
    modelSource: "components/editor/collaboration-native-model.ts",
    modelImport: "@/components/editor/collaboration-native-model",
  },
  {
    name: "editor-collaboration-grants",
    modelSource: "lib/editor-collaboration/collaboration-native-model.ts",
    modelImport: "@/lib/editor-collaboration/collaboration-native-model",
  },
]) {
  test(`${item.name} exposes its own copied model namespace`, async ({
    request,
  }, testInfo) => {
    const response = await request.get(`/r/docs/${item.name}.json`)
    expect(response.ok()).toBe(true)
    expect(response.headers()["content-type"]).toContain("application/json")
    const api = apiSchema.parse(await response.json())

    for (const name of [
      "editorNativeRoomGrantSchema",
      "validateEditorNativeRoomGrant",
    ]) {
      const part = api.parts.find((entry) => entry.name === name)
      expect(part?.source).toBe(item.modelSource)
      expect(part?.importPath).toBe(item.modelImport)
    }

    if (item.name === "editor-collaboration-grants") {
      const factory = api.parts.find(
        (part) => part.name === "createEditorNativeGrantsHttpHandler",
      )

      expect(factory?.source).toBe(
        "lib/editor-collaboration/collaboration-native-grants.ts",
      )
      expect(factory?.importPath).toBe(
        "@/lib/editor-collaboration/collaboration-native-grants",
      )
    }

    await testInfo.attach("native-model-api", {
      body: JSON.stringify({ item: item.name, api }, null, 2),
      contentType: "application/json",
    })
  })
}
