import { expect, test } from "@playwright/test"
import { z } from "zod"

const apiSchema = z.object({
  parts: z.array(
    z.object({ name: z.string(), importPath: z.string().nullable() }),
  ),
})

test("AI client API uses the copied public modules", async ({
  request,
}, testInfo) => {
  const response = await request.get("/r/docs/editor.json")
  expect(response.ok()).toBe(true)
  const api = apiSchema.parse(await response.json())

  for (const name of ["EditorAiRoot", "EditorAiTrigger", "EditorAiPanel"]) {
    expect(api.parts.find((part) => part.name === name)?.importPath).toBe(
      "@/components/editor/ai-controls",
    )
  }

  for (const name of [
    "requestEditorAi",
    "readEditorAiProposal",
    "EditorAiConfig",
  ]) {
    expect(api.parts.find((part) => part.name === name)?.importPath).toBe(
      "@/components/editor/ai-client",
    )
  }

  await testInfo.attach("ai-client-imports", {
    body: JSON.stringify(
      api.parts.filter((part) =>
        /^(EditorAi|requestEditorAi|readEditorAi)/.test(part.name),
      ),
    ),
    contentType: "application/json",
  })
})
