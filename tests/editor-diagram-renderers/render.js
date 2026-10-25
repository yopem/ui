import { createEditorDiagramMetadata } from "@editor/diagram-model"
import { renderEditorDiagram } from "@editor/diagram-render"
import { editorDiagramFlowchartRenderer } from "@editor/diagram-renderers/flowchart.browser"
import { editorDiagramGraphvizRenderer } from "@editor/diagram-renderers/graphviz"
import { editorDiagramMermaidRenderer } from "@editor/diagram-renderers/mermaid.browser"
import { editorDiagramPlantUmlRenderer } from "@editor/diagram-renderers/plantuml.browser"

const examples = [
  {
    kind: "mermaid",
    source: "flowchart LR\n A[Mermaid Start] --> B[Mermaid Finish]",
    label: "Mermaid Start",
    renderer: editorDiagramMermaidRenderer,
  },
  {
    kind: "plantuml",
    source: "@startuml\nAlice -> Bob : PlantUML Hello\n@enduml",
    label: "PlantUML Hello",
    renderer: editorDiagramPlantUmlRenderer,
  },
  {
    kind: "graphviz",
    source: 'digraph G { "Graphviz Start" -> "Graphviz Finish" }',
    label: "Graphviz Start",
    renderer: editorDiagramGraphvizRenderer,
  },
  {
    kind: "flowchart",
    source: "st=>start: Flowchart Start\ne=>end: Flowchart Finish\nst->e",
    label: "Flowchart Start",
    renderer: editorDiagramFlowchartRenderer,
  },
]

const result = document.querySelector("#result")

if (!result) throw new Error("Renderer test output is missing.")

async function renderAll() {
  const completed = []

  for (const example of examples) {
    const svg = await renderEditorDiagram(
      {
        diagram: createEditorDiagramMetadata(example.kind),
        source: example.source,
        signal: new AbortController().signal,
        deadlineAt: Date.now() + 30_000,
      },
      example.renderer,
    )

    const parsed = new DOMParser().parseFromString(svg, "image/svg+xml")
    const label = parsed.documentElement.textContent ?? ""

    if (!label.includes(example.label))
      throw new Error(`${example.kind} did not render its source label.`)

    completed.push(`${example.kind}:pass`)
  }

  for (const source of [
    'flowchart TD\nA@{ img: "https://example.invalid/image.png", label: "Remote" }',
    '%%{init: {"themeCSS":"@import url(https://example.invalid/theme.css);"}}%%\nflowchart TD\nA',
  ]) {
    try {
      await editorDiagramMermaidRenderer({
        diagram: createEditorDiagramMetadata("mermaid"),
        source,
        signal: new AbortController().signal,
        deadlineAt: Date.now() + 30_000,
      })
      throw new Error("Mermaid resource reference was accepted.")
    } catch (error) {
      if (
        !(error instanceof Error) ||
        error.message !== "Diagram source uses unsupported resource references."
      )
        throw error
    }
  }

  try {
    await renderEditorDiagram(
      {
        diagram: createEditorDiagramMetadata("flowchart"),
        source:
          "st=>start: Flowchart Start:>https://example.invalid\ne=>end: Finish\nst->e",
        signal: new AbortController().signal,
        deadlineAt: Date.now() + 30_000,
      },
      editorDiagramFlowchartRenderer,
    )
    throw new Error("Flowchart external link passed SVG sanitization.")
  } catch (error) {
    if (
      !(error instanceof Error) ||
      ![
        "Diagram SVG contains unsupported content.",
        "Diagram SVG contains an unsafe attribute.",
      ].includes(error.message)
    )
      throw error
  }

  try {
    await editorDiagramPlantUmlRenderer({
      diagram: createEditorDiagramMetadata("plantuml"),
      source:
        "@startuml\n!includeurl https://example.invalid/library.puml\n@enduml",
      signal: new AbortController().signal,
      deadlineAt: Date.now() + 30_000,
    })
    throw new Error("PlantUML resource directive was accepted.")
  } catch (error) {
    if (
      !(error instanceof Error) ||
      error.message !== "Diagram source uses unsupported resource directives."
    )
      throw error
  }

  try {
    editorDiagramFlowchartRenderer({
      diagram: createEditorDiagramMetadata("flowchart"),
      source:
        'st=>start: Start\ne=>end: Finish\nst->e@>{"stroke":"url(https://example.invalid/paint.svg)"}',
      signal: new AbortController().signal,
      deadlineAt: Date.now() + 30_000,
    })
    throw new Error("Flowchart style directive was accepted.")
  } catch (error) {
    if (
      !(error instanceof Error) ||
      error.message !== "Flowchart source uses unsupported style directives."
    )
      throw error
  }

  completed.push("resource-policy:pass")
  result.textContent = completed.join(", ")
}

void renderAll().catch((error) => {
  result.textContent =
    error instanceof Error ? `error: ${error.message}` : "error: unknown"
})
