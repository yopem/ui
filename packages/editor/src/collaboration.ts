export {
  EditorCollaborationProvider,
  type EditorCollaborationClientOptions,
  type EditorCollaborationPeer,
  type EditorCollaborationSnapshot,
  type EditorCollaborationConnectionStatus,
  type EditorCollaborationWebSocket,
} from "./collaboration-client"

export {
  createEditorCollaboration,
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
