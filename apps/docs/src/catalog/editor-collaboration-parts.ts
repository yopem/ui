export const editorCollaborationParts = [
  {
    name: "EditorCollaborationCursors",
    slug: "collaboration-cursors",
    item: "editor-collaboration",
    description: "Show remote carets and selections inside the shared editor.",
  },
  {
    name: "EditorCollaborationRoot",
    slug: "collaboration-root",
    item: "editor-collaboration",
    description:
      "Provide shared document state, connection status, and presence.",
  },
  {
    name: "EditorCollaborationStatus",
    slug: "collaboration-status",
    item: "editor-collaboration",
    description: "Announce the current collaboration connection status.",
  },
  {
    name: "EditorCollaborationAwareness",
    slug: "collaboration-awareness",
    item: "editor-collaboration",
    description: "List collaborators with active presence in the document.",
  },
] as const
