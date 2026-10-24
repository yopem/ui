import type { LexicalEditor, NodeKey } from "lexical"

const editorScopes = new WeakMap<LexicalEditor, string>()

let nextEditorScope = 0

export function getEditorFootnoteScope(editor: LexicalEditor) {
  const existing = editorScopes.get(editor)

  if (existing) return existing

  if (nextEditorScope >= Number.MAX_SAFE_INTEGER)
    throw new Error("Footnote editor scope limit reached")
  const scope = `f${(++nextEditorScope).toString(36)}`
  editorScopes.set(editor, scope)

  return scope
}

export function getEditorFootnoteDOMId(
  editor: LexicalEditor,
  kind: "reference" | "definition",
  key: NodeKey,
) {
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(key))
    throw new Error("Invalid footnote node key")
  const id = `yopem-footnote-${getEditorFootnoteScope(editor)}-${kind}-${key}`

  if (id.length > 128) throw new Error("Footnote DOM ID is too long")

  return id
}
