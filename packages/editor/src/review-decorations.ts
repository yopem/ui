import {
  $getNodeByKey,
  $getRoot,
  $isTextNode,
  TextNode,
  type LexicalEditor,
} from "lexical"

import type { EditorSuggestion } from "./review-codecs"

interface ReviewDecoration {
  originalLine: string
  appliedLine: string
  originalTitle: string | null
  appliedTitle: string | null
  originalKind: string | undefined
  appliedKind: EditorSuggestion["kind"]
}

export function registerReviewDecorations(
  editor: LexicalEditor,
  visible: () => boolean,
  suggestionFor: (node: TextNode) => EditorSuggestion | null,
) {
  const decorations = new WeakMap<HTMLElement, ReviewDecoration>()

  function restore(element: HTMLElement) {
    const previous = decorations.get(element)

    if (!previous) return

    if (element.style.textDecorationLine === previous.appliedLine)
      element.style.textDecorationLine = previous.originalLine

    if (element.getAttribute("title") === previous.appliedTitle) {
      if (previous.originalTitle === null) element.removeAttribute("title")
      else element.setAttribute("title", previous.originalTitle)
    }

    if (element.dataset.editorSuggestion === previous.appliedKind) {
      if (previous.originalKind === undefined)
        delete element.dataset.editorSuggestion
      else element.dataset.editorSuggestion = previous.originalKind
    }

    decorations.delete(element)
  }

  function decorate(node: TextNode) {
    const element = editor.getElementByKey(node.getKey())

    if (!element) return
    const suggestion = visible() ? suggestionFor(node) : null

    if (!suggestion) {
      restore(element)

      return
    }

    const previous = decorations.get(element) ?? {
      originalLine: element.style.textDecorationLine,
      appliedLine: element.style.textDecorationLine,
      originalTitle: element.getAttribute("title"),
      appliedTitle: element.getAttribute("title"),
      originalKind: element.dataset.editorSuggestion,
      appliedKind: suggestion.kind,
    }

    if (element.style.textDecorationLine !== previous.appliedLine)
      previous.originalLine = element.style.textDecorationLine

    if (element.getAttribute("title") !== previous.appliedTitle)
      previous.originalTitle = element.getAttribute("title")

    if (element.dataset.editorSuggestion !== previous.appliedKind)
      previous.originalKind = element.dataset.editorSuggestion
    element.style.textDecorationLine = previous.originalLine

    const baseLine =
      element.ownerDocument.defaultView?.getComputedStyle(element)
        .textDecorationLine ?? previous.originalLine

    const lines = new Set(
      baseLine
        .split(/\s+/)
        .filter((line) =>
          ["underline", "overline", "line-through", "blink"].includes(line),
        ),
    )

    if (suggestion.kind !== "format")
      lines.add(suggestion.kind === "delete" ? "line-through" : "underline")
    previous.appliedLine =
      suggestion.kind === "format"
        ? previous.originalLine
        : [...lines].join(" ")
    element.style.textDecorationLine = previous.appliedLine
    previous.appliedLine = element.style.textDecorationLine
    previous.appliedKind = suggestion.kind
    element.dataset.editorSuggestion = suggestion.kind
    previous.appliedTitle = `${suggestion.author.name}: ${suggestion.kind} suggestion`
    element.setAttribute("title", previous.appliedTitle)
    decorations.set(element, previous)
  }

  function refresh() {
    editor.getEditorState().read(() => {
      for (const node of $getRoot().getAllTextNodes()) decorate(node)
    })
  }

  const unregister = editor.registerMutationListener(TextNode, (mutations) => {
    editor.getEditorState().read(() => {
      for (const [key, mutation] of mutations) {
        if (mutation === "destroyed") continue
        const node = $getNodeByKey(key)

        if ($isTextNode(node)) decorate(node)
      }
    })
  })

  function dispose() {
    unregister()
    editor.getEditorState().read(() => {
      for (const node of $getRoot().getAllTextNodes()) {
        const element = editor.getElementByKey(node.getKey())

        if (element) restore(element)
      }
    })
  }

  return { refresh, dispose }
}
