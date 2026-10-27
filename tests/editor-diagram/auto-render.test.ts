import { createEditorDiagramMetadata } from "@editor/diagram-model"
import { getEditorDiagramRenderedSvg } from "@editor/diagram-presentation"
import { editorDiagramState } from "@editor/diagram-state"
import {
  createEditorDiagramStore,
  type EditorDiagramRenderers,
} from "@editor/diagram-store"
import {
  $createCodeNode,
  $isCodeNode,
  CodeHighlightNode,
  CodeNode,
} from "@lexical/code"
import { createHeadlessEditor } from "@lexical/headless"
import { withDOM } from "@lexical/headless/dom"
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $getState,
  $setState,
  createEditor,
} from "lexical"

const DOMParser = withDOM((window) => window.DOMParser)

const safeSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2 2"><path d="M0 0h2v2H0z"></path></svg>'

const previousParser = globalThis.DOMParser

interface DiagramSeed {
  kind: "mermaid" | "plantuml" | "graphviz" | "flowchart"
  source: string
}

interface StoreOptions {
  autoRender?: boolean
  editable?: boolean
  renderers?: EditorDiagramRenderers
  selected?: boolean
}

function setup(diagrams: DiagramSeed[], options: StoreOptions = {}) {
  const editor = createEditor({
    namespace: "editor-diagram-auto-render",
    nodes: [CodeNode, CodeHighlightNode],
    onError(error) {
      throw error
    },
  })

  editor.update(
    () => {
      for (const diagram of diagrams) {
        const code = $createCodeNode(diagram.kind)
        $setState(
          code,
          editorDiagramState,
          createEditorDiagramMetadata(diagram.kind, "image"),
        )
        code.append($createTextNode(diagram.source))
        $getRoot().append(code)
      }

      $getRoot().append(
        $createParagraphNode().append($createTextNode("outside")),
      )

      if (options.selected)
        $getRoot().getFirstChildOrThrow<CodeNode>().selectStart()
      else $getRoot().getLastChildOrThrow().selectEnd()
    },
    { discrete: true },
  )
  withDOM((window) => {
    editor.setRootElement(window.document.createElement("div"))
  })

  if (options.editable === false) editor.setEditable(false)

  const store = createEditorDiagramStore(editor, {
    autoRender: options.autoRender,
    renderers: options.renderers,
  })

  const unsubscribe = store.subscribe(() => undefined)

  return { editor, store, unsubscribe }
}

async function waitFor(predicate: () => boolean) {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    if (predicate()) return
    await new Promise<void>((resolve) => setTimeout(resolve, 5))
  }

  throw new Error("Diagram auto-render condition did not settle.")
}

beforeEach(() => {
  Reflect.set(globalThis, "DOMParser", DOMParser)
})

afterEach(() => {
  Reflect.set(globalThis, "DOMParser", previousParser)
})

