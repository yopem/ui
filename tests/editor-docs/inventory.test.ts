import { componentDocs } from "@registry/docs"
import { editorParts } from "@workspace/apps/docs/src/catalog/editor-parts"
import { expect, test } from "bun:test"

test("public React editor parts have one documentation page", () => {
  const published = componentDocs
    .filter((item) => item.name === "editor" || item.name.startsWith("editor-"))
    .flatMap((item) =>
      item.parts
        .filter((part) => part.kind === "component")
        .map((part) => ({ name: part.name, item: item.name })),
    )

  const documentedNames: string[] = editorParts.map((part) => part.name)

  expect(documentedNames.sort()).toEqual(
    published.map((part) => part.name).sort(),
  )
  expect(new Set(editorParts.map((part) => part.slug)).size).toBe(
    editorParts.length,
  )

  for (const part of editorParts) {
    expect(published.find((entry) => entry.name === part.name)?.item).toBe(
      part.item,
    )
    expect(part.description.length).toBeGreaterThan(0)
  }
})
