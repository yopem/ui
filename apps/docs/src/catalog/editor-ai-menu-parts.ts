export const editorAiMenuParts = [
  {
    name: "EditorAiMenuRoot",
    slug: "ai-menu-root",
    item: "editor-ai-menu",
    description:
      "Retain one saved target and bounded local chat for configured AI commands.",
  },
  {
    name: "EditorAiMenuTrigger",
    slug: "ai-menu-trigger",
    item: "editor-ai-menu",
    description: "Open explicit AI commands for the current document target.",
  },
  {
    name: "EditorAiMenuContent",
    slug: "ai-menu-content",
    item: "editor-ai-menu",
    description: "Compose the native editable surface with AI entry shortcuts.",
  },
  {
    name: "EditorAiInlinePreview",
    slug: "ai-inline-preview",
    item: "editor-ai-menu",
    description:
      "Show bounded transient proposal text beside its saved range without changing the document.",
  },
  {
    name: "EditorAiMenuPanel",
    slug: "ai-menu-panel",
    item: "editor-ai-menu",
    description:
      "Review untrusted proposals and make explicit text, comment, or suggestion decisions.",
  },
] as const
