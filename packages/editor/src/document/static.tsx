import type { RootContent } from "hast"
import type { CSSProperties, ReactNode } from "react"

import { Box } from "@registry/components/ui/box"
import { createElement } from "react"

import { safeDocumentStyle } from "./boundary"
import { $exportTree, createDocumentEditor } from "./convert"
import { parseDocument } from "./index"

type StaticProperties = Record<
  string,
  | string
  | number
  | boolean
  | readonly (string | number)[]
  | CSSProperties
  | null
  | undefined
>

function renderNode(node: RootContent, key: number): ReactNode {
  if (node.type === "text") return node.value

  if (node.type !== "element") return null
  const properties = new Map<string, StaticProperties[string]>([["key", key]])

  for (const [name, value] of Object.entries(node.properties)) {
    if (name === "style") {
      const declarations = safeDocumentStyle(String(value))
        .split(";")
        .filter(Boolean)
        .map((declaration) => {
          const [property, content] = declaration.split(":")

          return [
            property
              ?.trim()
              .replace(/-([a-z])/g, (_, letter: string) =>
                letter.toUpperCase(),
              ),
            content?.trim(),
          ]
        })

      const style: CSSProperties = Object.fromEntries(declarations)
      properties.set("style", style)
    } else {
      const attribute =
        name.startsWith("data") || name.startsWith("aria")
          ? name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
          : name

      properties.set(attribute, Array.isArray(value) ? value.join(" ") : value)
    }
  }

  if (node.tagName === "input") {
    properties.set("readOnly", true)
    properties.set(
      "aria-label",
      node.properties.checked ? "Completed task" : "Incomplete task",
    )
  }

  return createElement(
    node.tagName,
    Object.fromEntries(properties),
    ...node.children.map(renderNode),
  )
}

export function DocumentStatic({
  html,
  "aria-label": ariaLabel = "Static document",
}: {
  html: string
  "aria-label"?: string
}) {
  const editor = createDocumentEditor()
  const document = parseDocument(html, "html")
  editor.setEditorState(editor.parseEditorState(JSON.stringify(document)))

  const tree = editor.getEditorState().read(() => $exportTree(), { editor })

  return (
    <Box render={<section aria-label={ariaLabel} />}>
      {tree.children.map(renderNode)}
    </Box>
  )
}
