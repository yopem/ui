import { createEditorDiagramMetadata } from "@editor/diagram-model"
import {
  createEditorDiagramPresentationExtension,
  getEditorDiagramRenderedSvg,
} from "@editor/diagram-presentation"
import { editorDiagramState } from "@editor/diagram-state"
import { createEditorDiagramStore } from "@editor/diagram-store"
import { $createCodeNode, $isCodeNode, CodeExtension } from "@lexical/code"
import { buildEditorFromExtensions } from "@lexical/extension"
import { RichTextExtension } from "@lexical/rich-text"
import { withDOM } from "@workspace/tests/fixtures/lexical-dom"
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getNodeByKey,
  $getSelection,
  $setSelection,
  $isRangeSelection,
  $setState,
  defineExtension,
} from "lexical"

const { DOMParser, DOMEvent } = withDOM((window) => ({
  DOMEvent: window.Event,
  DOMParser: window.DOMParser,
}))

const safeSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path d="M0 0h16v16H0z"></path></svg>'

const classes = {
  source: "source",
  preview: "preview",
  button: "button",
  selectedButton: "selected-button",
  image: "image",
  imageOnly: ["image-only"],
}

const previousParser = globalThis.DOMParser

function createDiagramEditor(
  viewMode: "image" | "both" = "image",
  renderDiagram: () => string | Promise<string> = () => safeSvg,
) {
  const editor = buildEditorFromExtensions(
    defineExtension({
      name: "test/editor-diagram-presentation",
      namespace: "test-editor-diagram-presentation",
      onError(error) {
        throw error
      },
      dependencies: [
        RichTextExtension,
        CodeExtension,
        createEditorDiagramPresentationExtension(classes),
      ],
    }),
  )

  editor.update(
    () => {
      $getRoot().clear()
      const code = $createCodeNode("mermaid")
      $setState(
        code,
        editorDiagramState,
        createEditorDiagramMetadata("mermaid", viewMode),
      )
      code.append($createTextNode("flowchart LR\n  A --> B"))
      $getRoot().append(code)
      $getRoot().append(
        $createParagraphNode().append(
          $createTextNode("Diagram code stays in native code blocks."),
        ),
      )
      code.selectStart()
    },
    { discrete: true },
  )

  withDOM((window) => {
    editor.setRootElement(window.document.createElement("div"))
  })

  const key = editor.getEditorState().read(() => {
    const node = $getRoot().getFirstChild()

    if (!node) throw new Error("Expected a diagram code node.")

    return node.getKey()
  })

  const element = editor.getElementByKey(key)

  if (!element) throw new Error("Expected the diagram DOM node.")

  const store = createEditorDiagramStore(editor, {
    renderers: { mermaid: renderDiagram },
  })

  const unsubscribe = store.subscribe(() => undefined)

  return { editor, element, key, store, unsubscribe }
}

function markImagePending(image: HTMLImageElement) {
  Object.defineProperties(image, {
    complete: { configurable: true, value: false },
    currentSrc: { configurable: true, get: () => image.src },
    naturalHeight: { configurable: true, value: 0 },
    naturalWidth: { configurable: true, value: 0 },
  })
}

function markImageLoaded(image: HTMLImageElement) {
  Object.defineProperties(image, {
    complete: { configurable: true, value: true },
    currentSrc: { configurable: true, get: () => image.src },
    naturalHeight: { configurable: true, value: 16 },
    naturalWidth: { configurable: true, value: 16 },
  })
  image.dispatchEvent(new DOMEvent("load"))
}

beforeEach(() => {
  Reflect.set(globalThis, "DOMParser", DOMParser)
})

afterEach(() => {
  Reflect.set(globalThis, "DOMParser", previousParser)
})

