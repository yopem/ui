export const editorMediaParts = [
  {
    name: "MediaActions",
    slug: "media-actions",
    item: "editor-media",
    description: "Share one selected media target across editing controls.",
  },
  {
    name: "MediaEditControl",
    slug: "media-edit-control",
    item: "editor-media",
    description:
      "Change a selected media source without inserting another node.",
  },
  {
    name: "MediaCaptionTextarea",
    slug: "media-caption-textarea",
    item: "editor-media",
    description: "Edit a bounded plain-text caption with multiple lines.",
  },
  {
    name: "MediaImageResize",
    slug: "media-image-resize",
    item: "editor-media",
    description: "Resize one image with pointer or keyboard input.",
  },
  {
    name: "MediaAlignButton",
    slug: "media-align-button",
    item: "editor-media",
    description: "Set the alignment of selected media.",
  },
  {
    name: "MediaDeleteButton",
    slug: "media-delete-button",
    item: "editor-media",
    description: "Remove selected media with native undo support.",
  },
  {
    name: "MediaFileClipboard",
    slug: "media-file-clipboard",
    item: "editor-media",
    description:
      "Insert one pasted or dropped file through a configured host upload callback.",
  },
  {
    name: "MediaPreviewRoot",
    slug: "media-preview-root",
    item: "editor-media",
    description:
      "Share image selection and local zoom across preview triggers and a dialog.",
  },
  {
    name: "MediaPreviewTrigger",
    slug: "media-preview-trigger",
    item: "editor-media",
    description:
      "Open one image in its preview root with native dialog focus handling.",
  },
  {
    name: "MediaPreviewDialog",
    slug: "media-preview-dialog",
    item: "editor-media",
    description:
      "Navigate images and change local zoom in an accessible dialog.",
  },
  {
    name: "MediaPreviewGallery",
    slug: "media-preview-gallery",
    item: "editor-media",
    description: "Compose preview triggers with the built-in image dialog.",
  },
  {
    name: "MediaEmbedContent",
    slug: "media-embed-content",
    item: "editor-media",
    description:
      "Load a validated external frame only after host configuration and user consent.",
  },
  {
    name: "MediaInsertControl",
    slug: "media-insert-control",
    item: "editor-media",
    description: "Insert validated media at a saved editor selection.",
  },
  {
    name: "MediaContent",
    slug: "media-content",
    item: "editor-media",
    description:
      "Render validated media without an editor root or editing controls.",
  },
] as const
