"use client"

import type { AnyLexicalExtensionArgument, LexicalEditor } from "lexical"
import type { ReactNode } from "react"

import { HistoryExtension } from "@lexical/history"
import {
  CONNECTED_COMMAND,
  createUndoManager,
  syncCursorPositions,
  TOGGLE_CONNECT_COMMAND,
  createYjsBinding,
  initLocalState,
  setLocalStateFocus,
  syncLexicalUpdateToYjs,
  syncYjsChangesToLexical,
} from "@lexical/yjs"
import { Box } from "@registry/components/ui/box"
import { List, ListItem } from "@registry/components/ui/list"
import * as stylex from "@stylexjs/stylex"
import {
  $getRoot,
  $isParagraphNode,
  BLUR_COMMAND,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COLLABORATION_TAG,
  HISTORIC_TAG,
  HISTORY_PUSH_TAG,
  REDO_COMMAND,
  UNDO_COMMAND,
  configExtension,
  COMMAND_PRIORITY_EDITOR,
  FOCUS_COMMAND,
  SKIP_COLLAB_TAG,
  defineExtension,
  getActiveElement,
  isDOMShadowRoot,
} from "lexical"
import { createContext, use, useSyncExternalStore } from "react"
import * as Y from "yjs"

import type {
  EditorCollaborationClientOptions,
  EditorCollaborationSnapshot,
} from "./collaboration-client"

import { EditorCollaborationProvider } from "./collaboration-client"
import { useEditor } from "./root"

const collaborationBindings = new WeakMap<
  LexicalEditor,
  {
    provider: EditorCollaborationProvider
    mountCursors(element: HTMLElement): () => void
  }
>()

const collaborationStyles = stylex.create({
  root: {
    position: "relative",
  },
  cursors: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
  },
})

export interface EditorCollaborationController {
  readonly document: Y.Doc
  readonly provider: EditorCollaborationProvider
  readonly extension: AnyLexicalExtensionArgument
  destroy(): void
}

interface EditorCollaborationContextValue {
  controller: EditorCollaborationController
  snapshot: EditorCollaborationSnapshot
}

const EditorCollaborationContext =
  createContext<EditorCollaborationContextValue | null>(null)

export function createEditorCollaboration(
  options: EditorCollaborationClientOptions,
): EditorCollaborationController {
  const provider = new EditorCollaborationProvider(options)

  return {
    document: provider.doc,
    provider,
    extension: EditorCollaborationExtension(provider, options.documentId),
    destroy() {
      provider.destroy()
    },
  }
}

