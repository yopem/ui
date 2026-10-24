import { $insertNodeToNearestRoot } from "@lexical/utils"
import {
  $addUpdateTag,
  $getEditor,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $setSelection,
  $isNodeSelection,
  $createParagraphNode,
  $isRangeSelection,
  HISTORY_PUSH_TAG,
  createCommand,
  type LexicalCommand,
  type NodeKey,
} from "lexical"

import { editorFootnoteIdSchema, nextEditorFootnoteId } from "./footnote-model"
import {
  EditorFootnoteDefinitionNode,
  EditorFootnoteReferenceNode,
  $createEditorFootnoteDefinitionNode,
  $createEditorFootnoteReferenceNode,
} from "./footnote-node"
import {
  $getEditorFootnoteSnapshot,
  $getSelectedEditorFootnote,
} from "./footnote-state"

export interface EditorFootnoteInsertPayload {
  readonly identifier?: string
}

export const INSERT_EDITOR_FOOTNOTE_COMMAND: LexicalCommand<
  EditorFootnoteInsertPayload | undefined
> = createCommand("INSERT_EDITOR_FOOTNOTE_COMMAND")

export const REMOVE_EDITOR_FOOTNOTE_COMMAND: LexicalCommand<void> =
  createCommand("REMOVE_EDITOR_FOOTNOTE_COMMAND")

export interface EditorFootnoteRenumberPayload {
  readonly key?: NodeKey
}

export const RENUMBER_EDITOR_FOOTNOTE_DEFINITION_COMMAND: LexicalCommand<
  EditorFootnoteRenumberPayload | undefined
> = createCommand("RENUMBER_EDITOR_FOOTNOTE_DEFINITION_COMMAND")

export function $insertEditorFootnote(payload?: EditorFootnoteInsertPayload) {
  const editor = $getEditor()
  const selection = $getSelection()

  if (!editor.isEditable() || !$isRangeSelection(selection)) return false

  const snapshot = $getEditorFootnoteSnapshot()

  const identifiers = [
    ...snapshot.definitions.map((definition) => definition.identifier),
    ...snapshot.references.map((reference) => reference.identifier),
  ]

  const parsedIdentifier = payload?.identifier
    ? editorFootnoteIdSchema.safeParse(payload.identifier)
    : null

  if (payload?.identifier && !parsedIdentifier?.success) return false

  const identifier = parsedIdentifier?.success
    ? parsedIdentifier.data
    : nextEditorFootnoteId(identifiers)

  const hasDefinition = snapshot.definitions.some(
    (definition) => definition.identifier === identifier,
  )

  $addUpdateTag(HISTORY_PUSH_TAG)

  if (!hasDefinition) {
    const bookmark = selection.clone()
    const definition = $createEditorFootnoteDefinitionNode(identifier)
    definition.append($createParagraphNode())
    $insertNodeToNearestRoot(definition)
    $setSelection(bookmark)
  }

  const current = $getSelection()

  if (!$isRangeSelection(current)) return false
  current.insertNodes([$createEditorFootnoteReferenceNode(identifier)])

  return true
}

export function $removeSelectedEditorFootnote() {
  if (!$getEditor().isEditable()) return false
  const selected = $getSelectedEditorFootnote()

  if (!selected) return false
  const node = $getNodeByKey(selected.key)

  if (
    !(
      node instanceof EditorFootnoteReferenceNode ||
      node instanceof EditorFootnoteDefinitionNode
    )
  )
    return false

  $addUpdateTag(HISTORY_PUSH_TAG)
  node.selectPrevious()
  node.remove()

  return true
}

export function $removeEditorFootnoteFromKeyboard() {
  if (!$isNodeSelection($getSelection())) return false

  return $removeSelectedEditorFootnote()
}

export function $renumberEditorFootnoteDefinition(
  payload?: EditorFootnoteRenumberPayload,
) {
  if (!$getEditor().isEditable()) return false

  const target = payload?.key
    ? { key: payload.key }
    : $getSelectedEditorFootnote()

  const node = target ? $getNodeByKey(target.key) : null

  if (!(node instanceof EditorFootnoteDefinitionNode)) return false
  const snapshot = $getEditorFootnoteSnapshot()

  const definition = snapshot.definitions.find(
    (entry) => entry.key === node.getKey(),
  )

  if (!definition?.duplicate) return false

  const identifiers = [
    ...snapshot.definitions.map((entry) => entry.identifier),
    ...snapshot.references.map((entry) => entry.identifier),
  ]

  const identifier = nextEditorFootnoteId(identifiers)
  $addUpdateTag(HISTORY_PUSH_TAG)
  node.setIdentifier(identifier)

  return true
}

export function $appendEditorFootnoteDefinition(identifier: string) {
  const editor = $getEditor()

  if (!editor.isEditable()) return false

  const parsedIdentifier = editorFootnoteIdSchema.safeParse(identifier)

  if (!parsedIdentifier.success) return false

  const exists = $getEditorFootnoteSnapshot().definitions.some(
    (definition) => definition.identifier === parsedIdentifier.data,
  )

  if (exists) return false

  const node = $createEditorFootnoteDefinitionNode(parsedIdentifier.data)
  const paragraph = $createParagraphNode()
  node.append(paragraph)
  $getRoot().append(node)
  $addUpdateTag(HISTORY_PUSH_TAG)
  paragraph.selectStart()

  return true
}