describe("editor diagram automatic rendering", () => {
  test("keeps automatic rendering opt-in and requires a configured renderer", async () => {
    let calls = 0

    const renderers = {
      mermaid() {
        calls += 1

        return safeSvg
      },
    }

    const disabled = setup([{ kind: "mermaid", source: "graph TD; A-->B" }], {
      renderers,
    })

    try {
      await new Promise<void>((resolve) => setTimeout(resolve, 20))
      expect(calls).toBe(0)
      expect(disabled.store.getAutoRenderSnapshot().busy).toBe(false)
    } finally {
      disabled.unsubscribe()
    }

    const unconfigured = setup(
      [{ kind: "graphviz", source: "digraph { a -> b }" }],
      { autoRender: true, renderers },
    )

    try {
      await new Promise<void>((resolve) => setTimeout(resolve, 20))
      expect(calls).toBe(0)
      expect(unconfigured.store.getAutoRenderSnapshot().busy).toBe(false)
    } finally {
      unconfigured.unsubscribe()
    }
  })

  test("renders configured saved diagrams in read-only mode without Lexical writes", async () => {
    const calls: string[] = []

    const { editor, store, unsubscribe } = setup(
      [
        { kind: "mermaid", source: "graph TD; A-->B" },
        { kind: "graphviz", source: "digraph { a -> b }" },
        { kind: "mermaid", source: "graph TD; C-->D" },
      ],
      {
        autoRender: true,
        editable: false,
        renderers: {
          mermaid: ({ source }) => {
            calls.push(source)

            return safeSvg
          },
        },
      },
    )

    const before = JSON.stringify(editor.getEditorState())

    const selection = editor
      .getEditorState()
      .read(() => $getSelection()?.clone())

    try {
      await waitFor(
        () => calls.length === 2 && !store.getAutoRenderSnapshot().busy,
      )
      expect(calls).toEqual(["graph TD; A-->B", "graph TD; C-->D"])
      expect(editor.isEditable()).toBe(false)
      expect(JSON.stringify(editor.getEditorState())).toBe(before)
      editor.getEditorState().read(() => {
        expect($getSelection()?.is(selection ?? null)).toBe(true)
        const codes = $getRoot().getChildren().filter($isCodeNode)
        expect(codes).toHaveLength(3)

        for (const code of codes) {
          const metadata = $getState(code, editorDiagramState)

          if (!metadata) throw new Error("Expected diagram metadata.")
          expect(metadata.kind).toBe(
            code.getLanguage() === "mermaid" ? "mermaid" : "graphviz",
          )

          if (metadata.kind === "mermaid")
            expect(
              getEditorDiagramRenderedSvg(
                editor,
                code.getKey(),
                code.getTextContent(),
                metadata.kind,
              ),
            ).toBe(safeSvg)
          else
            expect(
              getEditorDiagramRenderedSvg(
                editor,
                code.getKey(),
                code.getTextContent(),
                metadata.kind,
              ),
            ).toBeUndefined()
        }
      })
    } finally {
      unsubscribe()
    }
  })

  test("does not register DOM rendering in a headless editor", async () => {
    let calls = 0

    const editor = createHeadlessEditor({
      namespace: "headless-diagram-auto-render",
      nodes: [CodeNode, CodeHighlightNode],
      onError(cause) {
        throw cause
      },
    })

    editor.update(
      () => {
        const code = $createCodeNode("mermaid")
        $setState(
          code,
          editorDiagramState,
          createEditorDiagramMetadata("mermaid", "image"),
        )
        code.append($createTextNode("graph TD; A-->B"))
        $getRoot().append(code)
      },
      { discrete: true },
    )

    const store = createEditorDiagramStore(editor, {
      autoRender: true,
      renderers: {
        mermaid() {
          calls += 1

          return safeSvg
        },
      },
    })

    const unsubscribe = store.subscribe(() => undefined)

    try {
      await new Promise<void>((resolve) => setTimeout(resolve, 20))
      expect(calls).toBe(0)
      expect(store.getAutoRenderSnapshot().busy).toBe(false)
    } finally {
      unsubscribe()
    }
  })

  test.each([false, true])(
    "publishes completion for a retained selected target (failure: %s)",
    async (fails) => {
      const { store, unsubscribe } = setup(
        [{ kind: "mermaid", source: "graph TD; A-->B" }],
        {
          autoRender: true,
          selected: true,
          renderers: {
            mermaid() {
              if (fails)
                return Promise.reject(new Error("Configured renderer failed."))

              return safeSvg
            },
          },
        },
      )

      try {
        await waitFor(() => !store.getAutoRenderSnapshot().busy)
        expect(store.getRenderSnapshot().status).toBe(fails ? "error" : "ready")

        if (fails) expect(store.getDownload()).toBeNull()
        else expect(store.getDownload()?.svg).toBe(safeSvg)
      } finally {
        unsubscribe()
      }
    },
  )

  test("bounds active renders and keeps its pending queue bounded", async () => {
    const diagrams = Array.from({ length: 20 }, (_, index) => ({
      kind: "mermaid" as const,
      source: `graph TD; node${index}-->end${index}`,
    }))

    let active = 0
    let peakActive = 0
    const started = new Set<string>()
    const releases: (() => void)[] = []

    const { store, unsubscribe } = setup(diagrams, {
      autoRender: true,
      renderers: {
        mermaid: ({ source }) => {
          active += 1
          peakActive = Math.max(peakActive, active)
          started.add(source)

          return new Promise((resolve) => {
            releases.push(() => {
              active -= 1
              resolve(safeSvg)
            })
          })
        },
      },
    })

    try {
      await waitFor(() => releases.length === 2)
      expect(peakActive).toBe(2)
      expect(store.getAutoRenderSnapshot().queued).toBeLessThanOrEqual(16)

      while (active > 0 || started.size < diagrams.length) {
        await waitFor(() => releases.length > 0)
        releases.shift()?.()
      }

      await waitFor(() => !store.getAutoRenderSnapshot().busy)
      expect(started.size).toBe(diagrams.length)
      expect(peakActive).toBeLessThanOrEqual(2)
    } finally {
      for (const release of releases) release()
      unsubscribe()
    }
  })

  test("publishes background status only for the matching selected target", async () => {
    let finish: ((svg: string) => void) | undefined

    const { editor, store, unsubscribe } = setup(
      [{ kind: "mermaid", source: "graph TD; A-->B" }],
      {
        autoRender: true,
        selected: true,
        renderers: {
          mermaid: () =>
            new Promise((resolve) => {
              finish = resolve
            }),
        },
      },
    )

    try {
      await waitFor(() => finish !== undefined)
      expect(store.getRenderSnapshot().status).toBe("loading")
      editor.update(
        () => {
          $getRoot().getLastChildOrThrow().selectEnd()
        },
        { discrete: true },
      )
      finish?.(safeSvg)
      await waitFor(() => !store.getAutoRenderSnapshot().busy)
      expect(store.getRenderSnapshot().status).toBe("idle")
      expect(store.getDownload()).toBeNull()
      editor.getEditorState().read(() => {
        expect($getRoot().getLastChildOrThrow().getTextContent()).toBe(
          "outside",
        )
        expect($getSelection()?.getTextContent()).toBe("")
      })
    } finally {
      unsubscribe()
    }
  })

  test("cancels changed, removed, and unmounted targets and ignores late results", async () => {
    const signals: AbortSignal[] = []
    const releases: ((svg: string) => void)[] = []

    const { editor, store, unsubscribe } = setup(
      [{ kind: "mermaid", source: "graph TD; A-->B" }],
      {
        autoRender: true,
        renderers: {
          mermaid: ({ signal }) => {
            signals.push(signal)

            return new Promise((resolve) => {
              releases.push(resolve)
            })
          },
        },
      },
    )

    try {
      await waitFor(() => signals.length === 1)
      editor.update(
        () => {
          const code = $getRoot().getFirstChildOrThrow<CodeNode>()
          code.clear()
          code.append($createTextNode("graph TD; A-->C"))
        },
        { discrete: true },
      )
      await waitFor(() => signals.length === 2)
      expect(signals[0]?.aborted).toBe(true)
      releases[0]?.(safeSvg)
      releases[1]?.(safeSvg)
      await waitFor(() => !store.getAutoRenderSnapshot().busy)
      editor.getEditorState().read(() => {
        const code = $getRoot().getFirstChildOrThrow<CodeNode>()
        expect(
          getEditorDiagramRenderedSvg(
            editor,
            code.getKey(),
            "graph TD; A-->C",
            "mermaid",
          ),
        ).toBe(safeSvg)
        expect(
          getEditorDiagramRenderedSvg(
            editor,
            code.getKey(),
            "graph TD; A-->B",
            "mermaid",
          ),
        ).toBeUndefined()
      })

      editor.update(
        () => {
          const code = $getRoot().getFirstChildOrThrow<CodeNode>()
          code.clear()
          code.append($createTextNode("graph TD; C-->D"))
        },
        { discrete: true },
      )
      await waitFor(() => signals.length === 3)
      const removedSignal = signals[2]
      editor.update(() => $getRoot().getFirstChildOrThrow().remove(), {
        discrete: true,
      })
      await waitFor(() => removedSignal?.aborted === true)
      releases[2]?.(safeSvg)
      await new Promise<void>((resolve) => setTimeout(resolve, 10))

      editor.update(
        () => {
          const code = $createCodeNode("mermaid")
          $setState(
            code,
            editorDiagramState,
            createEditorDiagramMetadata("mermaid", "image"),
          )
          code.append($createTextNode("graph TD; E-->F"))
          $getRoot().append(code)
        },
        { discrete: true },
      )
      await waitFor(() => signals.length === 4)
      unsubscribe()
      expect(signals[3]?.aborted).toBe(true)
      releases[3]?.(safeSvg)
      await new Promise<void>((resolve) => setTimeout(resolve, 10))
      editor.getEditorState().read(() => {
        const code = $getRoot().getFirstChildOrThrow<CodeNode>()
        expect(
          getEditorDiagramRenderedSvg(
            editor,
            code.getKey(),
            code.getTextContent(),
            "mermaid",
          ),
        ).toBeUndefined()
      })
    } finally {
      unsubscribe()
    }
  })
})