export function EditorCollaborationExtension(
  provider: EditorCollaborationProvider,
  documentId: string,
): AnyLexicalExtensionArgument {
  return defineExtension({
    name: "@yopem-ui/editor-collaboration",
    namespace: "yopem-ui-editor-collaboration",
    dependencies: [configExtension(HistoryExtension, { disabled: true })],
    register(editor) {
      let hasSynced = false
      let localDraft = false

      function isInitialStateEmpty() {
        return editor.read(() => {
          const root = $getRoot()
          const children = root.getChildren()
          const first = children[0]
          const nodes = [root, ...children]

          return (
            (children.length === 0 ||
              (children.length === 1 &&
                $isParagraphNode(first) &&
                first.isEmpty())) &&
            nodes.every((node) =>
              Object.keys(node.exportJSON(true)).every(
                (key) =>
                  key === "type" || key === "version" || key === "children",
              ),
            )
          )
        })
      }

      const releaseGuard = provider.registerSyncGuard(() => {
        editor.read(() => undefined)

        return !localDraft && (hasSynced || isInitialStateEmpty())
      })

      const originalSetEditable = editor.setEditable.bind(editor)
      let hostEditable = editor.isEditable()

      function setEditable(editable: boolean) {
        hostEditable = editable
        originalSetEditable.call(
          editor,
          editable && hasSynced && provider.getSnapshot().writable,
        )
      }

      editor.setEditable = setEditable

      function applyEditability() {
        if (provider.getSnapshot().writable) editor.read(() => undefined)
        originalSetEditable.call(
          editor,
          hostEditable && hasSynced && provider.getSnapshot().writable,
        )
        publishHistory()
      }

      const bindingId = `${documentId.replace(/[^A-Za-z0-9_-]/g, "-")}-${provider.doc.guid}`
      const docMap = new Map([[bindingId, provider.doc]])

      const binding = createYjsBinding({
        doc: provider.doc,
        docMap,
        editor,
        id: bindingId,
        rootName: "root",
      })

      const releaseOrigin = provider.registerBindingOrigin(binding)
      const sharedRoot = binding.root.getSharedType()
      const undoManager = createUndoManager(binding, sharedRoot)

      function publishHistory() {
        const writable = editor.isEditable() && provider.getSnapshot().writable
        editor.dispatchCommand(
          CAN_UNDO_COMMAND,
          writable && undoManager.undoStack.length > 0,
        )
        editor.dispatchCommand(
          CAN_REDO_COMMAND,
          writable && undoManager.redoStack.length > 0,
        )
      }

      undoManager.on("stack-item-added", publishHistory)
      undoManager.on("stack-item-popped", publishHistory)
      undoManager.on("stack-cleared", publishHistory)

      const removeUndo = editor.registerCommand(
        UNDO_COMMAND,
        () => {
          if (editor.isEditable() && provider.getSnapshot().writable)
            undoManager.undo()

          return true
        },
        COMMAND_PRIORITY_EDITOR,
      )

      const removeRedo = editor.registerCommand(
        REDO_COMMAND,
        () => {
          if (editor.isEditable() && provider.getSnapshot().writable)
            undoManager.redo()

          return true
        },
        COMMAND_PRIORITY_EDITOR,
      )

      const removeEditable = editor.registerEditableListener(publishHistory)
      const removeProvider = provider.subscribe(applyEditability)
      applyEditability()
      let unmountCursors: (() => void) | undefined

      const highlightScopes = new Set<Document | ShadowRoot>()

      function clearCursors() {
        syncCursorPositions(binding, provider, {
          getAwarenessStates: () => new Map(),
        })
        const sheet = binding.cursorHighlightSheet

        if (sheet) {
          for (const scope of highlightScopes)
            scope.adoptedStyleSheets = scope.adoptedStyleSheets.filter(
              (adopted) => adopted !== sheet,
            )
        }

        highlightScopes.clear()
        binding.cursorHighlightSheet = null
      }

      function syncCursors() {
        if (!binding.cursorsContainer || !editor.getRootElement()) return
        syncCursorPositions(binding, provider, { selectionHighlight: true })
        const root = editor.getRootElement()

        if (root && binding.cursorHighlightSheet) {
          const scope = root.getRootNode()
          highlightScopes.add(
            isDOMShadowRoot(scope) ? scope : root.ownerDocument,
          )
        }
      }

      collaborationBindings.set(editor, {
        provider,
        mountCursors(element) {
          unmountCursors?.()
          binding.cursorsContainer = element
          const view = element.ownerDocument.defaultView
          const resize = new ResizeObserver(syncCursors)

          function observeRoot(root: HTMLElement | null) {
            resize.disconnect()
            clearCursors()

            if (root) {
              resize.observe(root)
              syncCursors()
            }
          }

          const removeRoot = editor.registerRootListener(observeRoot)
          provider.awareness.on("update", syncCursors)
          element.ownerDocument.addEventListener("scroll", syncCursors, true)
          view?.addEventListener("resize", syncCursors)
          let mounted = true

          function cleanup() {
            if (!mounted) return
            mounted = false
            removeRoot()
            resize.disconnect()
            provider.awareness.off("update", syncCursors)
            element.ownerDocument.removeEventListener(
              "scroll",
              syncCursors,
              true,
            )
            view?.removeEventListener("resize", syncCursors)
            clearCursors()
            binding.cursorsContainer = null

            if (unmountCursors === cleanup) unmountCursors = undefined
          }

          unmountCursors = cleanup
          syncCursors()

          return cleanup
        },
      })

      function onStatus({ status }: { status: string }) {
        if (status === "syncing" && provider.clientId !== undefined)
          binding.clientID = provider.clientId
      }

      function onSync(isSynced: boolean) {
        if (isSynced) {
          hasSynced = true
          editor.read(() => undefined)
        }

        applyEditability()
        editor.dispatchCommand(CONNECTED_COMMAND, isSynced)
      }

      function onFocus() {
        setLocalStateFocus(
          provider,
          provider.displayName,
          provider.cursorColor,
          true,
          provider.awarenessData,
        )

        return false
      }

      function onBlur() {
        setLocalStateFocus(
          provider,
          provider.displayName,
          provider.cursorColor,
          false,
          provider.awarenessData,
        )

        return false
      }

      const rootElement = editor.getRootElement()
      initLocalState(
        provider,
        provider.displayName,
        provider.cursorColor,
        rootElement !== null && getActiveElement(rootElement) === rootElement,
        provider.awarenessData,
      )
      provider.on("status", onStatus)
      provider.on("sync", onSync)

      const removeFocus = editor.registerCommand(
        FOCUS_COMMAND,
        onFocus,
        COMMAND_PRIORITY_EDITOR,
      )

      const removeBlur = editor.registerCommand(
        BLUR_COMMAND,
        onBlur,
        COMMAND_PRIORITY_EDITOR,
      )

      const removeToggle = editor.registerCommand(
        TOGGLE_CONNECT_COMMAND,
        (shouldConnect) => {
          if (shouldConnect) void provider.connect().catch(() => undefined)
          else provider.disconnect()

          return true
        },
        COMMAND_PRIORITY_EDITOR,
      )

      const onYjsChanges = (
        events: Parameters<typeof syncYjsChangesToLexical>[2],
        transaction: Y.Transaction,
      ) => {
        if (transaction.origin === binding) return

        syncYjsChangesToLexical(
          binding,
          provider,
          events,
          transaction.origin instanceof Y.UndoManager,
          syncCursors,
        )
      }

      sharedRoot.observeDeep(onYjsChanges)

      const removeEditorListener = editor.registerUpdateListener((update) => {
        const remote =
          update.tags.has(COLLABORATION_TAG) || update.tags.has(HISTORIC_TAG)

        const dirty =
          update.dirtyElements.size > 0 || update.dirtyLeaves.size > 0

        if (update.tags.has(SKIP_COLLAB_TAG)) {
          if (!remote && dirty) {
            localDraft = true
            provider.preserveLocalDraft()
          }

          return
        }

        if (!remote && dirty && !provider.getSnapshot().writable) {
          if (hasSynced || !isInitialStateEmpty()) {
            localDraft = true
            provider.preserveLocalDraft()
          }

          return
        }

        if ((!hasSynced && !remote) || localDraft) return

        if (update.tags.has(HISTORY_PUSH_TAG)) undoManager.stopCapturing()

        syncLexicalUpdateToYjs(
          binding,
          provider,
          update.prevEditorState,
          update.editorState,
          update.dirtyElements,
          update.dirtyLeaves,
          update.normalizedNodes,
          update.tags,
        )

        if (update.tags.has(HISTORY_PUSH_TAG)) undoManager.stopCapturing()
        syncCursors()
      })

      void provider.connect().catch(() => undefined)

      return function unregisterCollaboration() {
        unmountCursors?.()
        clearCursors()
        collaborationBindings.delete(editor)
        releaseGuard()
        releaseOrigin()
        removeProvider()
        removeEditable()
        removeUndo()
        removeRedo()
        undoManager.off("stack-item-added", publishHistory)
        undoManager.off("stack-item-popped", publishHistory)
        undoManager.off("stack-cleared", publishHistory)
        undoManager.destroy()

        if (editor.setEditable === setEditable) {
          editor.setEditable = originalSetEditable
          originalSetEditable.call(editor, hostEditable)
        }

        provider.off("status", onStatus)
        provider.off("sync", onSync)
        sharedRoot.unobserveDeep(onYjsChanges)
        removeEditorListener()
        removeFocus()
        removeBlur()
        removeToggle()
        binding.root.destroy(binding)
        provider.destroy()
      }
    },
  })
}

