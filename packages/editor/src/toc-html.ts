import type { HTMLConfig } from "lexical"

import { HeadingNode } from "@lexical/rich-text"

import { isElement } from "./dom"
import { getEditorTocHeadingId } from "./toc-runtime"

export function createEditorTocHTMLConfig(base: HTMLConfig = {}) {
  const exports = new Map(base.export)
  const previous = base.export?.get(HeadingNode)

  exports.set(HeadingNode, (editor, node) => {
    const output = previous ? previous(editor, node) : node.exportDOM(editor)
    const id = getEditorTocHeadingId(editor, node.getKey())

    function apply(element: typeof output.element | undefined) {
      if (element && isElement(element)) element.id = id

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

  return { ...base, export: exports }
}
