import {
  editorEditableCardFromHTMLAttributes,
  parseEditorEditableCardNode,
} from "@editor/editable-card"
import { describe, expect, test } from "bun:test"

describe("editable card model", () => {
  test("accepts only the empty versioned Lexical node payload", () => {
    expect(
      parseEditorEditableCardNode({
        type: "editor-editable-card",
        version: 1,
      }),
    ).toEqual({ type: "editor-editable-card", version: 1 })
  })

  test("rejects unsupported and UI-bearing JSON payloads", () => {
    for (const value of [
      { type: "editor-editable-card", version: 2 },
      { type: "other", version: 1 },
      { type: "editor-editable-card", version: 1, title: "Not persisted" },
      {
        type: "editor-editable-card",
        version: 1,
        children: [{ type: "text", text: "Nested editor content" }],
      },
    ])
      expect(() => parseEditorEditableCardNode(value)).toThrow()
  })

  test("accepts only the canonical HTML marker", () => {
    expect(
      editorEditableCardFromHTMLAttributes({
        "data-editor-editable-card": "1",
      }),
    ).toEqual({ type: "editor-editable-card", version: 1 })

    for (const value of [undefined, "true", '{"version":1}', "2"])
      expect(() =>
        editorEditableCardFromHTMLAttributes({
          "data-editor-editable-card": value,
        }),
      ).toThrow()
  })
})
