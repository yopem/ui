export const editorSearchParts = [
  {
    name: "EditorSearchRoot",
    slug: "search-root",
    item: "editor-search",
    description: "Provide search state for one editor.",
  },
  {
    name: "EditorSearchInput",
    slug: "search-input",
    item: "editor-search",
    description: "Set the query and navigate with Enter or Shift+Enter.",
  },
  {
    name: "EditorSearchPreviousButton",
    slug: "search-previous-button",
    item: "editor-search",
    description: "Select the previous matching text.",
  },
  {
    name: "EditorSearchNextButton",
    slug: "search-next-button",
    item: "editor-search",
    description: "Select the next matching text.",
  },
  {
    name: "EditorSearchStatus",
    slug: "search-status",
    item: "editor-search",
    description: "Announce the current position and result count.",
  },
  {
    name: "EditorSearchViewport",
    slug: "search-viewport",
    item: "editor-search",
    description: "Position non-editable highlights over the editor surface.",
  },
] as const
