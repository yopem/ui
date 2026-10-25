import {
  assertFlowchartSourcePolicy,
  assertMermaidSourcePolicy,
  assertPlantUmlSourcePolicy,
} from "@editor/diagram-renderers/source-policy"
import { describe, expect, test } from "bun:test"

describe("diagram source controls", () => {
  test.each(["\u0000", "\u0001", "\v", "\f", "\uD800"])(
    "rejects unsupported source controls %j",
    (control) => {
      for (const validate of [
        assertMermaidSourcePolicy,
        assertPlantUmlSourcePolicy,
        assertFlowchartSourcePolicy,
      ])
        expect(() => validate(`${control}!include remote`)).toThrow()
    },
  )
})

describe("Mermaid source policy", () => {
  test.each([
    "%%{init: { theme: 'dark', securityLevel: 'loose' }}%%\nflowchart TD\nA --> B",
    "---\nconfig:\n  securityLevel: loose\n  themeCSS: '@import \\\"https://example.test/theme.css\\\"'\n---\nflowchart TD\nA --> B",
    "\uFEFF\n---\nconfig:\n  htmlLabels: true\n---\nflowchart TD\nA --> B",
    'flowchart TD\nA@{ img: "https://example.test/a.png", label: "Image" }',
    'flowchart TD\nA@{ img: "images/a.png", label: "Image" }',
    'flowchart TD\nA --> B\nstyle A fill: URL ("https://example.test/a.svg")',
    "flowchart TD\nA --> B\nstyle A fill: red",
    'flowchart TD\nA["![remote](https://example.test/a.png)"] --> B',
    'flowchart TD\nA["<img src=\\"https://example.test/a.png\\">"] --> B',
  ])("rejects unsafe config or resource syntax: %s", (source) => {
    expect(() => assertMermaidSourcePolicy(source)).toThrow()
  })

  test.each([
    "flowchart LR\nA[Image processing] --> B[100% complete]",
    "sequenceDiagram\nAlice->>Bob: Read https://example.test as text",
  ])("accepts local Mermaid syntax: %s", (source) => {
    expect(() => assertMermaidSourcePolicy(source)).not.toThrow()
  })
})

describe("PlantUML source policy", () => {
  test.each([
    "@startuml\n!include common.puml\n@enduml",
    "@startuml\n!includeurl https://example.test/common.puml\n@enduml",
    "@startuml\n!include <C4/C4_Context>\n@enduml",
    "@startuml\n!theme blueprint\n@enduml",
    "@startuml\n!import /tmp/theme.zip\n@enduml",
    "@startuml\n!pragma layout smetana\n@enduml",
    "@startuml\n!define REMOTE !includeurl https://example.test/a.puml\n@enduml",
    "@startuml\n!function $load($path)\n!return %load_yaml($path)\n!endfunction\n@enduml",
    "@startuml\n!$path = 'https://example.test/a.puml'\n@enduml",
  ])("rejects preprocessor and resource directives: %s", (source) => {
    expect(() => assertPlantUmlSourcePolicy(source)).toThrow()
  })

  test.each([
    '@startuml\nAlice -> Bob : %load_json("https://example.test/data.json")\n@enduml',
    '@startuml\nAlice -> Bob : %load_yaml("data.yml")\n@enduml',
    '@startuml\nAlice -> Bob : %getenv("HOME")\n@enduml',
    '@startuml\nAlice -> Bob : %file_exists("/private/data")\n@enduml',
    '@startuml\nAlice -> Bob : %call_user_func("load", "data.json")\n@enduml',
    '@startuml\nAlice -> Bob : %invoke_procedure("$loader")\n@enduml',
    '@startuml\nAlice -> Bob : %get_variable_value("$loader")\n@enduml',
    "@startuml\nAlice -> Bob : <img:https://example.test/a.png>\n@enduml",
    "@startuml\nAlice -> Bob : <img:local.png>\n@enduml",
    "@startuml\nskinparam backgroundColor url(https://example.test/a.svg)\n@enduml",
  ])("rejects preprocessor functions or external resources: %s", (source) => {
    expect(() => assertPlantUmlSourcePolicy(source)).toThrow()
  })

  test.each([
    "@startuml\nAlice -> Bob : 100% done!\n@enduml",
    "@startuml\nAlice -> Bob : [[https://example.test/page]]\n@enduml",
  ])("accepts ordinary text and links: %s", (source) => {
    expect(() => assertPlantUmlSourcePolicy(source)).not.toThrow()
  })
})

describe("Flowchart.js source policy", () => {
  test.each([
    'st=>start: Start\ne=>end: Finish\nst@>e({"stroke":"url(https://example.test/a.svg)"})',
    'st=>start: Start\ne=>end: Finish\nst->e\nst@>e({"stroke":"red"})',
    "st=>start: Start:$runAction\ne=>end: Finish\nst->e",
  ])("rejects style or callback directives: %s", (source) => {
    expect(() => assertFlowchartSourcePolicy(source)).toThrow()
  })

  test.each([
    "st=>start: Start\ncond=>condition: Ready?\ne=>end: Finish\nst->cond\ncond(yes)->e",
    "st=>start: Start:>https://example.test/page\ne=>end: Finish\nst->e",
  ])(
    "accepts local syntax and links for downstream SVG sanitization: %s",
    (source) => {
      expect(() => assertFlowchartSourcePolicy(source)).not.toThrow()
    },
  )
})
