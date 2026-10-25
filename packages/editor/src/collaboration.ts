export {
  EditorCollaborationProvider,
  type EditorCollaborationClientOptions,
  type EditorCollaborationPeer,
  type EditorCollaborationSnapshot,
  type EditorCollaborationTransport,
  type EditorCollaborationConnectionStatus,
  type EditorCollaborationWebSocket,
} from "./collaboration-client"

export {
  createEditorCollaboration,
  createEditorCollaborationWithProvider,
  EditorCollaborationAwareness,
  EditorCollaborationCursors,
  EditorCollaborationExtension,
  EditorCollaborationRoot,
  EditorCollaborationStatus,
  useEditorCollaboration,
} from "./collaboration-controls"

export type {
  EditorCollaborationController,
  EditorCollaborationRootProps,
} from "./collaboration-controls"
