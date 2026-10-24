import {
  $getRoot,
  $getSelection,
  $isElementNode,
  $isNodeSelection,
  $isRangeSelection,
  type LexicalNode,
} from "lexical"
import { z } from "zod"

import {
  EDITOR_FOOTNOTE_DEFINITION_TYPE,
  EDITOR_FOOTNOTE_REFERENCE_TYPE,
  editorFootnoteIdSchema,
} from "./footnote-model"

const footnoteMetadataSchema = z.object({
  identifier: editorFootnoteIdSchema,
})

export interface EditorFootnoteReferenceEntry {
  readonly key: string
  readonly identifier: string
  readonly referenceIndex: number
  readonly number: number | null
  readonly definitionKey: string | null
}

export interface EditorFootnoteDefinitionEntry {
  readonly key: string
  readonly identifier: string
  readonly number: number
  readonly duplicate: boolean
  readonly preview: string
}

export interface EditorFootnoteSnapshot {
  readonly definitions: readonly EditorFootnoteDefinitionEntry[]
  readonly references: readonly EditorFootnoteReferenceEntry[]
}

export function $editorFootnoteIdentifier(node: LexicalNode) {
  if (
    node.getType() !== EDITOR_FOOTNOTE_REFERENCE_TYPE &&
    node.getType() !== EDITOR_FOOTNOTE_DEFINITION_TYPE
  )
    return null

  const parsed = footnoteMetadataSchema.safeParse(node.exportJSON())

  return parsed.success ? parsed.data.identifier : null
}

export function $getEditorFootnoteSnapshot(): EditorFootnoteSnapshot {
  const definitions: EditorFootnoteDefinitionEntry[] = []
  const references: { key: string; identifier: string }[] = []
  const pending: { node: LexicalNode; depth: number }[] = []

  for (const node of $getRoot().getChildren().reverse())
    pending.push({ node, depth: 1 })
  let count = 0

  while (pending.length > 0 && count < 10_000) {
    const entry = pending.pop()

    if (!entry || entry.depth > 64) continue
    count += 1

    const identifier = $editorFootnoteIdentifier(entry.node)

    if (identifier && entry.node.getType() === EDITOR_FOOTNOTE_REFERENCE_TYPE)
      references.push({ key: entry.node.getKey(), identifier })

    if (identifier && entry.node.getType() === EDITOR_FOOTNOTE_DEFINITION_TYPE)
      definitions.push({
        key: entry.node.getKey(),
        identifier,
        number: definitions.length + 1,
        duplicate: false,
        preview: entry.node
          .getTextContent()
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 160),
      })

    if ($isElementNode(entry.node))
      for (const child of entry.node.getChildren().reverse())
        pending.push({ node: child, depth: entry.depth + 1 })
  }

  const definitionGroups = new Map<string, EditorFootnoteDefinitionEntry[]>()

  for (const definition of definitions) {
    const group = definitionGroups.get(definition.identifier) ?? []
    group.push(definition)
    definitionGroups.set(definition.identifier, group)
  }

  const numberedDefinitions = definitions.map((definition) => ({
    ...definition,
    duplicate: (definitionGroups.get(definition.identifier)?.length ?? 0) > 1,
  }))

  const firstDefinition = new Map<string, EditorFootnoteDefinitionEntry>()

  for (const definition of numberedDefinitions)
    if (!firstDefinition.has(definition.identifier))
      firstDefinition.set(definition.identifier, definition)

  const referenceCounts = new Map<string, number>()

  const numberedReferences = references.map((reference) => {
    const index = referenceCounts.get(reference.identifier) ?? 0
    referenceCounts.set(reference.identifier, index + 1)
    const definition = firstDefinition.get(reference.identifier)

    return {
      ...reference,
      referenceIndex: index + 1,
      number: definition?.number ?? null,
      definitionKey: definition?.key ?? null,
    }
  })

  return { definitions: numberedDefinitions, references: numberedReferences }
}

export function $getSelectedEditorFootnote() {
  const selection = $getSelection()

  const selected = $isNodeSelection(selection)
    ? selection.getNodes()
    : $isRangeSelection(selection)
      ? selection.getNodes()
      : []

  for (const node of selected) {
    for (
      let current: LexicalNode | null = node;
      current;
      current = current.getParent()
    ) {
      const identifier = $editorFootnoteIdentifier(current)

      if (identifier)
        return {
          key: current.getKey(),
          identifier,
          kind:
            current.getType() === EDITOR_FOOTNOTE_REFERENCE_TYPE
              ? "reference"
              : "definition",
        } as const
    }
  }

  return null
}
