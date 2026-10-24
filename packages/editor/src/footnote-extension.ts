import type { EditorState, LexicalEditor, NodeKey } from "lexical"

import {
  $createParagraphNode,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_LOW,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  createCommand,
  defineExtension,
  mergeRegister,
} from "lexical"

import { EditorFootnoteClipboardExtension } from "./footnote-clipboard"
import {
  $appendEditorFootnoteDefinition,
  $insertEditorFootnote,
  $removeEditorFootnoteFromKeyboard,
  $renumberEditorFootnoteDefinition,
  $removeSelectedEditorFootnote,
  INSERT_EDITOR_FOOTNOTE_COMMAND,
  REMOVE_EDITOR_FOOTNOTE_COMMAND,
  RENUMBER_EDITOR_FOOTNOTE_DEFINITION_COMMAND,
} from "./footnote-commands"
import { EDITOR_FOOTNOTE_DEFINITION_ATTRIBUTE } from "./footnote-model"
import {
  EditorFootnoteDefinitionNode,
  EditorFootnoteReferenceNode,
} from "./footnote-node"
import { getEditorFootnoteDOMId } from "./footnote-runtime"
import { $getEditorFootnoteSnapshot } from "./footnote-state"

export { EditorFootnoteClipboardExtension } from "./footnote-clipboard"

export {
  INSERT_EDITOR_FOOTNOTE_COMMAND,
  REMOVE_EDITOR_FOOTNOTE_COMMAND,
  RENUMBER_EDITOR_FOOTNOTE_DEFINITION_COMMAND,
  type EditorFootnoteInsertPayload,
  type EditorFootnoteRenumberPayload,
} from "./footnote-commands"

export {
  EditorFootnoteDefinitionNode,
  EditorFootnoteReferenceNode,
  $createEditorFootnoteDefinitionNode,
  $createEditorFootnoteReferenceNode,
} from "./footnote-node"

export {
  $editorFootnoteIdentifier,
  $getEditorFootnoteSnapshot,
  $getSelectedEditorFootnote,
  type EditorFootnoteDefinitionEntry,
  type EditorFootnoteReferenceEntry,
  type EditorFootnoteSnapshot,
} from "./footnote-state"

export * from "./footnote-model"

export const INSERT_EDITOR_FOOTNOTE_DEFINITION_COMMAND = createCommand<string>(
  "INSERT_EDITOR_FOOTNOTE_DEFINITION_COMMAND",
)

const managedAttributes = [
  "id",
  "tabindex",
  "aria-label",
  "aria-describedby",
  "data-editor-footnote-number",
  "data-editor-footnote-duplicate",
] as const

interface ManagedElement {
  readonly element: HTMLElement
  readonly values: ReadonlyMap<string, string | null>
}

function originalAttributes(element: HTMLElement): ManagedElement {
  return {
    element,
    values: new Map(
      managedAttributes.map((attribute) => [
        attribute,
        element.getAttribute(attribute),
      ]),
    ),
  }
}

function restoreElement(managed: ManagedElement) {
  for (const [attribute, value] of managed.values) {
    if (value === null) managed.element.removeAttribute(attribute)
    else managed.element.setAttribute(attribute, value)
  }

  const label = managed.element.querySelector("[data-editor-footnote-label]")

  const identifier = managed.element.getAttribute(
    EDITOR_FOOTNOTE_DEFINITION_ATTRIBUTE,
  )

  if (label && identifier) label.textContent = identifier
}

function syncFootnoteDOM(
  editor: LexicalEditor,
  editorState: EditorState,
  managed: Map<NodeKey, ManagedElement>,
) {
  const active = new Set<NodeKey>()

  editorState.read(() => {
    const snapshot = $getEditorFootnoteSnapshot()

    for (const definition of snapshot.definitions) {
      const element = editor.getElementByKey(definition.key)

      if (!element) continue
      active.add(definition.key)
      const previous = managed.get(definition.key)

      if (previous?.element !== element) {
        if (previous) restoreElement(previous)
        managed.set(definition.key, originalAttributes(element))
      }

      element.id = getEditorFootnoteDOMId(editor, "definition", definition.key)
      element.tabIndex = -1
      element.setAttribute(
        "data-editor-footnote-number",
        String(definition.number),
      )
      element.setAttribute(
        "aria-label",
        definition.duplicate
          ? `Duplicate footnote definition ${definition.identifier}`
          : `Footnote ${definition.number}`,
      )

      if (definition.duplicate)
        element.setAttribute("data-editor-footnote-duplicate", "")
      else element.removeAttribute("data-editor-footnote-duplicate")

      const label = element.querySelector("[data-editor-footnote-label]")

      if (label) label.textContent = String(definition.number)
    }

    for (const reference of snapshot.references) {
      const element = editor.getElementByKey(reference.key)

      if (!element) continue
      active.add(reference.key)
      const previous = managed.get(reference.key)

      if (previous?.element !== element) {
        if (previous) restoreElement(previous)
        managed.set(reference.key, originalAttributes(element))
      }

      element.id = getEditorFootnoteDOMId(editor, "reference", reference.key)
      element.tabIndex = -1

      if (reference.definitionKey) {
        element.setAttribute(
          "aria-describedby",
          getEditorFootnoteDOMId(editor, "definition", reference.definitionKey),
        )
      } else element.removeAttribute("aria-describedby")
    }
  })

  for (const [key, previous] of managed) {
    if (active.has(key)) continue
    restoreElement(previous)
    managed.delete(key)
  }
}

export const EditorFootnoteExtension = defineExtension({
  name: "@yopem-ui/editor/footnotes",
  nodes: [EditorFootnoteReferenceNode, EditorFootnoteDefinitionNode],
  dependencies: [EditorFootnoteClipboardExtension],
  register(editor) {
    const managed = new Map<NodeKey, ManagedElement>()

    function sync(editorState: EditorState) {
      syncFootnoteDOM(editor, editorState, managed)
    }

    function restoreAll() {
      for (const previous of managed.values()) restoreElement(previous)
      managed.clear()
    }

    function remove(event: KeyboardEvent | null) {
      const removed = $removeEditorFootnoteFromKeyboard()

      if (removed) event?.preventDefault()

      return removed
    }

    return mergeRegister(
      editor.registerRootListener((root, previous) => {
        if (previous) restoreAll()

        if (root) sync(editor.getEditorState())
      }),
      editor.registerUpdateListener(({ editorState }) => sync(editorState)),
      editor.registerNodeTransform(EditorFootnoteDefinitionNode, (node) => {
        if (node.getChildrenSize() === 0) node.append($createParagraphNode())
      }),
      editor.registerCommand(
        INSERT_EDITOR_FOOTNOTE_COMMAND,
        $insertEditorFootnote,
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        REMOVE_EDITOR_FOOTNOTE_COMMAND,
        () => $removeSelectedEditorFootnote(),
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        INSERT_EDITOR_FOOTNOTE_DEFINITION_COMMAND,
        (identifier) => $appendEditorFootnoteDefinition(identifier),
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        RENUMBER_EDITOR_FOOTNOTE_DEFINITION_COMMAND,
        $renumberEditorFootnoteDefinition,
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(KEY_DELETE_COMMAND, remove, COMMAND_PRIORITY_LOW),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        remove,
        COMMAND_PRIORITY_LOW,
      ),
      () => restoreAll(),
    )
  },
})
