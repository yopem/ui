export const editorMediaPlaceholderParts = [
  {
    name: "MediaPlaceholderElement",
    slug: "media-placeholder-element",
    item: "editor-media-placeholder",
    description:
      "Render an in-document upload placeholder with explicit file selection.",
  },
  {
    name: "MediaPlaceholderStatus",
    slug: "media-placeholder-status",
    item: "editor-media-placeholder",
    description: "Show bounded upload progress and typed inline failure.",
  },
  {
    name: "MediaUploadNotification",
    slug: "media-upload-notification",
    item: "editor-media-placeholder",
    description: "Announce typed upload failure, cancellation, and completion.",
  },
  {
    name: "MediaPlaceholderFileInput",
    slug: "media-placeholder-file-input",
    item: "editor-media-placeholder",
    description: "Select one local file explicitly for a placeholder.",
  },
  {
    name: "MediaPlaceholderRetryButton",
    slug: "media-placeholder-retry-button",
    item: "editor-media-placeholder",
    description: "Retry one failed upload only after an explicit action.",
  },
  {
    name: "MediaPlaceholderCancelButton",
    slug: "media-placeholder-cancel-button",
    item: "editor-media-placeholder",
    description:
      "Cancel active work without releasing capacity before settlement.",
  },
  {
    name: "MediaPlaceholderRemoveButton",
    slug: "media-placeholder-remove-button",
    item: "editor-media-placeholder",
    description: "Remove one placeholder with native undo support.",
  },
  {
    name: "MediaPlaceholderInsertButton",
    slug: "media-placeholder-insert-button",
    item: "editor-media-placeholder",
    description: "Insert a safe inert placeholder at the current range.",
  },
] as const
