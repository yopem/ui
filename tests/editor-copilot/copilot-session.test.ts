import { firstEditorCopilotGrapheme } from "@editor/copilot-session"
import { expect, test } from "bun:test"

test("partial completion keeps one complete Unicode grapheme", () => {
  expect(firstEditorCopilotGrapheme("e\u0301clair")).toBe("e\u0301")
  expect(firstEditorCopilotGrapheme("👩‍🚀 orbit")).toBe("👩‍🚀")
  expect(firstEditorCopilotGrapheme("next word")).toBe("n")
})

test("partial completion rejects controls and line breaks", () => {
  expect(firstEditorCopilotGrapheme("")).toBeNull()
  expect(firstEditorCopilotGrapheme("\nnext")).toBeNull()
  expect(firstEditorCopilotGrapheme("\tindent")).toBeNull()
  expect(firstEditorCopilotGrapheme("\u2028next")).toBeNull()
})
