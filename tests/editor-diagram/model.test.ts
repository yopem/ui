import {
  createEditorDiagramMetadata,
  parseEditorDiagramMetadata,
  type EditorDiagramKind,
  type EditorDiagramMetadataInput,
} from "@editor/diagram-model"
import { describe, expect, test } from "bun:test"

describe("editor diagram metadata", () => {
  test.each<EditorDiagramKind>([
    "mermaid",
    "plantuml",
    "graphviz",
    "flowchart",
  ])("parses %s metadata", (kind) => {
    expect(
      parseEditorDiagramMetadata(createEditorDiagramMetadata(kind)),
    ).toEqual({
      version: 1,
      kind,
      viewMode: "both",
    })
  })

  test.each<EditorDiagramMetadataInput>([
    null,
    "mermaid",
    { version: 2, kind: "mermaid", viewMode: "both" },
    { version: 1, kind: "unknown", viewMode: "both" },
    { version: 1, kind: "mermaid", viewMode: "thumbnail" },
    { version: 1, kind: "mermaid", viewMode: "both", endpoint: "/render" },
  ])("rejects unsupported metadata %j", (value) => {
    expect(parseEditorDiagramMetadata(value)).toBeNull()
  })
})
