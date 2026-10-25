import {
  decodeEditorLabelNode,
  decodeEditorLabels,
  parseEditorLabelOptions,
} from "@yopem-ui/editor/labels/model"
import { describe, expect, test } from "bun:test"

const options = [
  "Editor",
  "Select Editor",
  "Block Selection",
  "Button",
  "Command",
  "Dialog",
  "Form",
  "Input",
  "Label",
  "Popover",
  "Tag Node",
]

const validNode = {
  type: "editor-label",
  version: 1,
  label: "Editor",
  text: "Editor",
  format: 0,
  detail: 0,
  mode: "token",
  style: "",
} as const

describe("editor label codecs", () => {
  test("accepts fixed option lists and rejects duplicates or unbounded lists", () => {
    expect(parseEditorLabelOptions(options)).toEqual(options)
    expect(parseEditorLabelOptions(["Editor", "Editor"])).toBeNull()
    expect(
      parseEditorLabelOptions(Array.from({ length: 65 }, (_, i) => `L${i}`)),
    ).toBeNull()
    expect(parseEditorLabelOptions([" Editor"])).toBeNull()
    expect(parseEditorLabelOptions(["bad\nlabel"])).toBeNull()
    expect(parseEditorLabelOptions(["x".repeat(129)])).toBeNull()
  })

  test("bounds label values and enforces exact options, uniqueness, and max ten", () => {
    expect(decodeEditorLabels([], options)).toEqual([])
    expect(decodeEditorLabels(options.slice(0, 10), options)).toEqual(
      options.slice(0, 10),
    )
    expect(decodeEditorLabels(options, options)).toBeNull()
    expect(decodeEditorLabels(["Editor", "Editor"], options)).toBeNull()
    expect(decodeEditorLabels(["External"], options)).toBeNull()
    expect(decodeEditorLabels(["x".repeat(129)], options)).toBeNull()
    expect(decodeEditorLabels(null, options)).toBeNull()
  })

  test("accepts supported token JSON and rejects altered or oversized schemas", () => {
    expect(decodeEditorLabelNode(validNode)).toEqual(validNode)
    expect(decodeEditorLabelNode({ ...validNode, text: "Other" })).toBeNull()
    expect(decodeEditorLabelNode({ ...validNode, version: 2 })).toBeNull()
    expect(decodeEditorLabelNode({ ...validNode, mode: "normal" })).toBeNull()
    expect(decodeEditorLabelNode({ ...validNode, detail: 4 })).toBeNull()
    expect(
      decodeEditorLabelNode({ ...validNode, style: "x".repeat(4097) }),
    ).toBeNull()
    expect(
      decodeEditorLabelNode({ ...validNode, extra: "unsupported" }),
    ).toBeNull()
  })
})
