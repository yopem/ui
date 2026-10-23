import type {
  DOMConversion,
  DOMConversionMap,
  HTMLConfig,
  Klass,
  ElementNode,
  EditorState,
} from "lexical"

import { CodeNode } from "@lexical/code"
import { ListItemNode, ListNode } from "@lexical/list"
import { HeadingNode, QuoteNode } from "@lexical/rich-text"
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table"
import {
  $getNodeByKey,
  $getRoot,
  $isElementNode,
  $setState,
  defineExtension,
  HISTORIC_TAG,
  mergeRegister,
  ParagraphNode,
} from "lexical"

import type { EditorBlockPresentation } from "./block-presentation"

import {
  $getEditorBlockPresentation,
  editorBlockPresentationState,
  parseEditorBlockPresentation,
} from "./block-presentation"

const blockNodes: readonly Klass<ElementNode>[] = [
  ParagraphNode,
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  CodeNode,
  TableNode,
  TableRowNode,
  TableCellNode,
]

export function createEditorBlockPresentationHTMLConfig(
  nodes: readonly Klass<ElementNode>[] = blockNodes,
  base: HTMLConfig = {},
): HTMLConfig {
  const candidates = new Map<string, DOMConversionMap[string][]>()
  const imports: DOMConversionMap = { ...base.import }
  const exports: NonNullable<HTMLConfig["export"]> = new Map(base.export)

  for (const klass of nodes) {
    klass.getType()

    for (const [tag, convert] of Object.entries(klass.importDOM?.() ?? {})) {
      const list = candidates.get(tag) ?? []
      list.push(convert)
      candidates.set(tag, list)
    }

    const previousExport = base.export?.get(klass)

    exports.set(klass, (editor, node) => {
      const output = previousExport
        ? previousExport(editor, node)
        : node.exportDOM(editor)

      if (!$isElementNode(node) || node.isInline()) return output
      const value = $getEditorBlockPresentation(node)

      function apply(element: typeof output.element | undefined) {
        if (element && "style" in element) {
          if (value.lineHeight) element.style.lineHeight = value.lineHeight

          if (value.textIndent) element.style.textIndent = value.textIndent
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
  }

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
          const output = conversion(dom)

          if (!output) return null

          const value = parseEditorBlockPresentation({
            lineHeight: dom.style.lineHeight,
            textIndent: dom.style.textIndent,
          })

          if (value.lineHeight || value.textIndent)
            for (const node of Array.isArray(output.node)
              ? output.node
              : [output.node])
              if ($isElementNode(node) && !node.isInline())
                $setState(node, editorBlockPresentationState, value)

          return output
        },
      }
    }
  }

  return { import: imports, export: exports }
}

export const EditorBlockPresentationExtension = defineExtension({
  name: "@yopem-ui/editor/block-presentation",
  init(editorConfig) {
    editorConfig.html = createEditorBlockPresentationHTMLConfig(
      blockNodes,
      editorConfig.html,
    )
  },
  register(editor) {
    function apply(node: ElementNode, before?: EditorBlockPresentation) {
      if (node.isInline() || node.getKey() === "root") return
      const value = $getEditorBlockPresentation(node)

      if (
        !value.lineHeight &&
        !value.textIndent &&
        !before?.lineHeight &&
        !before?.textIndent
      )
        return
      const dom = editor.getElementByKey(node.getKey())

      if (!dom) return

      if (
        (value.lineHeight || before?.lineHeight) &&
        dom.style.lineHeight !== value.lineHeight
      )
        dom.style.lineHeight = value.lineHeight

      if (
        (value.textIndent || before?.textIndent) &&
        dom.style.textIndent !== value.textIndent
      )
        dom.style.textIndent = value.textIndent
    }

    function visit(node: ElementNode, previous?: EditorState) {
      const key = node.getKey()

      const before = previous?.read(() => {
        const previousNode = $getNodeByKey(key)

        return $isElementNode(previousNode)
          ? $getEditorBlockPresentation(previousNode)
          : undefined
      })

      apply(node, before)

      for (const child of node.getChildren())
        if ($isElementNode(child)) visit(child, previous)
    }

    return mergeRegister(
      editor.registerRootListener((root) => {
        if (!root) return
        editor.getEditorState().read(() => visit($getRoot()))
      }),
      editor.registerUpdateListener(
        ({ editorState, prevEditorState, dirtyElements, tags }) => {
          editorState.read(() => {
            if (
              tags.has(HISTORIC_TAG) ||
              (dirtyElements.size === 1 && dirtyElements.has("root"))
            ) {
              visit($getRoot(), prevEditorState)

              return
            }

            for (const key of dirtyElements.keys()) {
              const node = $getNodeByKey(key)

              if (!$isElementNode(node) || node.isInline() || key === "root")
                continue

              const before = prevEditorState.read(() => {
                const previous = $getNodeByKey(key)

                return $isElementNode(previous)
                  ? $getEditorBlockPresentation(previous)
                  : undefined
              })

              apply(node, before)
            }
          })
        },
      ),
    )
  },
})