describe("editor diagram DOM presentation", () => {
  test("restores a cached image after a repeated render and keeps image mode", async () => {
    const { editor, element, key, store, unsubscribe } = createDiagramEditor()

    try {
      expect(await store.render()).toBe(true)

      const source = element.querySelector<HTMLSpanElement>(
        '[data-slot="editor-diagram-source"]',
      )

      const preview = element.querySelector<HTMLSpanElement>(
        '[data-slot="editor-diagram-preview"]',
      )

      const image = preview?.querySelector("img")
      const button = preview?.querySelector<HTMLButtonElement>("button")

      if (!source || !preview || !image || !button)
        throw new Error(
          `Expected diagram preview slots in: ${element.outerHTML}`,
        )

      expect(source.hidden).toBe(false)
      expect(button.hidden).toBe(true)
      expect(
        getEditorDiagramRenderedSvg(
          editor,
          key,
          "flowchart LR\n  A --> B",
          "mermaid",
        ),
      ).toBe(safeSvg)

      markImageLoaded(image)
      expect(button.hidden).toBe(false)
      expect(source.hidden).toBe(true)
      expect(store.getSnapshot()?.metadata.viewMode).toBe("image")

      markImagePending(image)
      expect(await store.render()).toBe(true)
      expect(store.getRenderSnapshot().status).toBe("ready")
      expect(store.getDownload()?.svg).toBe(safeSvg)
      expect(store.getSnapshot()?.metadata.viewMode).toBe("image")
      expect(source.hidden).toBe(false)
      expect(button.hidden).toBe(true)

      markImageLoaded(image)
      expect(button.hidden).toBe(false)
      expect(source.hidden).toBe(true)
    } finally {
      unsubscribe()
      editor.dispose()
    }
  })

  test("inserts after a live view-mode change without a stale selection", () => {
    const { editor, store, unsubscribe } = createDiagramEditor("both")

    try {
      expect(store.setViewMode("image")).toBe(true)
      expect(store.insert("mermaid", "flowchart LR\n  C --> D", "both")).toBe(
        true,
      )
      expect(
        editor.getEditorState().read(() => $getRoot().getChildren().length),
      ).toBe(3)
    } finally {
      unsubscribe()
      editor.dispose()
    }
  })

  test("inserts at a live diagram caret without flattening its code", () => {
    const { editor, key, store, unsubscribe } = createDiagramEditor("both")

    try {
      editor.update(
        () => {
          const code = $getNodeByKey(key)

          if (!$isCodeNode(code))
            throw new Error("Expected a diagram code node.")

          code.selectEnd()
        },
        { discrete: true },
      )
      expect(store.insert("mermaid", "flowchart LR\n  C --> D", "both")).toBe(
        true,
      )
      expect(
        editor.getEditorState().read(() =>
          $getRoot()
            .getChildren()
            .filter($isCodeNode)
            .map((code) => code.getTextContent()),
        ),
      ).toEqual(["flowchart LR\n  A --> B", "flowchart LR\n  C --> D"])
    } finally {
      unsubscribe()
      editor.dispose()
    }
  })

  test("inserts after the retained diagram when controls clear selection", () => {
    const { editor, key, store, unsubscribe } = createDiagramEditor("both")

    try {
      store.enterControls()
      expect(store.getSnapshot()?.key).toBe(key)
      editor.update(() => $setSelection(null), { discrete: true })
      expect(store.getSnapshot()?.key).toBe(key)
      expect(store.insert("mermaid", "flowchart LR\n  C --> D", "both")).toBe(
        true,
      )
      expect(
        editor.getEditorState().read(() =>
          $getRoot()
            .getChildren()
            .map((node) => node.getType()),
        ),
      ).toEqual(["code", "code", "paragraph"])
    } finally {
      unsubscribe()
      editor.dispose()
    }
  })

  test("inserts after source interaction and a live view change", async () => {
    let resolveRender: ((svg: string) => void) | undefined

    const { editor, element, key, store, unsubscribe } = createDiagramEditor(
      "both",
      () =>
        new Promise<string>((resolve) => {
          resolveRender = resolve
        }),
    )

    const rendering = store.render()

    try {
      const source = element.querySelector(
        '[data-slot="editor-diagram-source"]',
      )

      const selection = element.ownerDocument.getSelection()

      if (!source || !selection)
        throw new Error("Expected a native diagram text selection.")

      const range = element.ownerDocument.createRange()
      range.selectNodeContents(source)
      range.collapse(false)
      selection.removeAllRanges()
      selection.addRange(range)
      source.dispatchEvent(new DOMEvent("click", { bubbles: true }))
      store.enterControls()
      expect(
        editor.getEditorState().read(() => $isRangeSelection($getSelection())),
      ).toBe(true)

      expect(store.setViewMode("image")).toBe(true)
      expect(store.getSnapshot()?.key).toBe(key)
      expect(store.insert("mermaid", "flowchart LR\n  C --> D", "both")).toBe(
        true,
      )
      expect(
        editor.getEditorState().read(() =>
          $getRoot()
            .getChildren()
            .filter($isCodeNode)
            .map((code) => code.getTextContent()),
        ),
      ).toEqual(["flowchart LR\n  A --> B", "flowchart LR\n  C --> D"])
    } finally {
      resolveRender?.(safeSvg)
      await rendering
      unsubscribe()
      editor.dispose()
    }
  })
})
