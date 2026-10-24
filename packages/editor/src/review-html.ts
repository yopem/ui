import {
  $getState,
  $setState,
  $isTextNode,
  TextNode,
  type DOMConversionOutput,
  type HTMLConfig,
} from "lexical"

import {
  editorSuggestionState,
  editorReviewKeyboardState,
} from "./review-state"

function textExport(
  base: HTMLConfig,
  tagFor: (node: TextNode) => "ins" | "del" | "mark" | "kbd" | null,
): HTMLConfig {
  const exports: NonNullable<HTMLConfig["export"]> = new Map(base.export)
  const previousExport = base.export?.get(TextNode)
  exports.set(TextNode, (editor, node) => {
    const output = previousExport
      ? previousExport(editor, node)
      : node.exportDOM(editor)

    if (!$isTextNode(node)) return output
    const tag = tagFor(node)

    if (!tag) return output

    return {
      ...output,
      after(element) {
        const inner = output.after ? output.after(element) : element

        if (!inner) return inner
        const wrapper = document.createElement(tag)
        wrapper.append(inner)

        return wrapper
      },
    }
  })

  return { ...base, export: exports }
}

export function createEditorReviewHTMLConfig(
  base: HTMLConfig = {},
): HTMLConfig {
  return textExport(base, function suggestionTag(node) {
    const suggestion = $getState(node, editorSuggestionState)

    return !suggestion
      ? null
      : suggestion.kind === "insert"
        ? "ins"
        : suggestion.kind === "delete"
          ? "del"
          : "mark"
  })
}

export function createEditorReviewRichHTMLConfig(
  base: HTMLConfig = {},
): HTMLConfig {
  const result = textExport(base, function keyboardTag(node) {
    return $getState(node, editorReviewKeyboardState) ? "kbd" : null
  })

  return {
    ...result,
    import: {
      ...base.import,
      kbd(element) {
        const previous = base.import?.kbd?.(element)

        return {
          priority: previous?.priority ?? 1,
          conversion() {
            const output: DOMConversionOutput = previous?.conversion(
              element,
            ) ?? { node: null }

            return {
              ...output,
              forChild(child, parent) {
                const next = output.forChild
                  ? output.forChild(child, parent)
                  : child

                if ($isTextNode(next))
                  $setState(next, editorReviewKeyboardState, true)

                return next
              },
            }
          },
        }
      },
    },
  }
}
