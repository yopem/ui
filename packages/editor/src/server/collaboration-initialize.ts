import type { Provider, ProviderAwareness, UserState } from "@lexical/yjs"
import type { LexicalEditorWithDispose } from "lexical"

import {
  createYjsBinding,
  initLocalState,
  syncLexicalUpdateToYjs,
} from "@lexical/yjs"
import * as Y from "yjs"

import type { JsonValue } from "./document-model"

import { CollaborationError, candidateState } from "./collaboration/protocol"
import { DocumentError, boundedState } from "./document-model"

export interface EditorCollaborationInitializerInput {
  documentId?: string
  state: string
  schemaVersion: number
  signal: AbortSignal
}

export interface EditorCollaborationInitializerOptions {
  createEditor(this: void, schemaVersion: number): LexicalEditorWithDispose
  validateState(this: void, state: JsonValue, schemaVersion: number): boolean
}

function createBootstrapProvider(doc: Y.Doc): Provider {
  let localState: UserState | null = null

  function setLocalState(state: UserState | null) {
    localState = state
  }

  const awareness: ProviderAwareness = {
    getLocalState() {
      return localState
    },
    getStates() {
      return localState
        ? new Map([[doc.clientID, localState]])
        : new Map<number, UserState>()
    },
    on() {
      return undefined
    },
    off() {
      return undefined
    },
    setLocalState,
    setLocalStateField(field, value) {
      if (localState) setLocalState({ ...localState, [field]: value })
    },
  }

  return {
    awareness,
    connect() {
      return undefined
    },
    disconnect() {
      return undefined
    },
    on() {
      return undefined
    },
    off() {
      return undefined
    },
  }
}

export function createEditorCollaborationInitializer(
  options: EditorCollaborationInitializerOptions,
) {
  return async function initializeEditorCollaboration(
    input: EditorCollaborationInitializerInput,
  ) {
    await new Promise<void>(function yieldForCancellation(resolve) {
      setTimeout(resolve, 0)
    })

    if (input.signal.aborted) throw new CollaborationError("aborted")

    try {
      boundedState(input.state, input.schemaVersion, options.validateState)
    } catch (error) {
      if (error instanceof DocumentError)
        throw new CollaborationError(
          error.code === "budget" ? "budget" : "invalid",
        )

      throw new CollaborationError("invalid")
    }

    let editor: LexicalEditorWithDispose

    try {
      editor = options.createEditor(input.schemaVersion)
    } catch {
      throw new CollaborationError("invalid")
    }

    const doc = new Y.Doc()
    const id = input.documentId ?? "editor-collaboration-bootstrap"
    const docMap = new Map([[id, doc]])
    const provider = createBootstrapProvider(doc)
    initLocalState(provider, "", "", false, {})
    let binding: ReturnType<typeof createYjsBinding> | undefined
    let removeUpdateListener: (() => void) | undefined

    try {
      if (input.signal.aborted) throw new CollaborationError("aborted")
      const state = editor.parseEditorState(input.state)

      const currentBinding = createYjsBinding({
        doc,
        docMap,
        editor,
        id,
        rootName: "root",
      })

      binding = currentBinding
      removeUpdateListener = editor.registerUpdateListener((update) => {
        if (input.signal.aborted) throw new CollaborationError("aborted")

        syncLexicalUpdateToYjs(
          currentBinding,
          provider,
          update.prevEditorState,
          update.editorState,
          update.dirtyElements,
          update.dirtyLeaves,
          update.normalizedNodes,
          update.tags,
        )
      })
      editor.setEditorState(state)

      if (input.signal.aborted) throw new CollaborationError("aborted")
      const bytes = Y.encodeStateAsUpdate(doc)

      if (bytes.byteLength > 61440) throw new CollaborationError("budget")
      const empty = new Y.Doc()

      try {
        return candidateState(Y.encodeStateAsUpdate(empty), bytes)
      } finally {
        empty.destroy()
      }
    } catch (error) {
      if (error instanceof CollaborationError) throw error
      throw new CollaborationError("invalid")
    } finally {
      removeUpdateListener?.()

      if (binding) binding.root.destroy(binding)
      doc.destroy()
      editor.dispose()
    }
  }
}
