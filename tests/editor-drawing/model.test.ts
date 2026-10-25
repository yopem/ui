import type { SerializedLexicalNode } from "lexical"

import {
  EDITOR_DRAWING_MAX_BYTES,
  EDITOR_DRAWING_MAX_ELEMENTS,
  parseEditorDrawingNode,
  parseEditorDrawingScene,
} from "@editor/drawing-model"
import { describe, expect, test } from "bun:test"

describe("editor drawing scene model", () => {
  test("accepts bounded native shape scenes and returns a detached value", () => {
    const scene = {
      elements: [
        {
          id: "shape-1",
          type: "rectangle",
          x: 8,
          y: 12,
          width: 120,
          height: 64,
          angle: 0,
          strokeColor: "#1e1e1e",
        },
      ],
    }

    const parsed = parseEditorDrawingScene(scene)
    scene.elements[0].x = 100

    expect(parsed.elements[0]).toMatchObject({ x: 8, type: "rectangle" })
  })

  test("accepts generic serialized Lexical input after strict drawing validation", () => {
    const data = {
      type: "editor-drawing",
      version: 1,
      elements: [{ id: "shape-1", type: "rectangle", link: null }],
    }

    const serialized: SerializedLexicalNode = data

    expect(parseEditorDrawingNode(serialized)).toMatchObject({
      type: "editor-drawing",
      version: 1,
      elements: [{ id: "shape-1", type: "rectangle", link: null }],
    })
  })

  test("allows inert null links and rejects blocked keys at every level", () => {
    expect(
      parseEditorDrawingScene({
        elements: [{ id: "shape-1", type: "rectangle", link: null }],
      }).elements[0],
    ).toMatchObject({ link: null })

    for (const element of [
      { id: "shape-1", type: "rectangle", fileId: null },
      { id: "shape-1", type: "rectangle", customData: null },
      { id: "shape-1", type: "rectangle", metadata: { src: null } },
      { id: "shape-1", type: "rectangle", link: "" },
    ])
      expect(() => parseEditorDrawingScene({ elements: [element] })).toThrow()
  })

  test("rejects malformed Unicode and non-JSON object prototypes", () => {
    expect(() =>
      parseEditorDrawingScene({
        elements: [{ id: "shape-1", type: "text", text: "\ud800" }],
      }),
    ).toThrow()

    const element = Object.assign(Object.create({ inherited: true }), {
      id: "shape-1",
      type: "rectangle",
    })

    expect(() => parseEditorDrawingScene({ elements: [element] })).toThrow()
  })

  test("rejects unsupported remote and file-backed elements", () => {
    const unsupported: object[] = [
      { type: "image", fileId: "file-1" },
      { type: "iframe", url: "https://example.com" },
      { type: "rectangle", link: "https://example.com" },
      { type: "rectangle", customData: { url: "https://example.com" } },
    ]

    for (const element of unsupported)
      expect(() => parseEditorDrawingScene({ elements: [element] })).toThrow()
  })

  test("rejects unsupported types, non-finite geometry, and oversized scenes", () => {
    expect(() =>
      parseEditorDrawingScene({ elements: [{ type: "unknown" }] }),
    ).toThrow()
    expect(() =>
      parseEditorDrawingScene({
        elements: [{ type: "rectangle", x: Infinity }],
      }),
    ).toThrow()
    expect(() =>
      parseEditorDrawingScene({
        elements: Array.from(
          { length: EDITOR_DRAWING_MAX_ELEMENTS + 1 },
          () => ({
            type: "rectangle",
          }),
        ),
      }),
    ).toThrow()
    expect(() =>
      parseEditorDrawingScene({
        elements: [
          { type: "text", text: "x".repeat(EDITOR_DRAWING_MAX_BYTES) },
        ],
      }),
    ).toThrow()
  })
})
