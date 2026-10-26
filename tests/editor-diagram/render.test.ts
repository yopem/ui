import { createEditorDiagramMetadata } from "@editor/diagram-model"
import {
  assertEditorDiagramRenderActive,
  renderEditorDiagram,
  sanitizeEditorDiagramSvg,
  type EditorDiagramRenderInput,
} from "@editor/diagram-render"
import { withDOM } from "@lexical/headless/dom"
import { afterEach, beforeEach, describe, expect, test } from "bun:test"

const DOMParser = withDOM((window) => window.DOMParser)

const safeSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M2 2h20v20H2z" fill="#fff" stroke="#111"/><text x="4" y="12">Ready</text></svg>'

const previousParser = globalThis.DOMParser

beforeEach(() => {
  Reflect.set(globalThis, "DOMParser", DOMParser)
})

afterEach(() => {
  Reflect.set(globalThis, "DOMParser", previousParser)
})

describe("editor diagram rendering", () => {
  test("checks cancellation and wall-clock budgets before SDK dispatch", () => {
    const signal = new AbortController().signal
    expect(() =>
      assertEditorDiagramRenderActive(signal, Date.now() + 60000),
    ).not.toThrow()
    expect(() =>
      assertEditorDiagramRenderActive(AbortSignal.abort(), Date.now() + 60000),
    ).toThrow()

    for (const deadline of [0, NaN, Infinity, Date.now() + 0.5])
      expect(() => assertEditorDiagramRenderActive(signal, deadline)).toThrow()
  })

  test("observes renderer rejection when dispatch cancels its request", async () => {
    const controller = new AbortController()

    const pending = renderEditorDiagram(
      {
        diagram: createEditorDiagramMetadata("mermaid"),
        source: "flowchart LR\nA --> B",
        signal: controller.signal,
        deadlineAt: Date.now() + 1000,
      },
      () => {
        controller.abort("cancelled")

        return Promise.reject(new Error("SDK dispatch rejected."))
      },
    )

    let rejection: unknown

    try {
      await pending
    } catch (cause) {
      rejection = cause
    }

    expect(rejection).toBeInstanceOf(Error)
    await new Promise<void>((resolve) => setTimeout(resolve, 0))
  })

  test("sanitizes an SVG document without changing its diagram text", () => {
    const svg = sanitizeEditorDiagramSvg(safeSvg)

    expect(svg).toContain("<svg")
    expect(svg).toContain("<text")
    expect(svg).toContain("Ready")
  })

  test.each([
    '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg"><image href="https://evil.test/a.png"/></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg"><path onload="alert(1)" d="M0 0"/></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg"><style>@import url(https://evil.test/a.css)</style></svg>',
    '<!DOCTYPE svg><svg xmlns="http://www.w3.org/2000/svg"/>',
  ])("rejects unsafe SVG: %s", (svg) => {
    expect(() => sanitizeEditorDiagramSvg(svg)).toThrow()
  })

  test("passes bounded native source and a deadline signal to configured renderers", async () => {
    const input: EditorDiagramRenderInput = {
      diagram: createEditorDiagramMetadata("mermaid"),
      source: "graph TD; A-->B",
      signal: new AbortController().signal,
      deadlineAt: Date.now() + 1_000,
    }

    const receivedSignals: AbortSignal[] = []

    const svg = await renderEditorDiagram(input, (request) => {
      receivedSignals.push(request.signal)
      expect(request.diagram.kind).toBe("mermaid")
      expect(request.source).toBe(input.source)

      return safeSvg
    })

    expect(receivedSignals[0]?.aborted).toBe(false)
    expect(svg).toContain("<svg")
  })

  test("rejects an aborted request before calling its renderer", () => {
    const controller = new AbortController()
    controller.abort()
    let called = false

    expect(
      renderEditorDiagram(
        {
          diagram: createEditorDiagramMetadata("graphviz"),
          source: "digraph { a -> b }",
          signal: controller.signal,
          deadlineAt: Date.now() + 1_000,
        },
        () => {
          called = true

          return safeSvg
        },
      ),
    ).rejects.toThrow()

    expect(called).toBe(false)
  })

  test("discards an async response after cancellation", () => {
    const controller = new AbortController()
    let finish: ((value: string) => void) | undefined

    const pending = renderEditorDiagram(
      {
        diagram: createEditorDiagramMetadata("plantuml"),
        source: "@startuml\nAlice -> Bob\n@enduml",
        signal: controller.signal,
        deadlineAt: Date.now() + 1_000,
      },
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )

    controller.abort()
    finish?.(safeSvg)

    expect(pending).rejects.toThrow()
  })

  test("bounds source and renderer output before use", () => {
    expect(
      renderEditorDiagram(
        {
          diagram: createEditorDiagramMetadata("flowchart"),
          source: "x".repeat(200_000),
          signal: new AbortController().signal,
          deadlineAt: Date.now() + 1_000,
        },
        () => safeSvg,
      ),
    ).rejects.toThrow()

    expect(() => sanitizeEditorDiagramSvg("x".repeat(2_100_000))).toThrow()
  })
})
