import type {
  DOMConversion,
  DOMConversionMap,
  HTMLConfig,
  LexicalEditor,
  LexicalNode,
} from "lexical"

import {
  CheckListExtension,
  ListExtension,
  ListNode,
  $isListNode,
} from "@lexical/list"
import {
  $getNodeByKey,
  $getRoot,
  $getState,
  $isElementNode,
  $setState,
  defineExtension,
  HISTORIC_TAG,
  mergeRegister,
} from "lexical"

import {
  $getEditorListMarker,
  EDITOR_LIST_MARKER_ATTRIBUTE,
  editorListMarkerState,
  isEditorListMarkerForType,
  isEditorListStart,
  parseEditorListMarkerHTML,
  parseEditorListStartHTML,
} from "./list-presentation-model"

export function createEditorListPresentationHTMLConfig(
  base: HTMLConfig = {},
): HTMLConfig {
  const imports: DOMConversionMap = { ...base.import }
  const exports: NonNullable<HTMLConfig["export"]> = new Map(base.export)
  const nativeImports = ListNode.importDOM?.() ?? {}

  for (const tag of ["ol", "ul"] as const) {
    const converters: NonNullable<DOMConversionMap["ul"]>[] = []
    const nativeConvert = nativeImports[tag]
    const baseConvert = base.import?.[tag]

    if (nativeConvert) converters.push(nativeConvert)

    if (baseConvert) converters.push(baseConvert)

    if (!converters.length) continue
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
          const output = conversion(dom)

          if (!output) return null
          const explicitMarker = dom.getAttribute(EDITOR_LIST_MARKER_ATTRIBUTE)

          const marker = parseEditorListMarkerHTML({
            marker: explicitMarker,
            listStyleType: dom.style.listStyleType,
          })

          const nodes = Array.isArray(output.node) ? output.node : [output.node]

          for (const node of nodes) {
            if (!$isListNode(node)) continue

            if (marker !== undefined) {
              if (!isEditorListMarkerForType(marker, node.getListType())) {
                if (explicitMarker !== null)
                  throw new Error(
                    "List marker does not match native list type.",
                  )
              } else $setState(node, editorListMarkerState, marker)
            }

            if (node.getListType() === "number" && dom.hasAttribute("start")) {
              const start = parseEditorListStartHTML(dom.getAttribute("start"))

              if (start === undefined)
                throw new Error("Ordered list start is outside native bounds.")
              node.setStart(start)
            }
          }

          return output
        },
      }
    }
  }

  const previousExport = base.export?.get(ListNode)

  exports.set(ListNode, (editor, node) => {
    const output = previousExport
      ? previousExport(editor, node)
      : node.exportDOM(editor)

    if (!$isListNode(node)) return output
    const markerValue = $getEditorListMarker(node)
    const isOrdered = node.getListType() === "number"
    const start = node.getStart()

    if (
      markerValue !== undefined &&
      !isEditorListMarkerForType(markerValue, node.getListType())
    )
      throw new Error("List marker does not match native list type.")

    if (isOrdered && !isEditorListStart(start))
      throw new Error("Ordered list start is outside native bounds.")

    if (markerValue === undefined && !isOrdered) return output

    function apply(element: typeof output.element | undefined) {
      if (element && "style" in element) {
        if (markerValue !== undefined) {
          element.style.listStyleType = markerValue
          element.setAttribute(EDITOR_LIST_MARKER_ATTRIBUTE, markerValue)
        }

        if (isOrdered && element.tagName.toLowerCase() === "ol") {
          if (start === 1) element.removeAttribute("start")
          else element.setAttribute("start", String(start))
        }
      }

      return element
    }

    apply(output.element)

    return {
      ...output,
      after(element) {
        return apply(output.after ? output.after(element) : element)
      },
    }
  })

  return { import: imports, export: exports }
}

function applyListMarkerDOM(editor: LexicalEditor, node: ListNode) {
  const element = editor.getElementByKey(node.getKey())

  if (!element) return
  const marker = $getEditorListMarker(node)

  if (marker === undefined) {
    if (!element.hasAttribute(EDITOR_LIST_MARKER_ATTRIBUTE)) return
    element.removeAttribute(EDITOR_LIST_MARKER_ATTRIBUTE)
    element.style.removeProperty("list-style-type")

    return
  }

  if (!isEditorListMarkerForType(marker, node.getListType()))
    throw new Error("List marker does not match native list type.")
  element.style.listStyleType = marker
  element.setAttribute(EDITOR_LIST_MARKER_ATTRIBUTE, marker)
}

function visitLists(node: LexicalNode, editor: LexicalEditor) {
  if ($isListNode(node)) applyListMarkerDOM(editor, node)

  if (!$isElementNode(node)) return

  for (const child of node.getChildren()) visitLists(child, editor)
}

export const EditorListPresentationExtension = defineExtension({
  name: "@yopem-ui/editor/list-presentation",
  dependencies: [ListExtension, CheckListExtension],
  init(editorConfig) {
    editorConfig.html = createEditorListPresentationHTMLConfig(
      editorConfig.html,
    )
  },
  register(editor) {
    return mergeRegister(
      editor.registerNodeTransform(ListNode, (node) => {
        if (!isEditorListStart(node.getStart()))
          throw new Error("Ordered list start is outside native bounds.")
        const marker = $getState(node, editorListMarkerState)

        if (
          marker !== undefined &&
          !isEditorListMarkerForType(marker, node.getListType())
        )
          $setState(node, editorListMarkerState, undefined)
      }),
      editor.registerRootListener((root) => {
        if (!root) return
        editor.getEditorState().read(() => visitLists($getRoot(), editor))
      }),
      editor.registerUpdateListener(({ editorState, dirtyElements, tags }) => {
        editorState.read(() => {
          if (
            tags.has(HISTORIC_TAG) ||
            (dirtyElements.size === 1 && dirtyElements.has("root"))
          ) {
            visitLists($getRoot(), editor)

            return
          }

          for (const key of dirtyElements.keys()) {
            const node = $getNodeByKey(key)

            if ($isListNode(node)) applyListMarkerDOM(editor, node)
          }
        })
      }),
    )
  },
})
