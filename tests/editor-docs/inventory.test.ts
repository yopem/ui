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

  const documentedNames = editorParts
    .filter((part) => /^[A-Z]/.test(part.name))
    .map((part) => part.name)

  expect(published.map((part) => part.name).sort()).toEqual(
    documentedNames.sort(),
  )
  expect(new Set(editorParts.map((part) => part.slug)).size).toBe(
    editorParts.length,
  )

  for (const part of editorParts) {
    const item = componentDocs.find((entry) => entry.name === part.item)

    expect(item?.parts.some((entry) => entry.name === part.name)).toBe(true)
    expect(part.description.length).toBeGreaterThan(0)
  }
})

test("editor API distinguishes extension factories from React components", () => {
  const collaboration = componentDocs.find(
    (item) => item.name === "editor-collaboration",
  )

  const extension = collaboration?.parts.find(
    (part) => part.name === "EditorCollaborationExtension",
  )

  const card = componentDocs.find(
    (item) => item.name === "editor-editable-card",
  )

  expect(extension?.kind).toBe("function")
  expect(
    card?.parts.filter(
      (part) => part.name === "EditorEditableCardInsertButton",
    ),
  ).toHaveLength(1)
  expect(
    card?.parts.some((part) => part.name === "EditorEditableCardView"),
  ).toBe(false)
})