export function useEditorCollaboration(
  controller: EditorCollaborationController,
) {
  return useSyncExternalStore(
    controller.provider.subscribe,
    controller.provider.getSnapshot,
    controller.provider.getSnapshot,
  )
}

export interface EditorCollaborationRootProps {
  controller: EditorCollaborationController
  children?: ReactNode
}

export function EditorCollaborationRoot({
  controller,
  children,
}: EditorCollaborationRootProps) {
  const snapshot = useEditorCollaboration(controller)

  return (
    <EditorCollaborationContext value={{ controller, snapshot }}>
      <Box xstyle={collaborationStyles.root}>{children}</Box>
    </EditorCollaborationContext>
  )
}

export function EditorCollaborationStatus() {
  const context = use(EditorCollaborationContext)

  if (!context)
    throw new Error(
      "EditorCollaborationStatus must be inside EditorCollaborationRoot.",
    )

  const label = {
    idle: "Not connected",
    connecting: "Connecting",
    syncing: "Syncing",
    connected: "Connected",
    reconnecting: "Reconnecting",
    disconnected: "Disconnected",
    denied: "Access denied",
    conflict: "Document changed",
    uncertain: "Connection outcome is uncertain",
    error: "Connection unavailable",
  }[context.snapshot.status]

  return (
    <Box render={<output />} aria-live="polite" aria-atomic="true">
      {label}
    </Box>
  )
}

export function EditorCollaborationAwareness() {
  const context = use(EditorCollaborationContext)

  if (!context)
    throw new Error(
      "EditorCollaborationAwareness must be inside EditorCollaborationRoot.",
    )

  return (
    <List aria-label="Collaborators">
      {context.snapshot.peers.map((peer) => (
        <ListItem key={peer.clientId}>{peer.name}</ListItem>
      ))}
    </List>
  )
}

export function EditorCollaborationCursors() {
  const context = use(EditorCollaborationContext)
  const editor = useEditor()

  if (!context)
    throw new Error(
      "EditorCollaborationCursors must be inside EditorCollaborationRoot.",
    )

  function mount(element: HTMLDivElement | null) {
    if (!element) return
    const binding = collaborationBindings.get(editor)

    if (!binding || binding.provider !== context?.controller.provider)
      throw new Error(
        "EditorCollaborationCursors requires its controller extension in EditorRoot.",
      )

    return binding.mountCursors(element)
  }

  return (
    <Box
      data-slot="editor-collaboration-cursors"
      aria-hidden="true"
      xstyle={collaborationStyles.cursors}
      ref={mount}
    />
  )
}
