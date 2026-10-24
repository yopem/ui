import type { LexicalEditor, NodeKey } from "lexical"

import { createEditorTocHeadingId } from "./toc-model"

const editorScopes = new WeakMap<LexicalEditor, string>()

let nextEditorScope = 0

export function getEditorTocScope(editor: LexicalEditor) {
  const existing = editorScopes.get(editor)

  if (existing) return existing

  if (nextEditorScope >= Number.MAX_SAFE_INTEGER)
    throw new Error("Table of contents editor scope limit reached")
  const scope = `t${(++nextEditorScope).toString(36)}`
  editorScopes.set(editor, scope)

  return scope
}

export function getEditorTocHeadingId(editor: LexicalEditor, key: NodeKey) {
  return createEditorTocHeadingId(getEditorTocScope(editor), key)
}
