import { createEditorDiagramMetadata } from "@editor/diagram-model"
import {
  assertEditorDiagramRenderActive,
  renderEditorDiagram,
  sanitizeEditorDiagramSvg,
  type EditorDiagramRenderInput,
} from "@editor/diagram-render"
import { withDOM } from "@workspace/tests/fixtures/lexical-dom"
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

  test("accepts bounded inline diagram dimensions", () => {
    const svg = sanitizeEditorDiagramSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" style="max-width:360px;width:100%;height:56px"><path d="M0 0"/></svg>',
    )

    expect(svg).toContain('style="max-width:360px;width:100%;height:56px"')
  })

  test.each([
    "max-width:5000px",
    "width:url(https://example.test/diagram.svg)",
    "height:0",
  ])("rejects unsafe inline diagram dimensions: %s", (style) => {
    expect(() =>
      sanitizeEditorDiagramSvg(
        `<svg xmlns="http://www.w3.org/2000/svg" style="${style}"/>`,
      ),
    ).toThrow()
  })

  test("sanitizes bounded Mermaid CSS declarations and selectors", () => {
    const svg = sanitizeEditorDiagramSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" id="diagram" style="max-width:360px;width:100%;height:56px"><style>#diagram{--mermaid-font-family:"trebuchet ms",verdana,arial,sans-serif;}@keyframes dash{to{stroke-dashoffset:0;}}#diagram [data-look="neo"].node:not(.swimlane) path{fill:#fff!important;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#diagram .label-icon{height:1em;animation:dash 20s linear infinite;}</style><path class="node" d="M0 0"/></svg>',
    )

    expect(svg).toContain("@keyframes dash")
    expect(svg).toContain('data-look="neo"')
    expect(svg).toContain("stroke-dashoffset:0")
  })

  test("keeps scoped animations safe across repeated validation", () => {
    const source =
      '<svg xmlns="http://www.w3.org/2000/svg" id="diagram"><style>@keyframes dash{to{stroke-dashoffset:0;}}#diagram .edge{animation:dash 20s linear infinite;}</style><path class="edge" d="M0 0"/></svg>'

    const svg = sanitizeEditorDiagramSvg(source)

    expect(svg).toContain("@media (prefers-reduced-motion: reduce)")
    expect(svg).toContain("#diagram *{animation:none!important}")
    expect(svg).not.toContain("{svg *{")
    expect(sanitizeEditorDiagramSvg(svg)).toBe(svg)
  })

  test("bounds CSS shadows at the native filter limit", () => {
    const svg = sanitizeEditorDiagramSvg(
      '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0" style="filter:drop-shadow(64px 64px 64px rgba(255, 255, 255, 1))"/></svg>',
    )

    expect(svg).toContain("drop-shadow(64px 64px 64px")
    expect(() =>
      sanitizeEditorDiagramSvg(
        '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0" filter="drop-shadow(64px 64px 64px rgba(255, 255, 255, 1))"/></svg>',
      ),
    ).not.toThrow()
  })

  test.each([
    "drop-shadow(65px 0px 0px rgba(0, 0, 0, 1))",
    "drop-shadow(0px 65px 0px rgba(0, 0, 0, 1))",
    "drop-shadow(0px 0px 999999999999px rgba(0, 0, 0, 1))",
    "drop-shadow(0px 0px 1px rgba(256, 0, 0, 1))",
  ])("rejects out-of-budget CSS shadows: %s", (filter) => {
    expect(() =>
      sanitizeEditorDiagramSvg(
        `<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0" style="filter:${filter}"/></svg>`,
      ),
    ).toThrow()
    expect(() =>
      sanitizeEditorDiagramSvg(
        `<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0" filter="${filter}"/></svg>`,
      ),
    ).toThrow()
  })

  test("retains the CSS byte bound after animation scoping", () => {
    const id = `diagram${"x".repeat(80)}`
    const styles = ".edge{animation:dash 20s linear infinite;}".repeat(300)

    expect(() =>
      sanitizeEditorDiagramSvg(
        `<svg xmlns="http://www.w3.org/2000/svg" id="${id}"><style>${styles}</style></svg>`,
      ),
    ).toThrow("Diagram SVG style data exceeds the size limit.")
  })

  test("makes bounded duplicate PlantUML message IDs unique", () => {
    const source = `<svg xmlns="http://www.w3.org/2000/svg">${'<g id="msg1" class="message"/>'.repeat(1000)}</svg>`
    const svg = sanitizeEditorDiagramSvg(source)
    const document = new DOMParser().parseFromString(svg, "image/svg+xml")
    const ids = Array.from(document.querySelectorAll("g"), (node) => node.id)

    expect(ids).toHaveLength(1000)
    expect(new Set(ids).size).toBe(1000)
    expect(ids.at(-1)).toBe("msg1-1000")
  })

  test.each([
    '<svg xmlns="http://www.w3.org/2000/svg" id="diagram"><style>@keyframes dash-other{to{stroke-dashoffset:0;}}</style></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg" id="diagram"><style>@media (prefers-reduced-motion: reduce){svg *{position:absolute;}}</style></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg" id="diagram"><style>@keyframes unsafe{to{opacity:1;}}</style></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg" id="diagram"><style>#diagram path{animation:unsafe 10s linear infinite;}</style></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg" id="diagram"><style>#diagram path{fill:url(https://example.test/paint.svg);}</style></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg" id="diagram"><style>#diagram path{fill:url(#missing);}</style></svg>',
  ])("rejects unsupported Mermaid CSS: %s", (svg) => {
    expect(() => sanitizeEditorDiagramSvg(svg)).toThrow()
  })

  test("keeps the CSS size limit", () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg"><style>${"x".repeat(32_769)}</style></svg>`

    expect(() => sanitizeEditorDiagramSvg(svg)).toThrow(
      "Diagram SVG style data exceeds the size limit.",
    )
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

  test("rejects an aborted request before calling its renderer", async () => {
    const controller = new AbortController()
    controller.abort()
    let called = false

    const rejected = await renderEditorDiagram(
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
    ).catch((cause: unknown) => cause)

    expect(rejected).toBeInstanceOf(Error)
    expect(called).toBe(false)
  })

  test("discards an async response after cancellation", async () => {
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

    const rejected = await pending.catch((cause: unknown) => cause)

    expect(rejected).toBeInstanceOf(Error)
  })

  test("bounds source and renderer output before use", async () => {
    const rejected = await renderEditorDiagram(
      {
        diagram: createEditorDiagramMetadata("flowchart"),
        source: "x".repeat(200_000),
        signal: new AbortController().signal,
        deadlineAt: Date.now() + 1_000,
      },
      () => safeSvg,
    ).catch((cause: unknown) => cause)

    expect(rejected).toBeInstanceOf(Error)
    expect(() => sanitizeEditorDiagramSvg("x".repeat(2_100_000))).toThrow()
  })
})
