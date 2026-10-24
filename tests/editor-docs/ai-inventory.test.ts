import { editorParts } from "@workspace/apps/docs/src/catalog/editor-parts"
import { expect, test } from "bun:test"

test("AI proposal parts use the client editor item", () => {
  for (const name of ["EditorAiRoot", "EditorAiTrigger", "EditorAiPanel"]) {
    const matches = editorParts.filter((part) => part.name === name)
    expect(matches).toHaveLength(1)
    expect(matches[0]?.item).toBe("editor")
  }
})
