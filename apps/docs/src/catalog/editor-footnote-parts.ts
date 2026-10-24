export const editorFootnoteParts = [
  {
    name: "EditorFootnoteTypeahead",
    slug: "footnote-typeahead",
    item: "editor-footnotes",
    description: "Insert or link footnotes with an identifier query.",
  },
  {
    name: "EditorFootnoteControls",
    slug: "footnote-controls",
    item: "editor-footnotes",
    description:
      "Compose footnote insertion, removal, renumbering, and backlinks.",
  },
  {
    name: "EditorFootnoteInsertControl",
    slug: "footnote-insert-control",
    item: "editor-footnotes",
    description: "Insert a footnote reference and definition.",
  },
  {
    name: "EditorFootnoteRemoveControl",
    slug: "footnote-remove-control",
    item: "editor-footnotes",
    description: "Remove a selected footnote part.",
  },
  {
    name: "EditorFootnoteRenumberControl",
    slug: "footnote-renumber-control",
    item: "editor-footnotes",
    description: "Give a duplicate definition a new identifier.",
  },
  {
    name: "EditorFootnoteBacklinks",
    slug: "footnote-backlinks",
    item: "editor-footnotes",
    description: "Navigate from a definition to its references.",
  },
] as const
