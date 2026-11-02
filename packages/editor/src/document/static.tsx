import type { RootContent } from "hast"
import type { CSSProperties, ReactNode } from "react"

import { Box } from "@registry/components/ui/box"
import { Separator } from "@registry/components/ui/separator"
import { createElement } from "react"
import { z } from "zod"

import {
  canonicalDocumentNode,
  documentMathChildren,
  safeDocumentStyle,
} from "./boundary"
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

const idReferences = new Map([
  ["ariaActiveDescendant", "aria-activedescendant"],
  ["ariaControls", "aria-controls"],
  ["ariaDescribedBy", "aria-describedby"],
  ["ariaDetails", "aria-details"],
  ["ariaErrorMessage", "aria-errormessage"],
  ["ariaFlowTo", "aria-flowto"],
  ["ariaLabelledBy", "aria-labelledby"],
  ["ariaOwns", "aria-owns"],
  ["htmlFor", "htmlFor"],
  ["headers", "headers"],
])

const prefixSchema = z
  .string()
  .regex(/^[A-Za-z](?:[A-Za-z0-9_]|-(?!-)){0,63}(?![\s\S])/)
  .optional()

function renderNode(
  node: RootContent,
  key: number,
  ariaLabel: string,
  idPrefix: string | undefined,
): ReactNode {
  if (node.type === "text") return node.value

  if (node.type !== "element") return null

  if (node.tagName === "hr") return <Separator key={key} render={<hr />} />
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
        (idPrefix === undefined ? undefined : idReferences.get(name)) ??
        (name.startsWith("data") || name.startsWith("aria")
          ? name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
          : name)

      const content = Array.isArray(value) ? value.join(" ") : value

      if (
        idPrefix !== undefined &&
        (name === "id" || name === "href" || idReferences.has(name))
      ) {
        const result = z.string().safeParse(content)

        if (result.success) {
          if (name === "id") {
            properties.set(attribute, `${idPrefix}--${result.data}`)
            continue
          }

          if (name === "href" && result.data.startsWith("#")) {
            properties.set(attribute, `#${idPrefix}--${result.data.slice(1)}`)
            continue
          }

          if (idReferences.has(name)) {
            properties.set(
              attribute,
              result.data.replace(/\S+/g, (id) => `${idPrefix}--${id}`),
            )
            continue
          }
        }
      }

      properties.set(attribute, content)
    }
  }

  if (node.tagName === "input") {
    properties.set("readOnly", true)
    properties.set(
      "aria-label",
      node.properties.checked ? "Completed task" : "Incomplete task",
    )
  }

  const canonical = canonicalDocumentNode(node)

  if (canonical?.type === "toc")
    properties.set(
      "aria-label",
      `${ariaLabel}: ${node.properties.ariaLabel ?? "Table of contents"}`,
    )

  const children =
    canonical?.type === "math"
      ? documentMathChildren(canonical.value)
      : node.children

  return createElement(
    node.tagName,
    Object.fromEntries(properties),
    ...children.map((child, index) =>
      renderNode(child, index, ariaLabel, idPrefix),
    ),
  )
}

export function DocumentStatic({
  html,
  idPrefix,
  "aria-label": ariaLabel = "Static document",
}: {
  html: string
  idPrefix?: string
  "aria-label"?: string
}) {
  const prefix = prefixSchema.parse(idPrefix)
  const editor = createDocumentEditor()

  try {
    const document = parseDocument(html, "html")
    editor.setEditorState(editor.parseEditorState(JSON.stringify(document)))

    const tree = editor.getEditorState().read(() => $exportTree(), { editor })

    return (
      <Box render={<section aria-label={ariaLabel} />}>
        {tree.children.map((child, index) =>
          renderNode(child, index, ariaLabel, prefix),
        )}
      </Box>
    )
  } finally {
    editor.dispose()
  }
}
