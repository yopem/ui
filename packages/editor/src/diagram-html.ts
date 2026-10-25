import type {
  DOMConversion,
  DOMConversionMap,
  DOMConversionOutput,
  HTMLConfig,
} from "lexical"

import { $isCodeNode, CodeNode } from "@lexical/code"
import { $getState, isHTMLElement } from "lexical"

import {
  EDITOR_DIAGRAM_MAX_SOURCE_BYTES,
  parseEditorDiagramMetadata,
} from "./diagram-model"
import { $setEditorDiagramMetadata, editorDiagramState } from "./diagram-state"

function metadataFromElement(element: HTMLElement) {
  if (element.getAttribute("data-editor-diagram") !== "1") return null

  return parseEditorDiagramMetadata({
    version: 1,
    kind: element.getAttribute("data-editor-diagram-kind"),
    viewMode: element.getAttribute("data-editor-diagram-view"),
  })
}

function setImportedMetadata(
  node: HTMLElement,
  output: DOMConversionOutput | null,
) {
  if (!output) return output
  const metadata = metadataFromElement(node)
  const source = node.textContent ?? ""

  if (
    !metadata ||
    source.length > EDITOR_DIAGRAM_MAX_SOURCE_BYTES ||
    new TextEncoder().encode(source).length > EDITOR_DIAGRAM_MAX_SOURCE_BYTES
  )
    return output

  for (const imported of Array.isArray(output.node)
    ? output.node
    : [output.node])
    if ($isCodeNode(imported)) $setEditorDiagramMetadata(imported, metadata)

  return output
}

export function createEditorDiagramHTMLConfig(
  base: HTMLConfig = {},
): HTMLConfig {
  const candidates = new Map<string, DOMConversionMap[string][]>()
  const imports: DOMConversionMap = { ...base.import }
  const exports: NonNullable<HTMLConfig["export"]> = new Map(base.export)

  for (const [tag, convert] of Object.entries(CodeNode.importDOM?.() ?? {})) {
    const list = candidates.get(tag) ?? []
    list.push(convert)
    candidates.set(tag, list)
  }

  const previousExport = base.export?.get(CodeNode)

  exports.set(CodeNode, (editor, node) => {
    const output = previousExport
      ? previousExport(editor, node)
      : node.exportDOM(editor)

    const metadata = $getState(node, editorDiagramState)

    if (!metadata) return output

    const diagramMetadata = metadata

    function apply(element: typeof output.element | undefined) {
      if (element && isHTMLElement(element)) {
        element.setAttribute("data-editor-diagram", "1")
        element.setAttribute("data-editor-diagram-kind", diagramMetadata.kind)
        element.setAttribute(
          "data-editor-diagram-view",
          diagramMetadata.viewMode,
        )
      }

      return element
    }

    apply(output.element)

    return {
      ...output,
      after(element) {
        return apply(output.after ? output.after.call(node, element) : element)
      },
    }
  })

  for (const [tag, converters] of candidates) {
    const previousImport = base.import?.[tag]

    if (previousImport) converters.push(previousImport)

    imports[tag] = (element) => {
      let selected: DOMConversion | null = null

      for (const convert of converters) {
        const candidate = convert(element)

        if (
          candidate &&
          (!selected || (candidate.priority ?? 0) >= (selected.priority ?? 0))
        )
          selected = candidate
      }

      if (!selected) return null
      const { conversion, priority } = selected

      return {
        priority,
        conversion(dom) {
          return setImportedMetadata(dom, conversion(dom))
        },
      }
    }
  }

  return { import: imports, export: exports }
}
