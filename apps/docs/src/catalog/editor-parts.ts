import { editorAiMenuParts } from "./editor-ai-menu-parts"
import { editorAiParts } from "./editor-ai-parts"
import { editorBlockMenuParts } from "./editor-block-menu-parts"
import { editorBlockPlaceholderParts } from "./editor-block-placeholder-parts"
import { editorBlockSelectionParts } from "./editor-block-selection-parts"
import { editorCodeParts } from "./editor-code-parts"
import { editorCollaborationParts } from "./editor-collaboration-parts"
import { editorColumnsParts } from "./editor-columns-parts"
import { editorCopilotParts } from "./editor-copilot-parts"
import { editorCursorOverlayParts } from "./editor-cursor-overlay-parts"
import { editorDateParts } from "./editor-date-parts"
import { editorDiagramParts } from "./editor-diagram-parts"
import { editorDocumentExportParts } from "./editor-document-export-parts"
import { editorDocxParts } from "./editor-docx-parts"
import { editorDrawingParts } from "./editor-drawing-parts"
import { editorEditableCardParts } from "./editor-editable-card-parts"
import { editorFloatingToolbarParts } from "./editor-floating-toolbar-parts"
import { editorFootnoteParts } from "./editor-footnote-parts"
import { editorLabelsParts } from "./editor-labels-parts"
import { editorListPresentationParts } from "./editor-list-presentation-parts"
import { editorMathParts } from "./editor-math-parts"
import { editorMediaParts } from "./editor-media-parts"
import { editorReviewParts } from "./editor-review-parts"
import { editorSearchParts } from "./editor-search-parts"
import { editorTocParts } from "./editor-toc-parts"
import { editorTypeaheadParts } from "./editor-typeahead-parts"

export const editorParts = [
  ...editorDocumentExportParts,
  ...editorDiagramParts,
  ...editorAiMenuParts,
  {
    name: "Editor",
    slug: "preset",
    item: "editor",
    description: "Preset rich-text editor with built-in controls.",
  },
  {
    name: "EditorRoot",
    slug: "root",
    item: "editor",
    description: "Provide editor state to composable controls.",
  },
  {
    name: "EditorContent",
    slug: "content",
    item: "editor",
    description: "Render the native editable document surface.",
  },
  {
    name: "EditorToolbar",
    slug: "toolbar",
    item: "editor",
    description: "Group formatting controls with keyboard navigation.",
  },
  {
    name: "EditorFormatButton",
    slug: "format-button",
    item: "editor",
    description:
      "Apply bold, italic, underline, or another text format to the current selection.",
  },
  {
    name: "EditorHistoryButton",
    slug: "history-button",
    item: "editor",
    description: "Undo or redo document changes.",
  },
  {
    name: "EditorBlockButton",
    slug: "block-button",
    item: "editor",
    description:
      "Change the selected block to a paragraph, heading, quote, or code block.",
  },
  {
    name: "EditorListButton",
    slug: "list-button",
    item: "editor",
    description:
      "Create a bullet, numbered, or check list from selected blocks.",
  },
  {
    name: "EditorIndentButton",
    slug: "indent-button",
    item: "editor",
    description: "Change block indentation.",
  },
  {
    name: "EditorTableButton",
    slug: "table-button",
    item: "editor",
    description: "Insert a table at the current selection.",
  },
  {
    name: "EditorLinkControl",
    slug: "link-control",
    item: "editor",
    description: "Insert, edit, or remove a selected link.",
  },
  {
    name: "EditorTableMenu",
    slug: "table-menu",
    item: "editor",
    description: "Change the selected table structure.",
  },
  {
    name: "EditorTableDimensions",
    slug: "table-dimensions",
    item: "editor",
    description: "Insert a table with validated dimensions.",
  },
  {
    name: "EditorTableCellPresentation",
    slug: "table-cell-presentation",
    item: "editor",
    description: "Compose background and border controls for selected cells.",
  },
  {
    name: "EditorTableBackgroundControls",
    slug: "table-background-controls",
    item: "editor",
    description: "Set the background of selected table cells.",
  },
  {
    name: "EditorTableBorderControls",
    slug: "table-border-controls",
    item: "editor",
    description: "Set logical borders across selected table edges.",
  },
  {
    name: "EditorTableResizeControls",
    slug: "table-resize-controls",
    item: "editor",
    description: "Resize selected table columns and rows.",
  },
  {
    name: "EditorAlignmentButton",
    slug: "alignment-button",
    item: "editor",
    description: "Set selected block alignment.",
  },
  {
    name: "EditorFontColorControl",
    slug: "font-color-control",
    item: "editor",
    description: "Set the selected text color.",
  },
  {
    name: "EditorBackgroundColorControl",
    slug: "background-color-control",
    item: "editor",
    description: "Set the selected text background.",
  },
  {
    name: "EditorFontFamilyControl",
    slug: "font-family-control",
    item: "editor",
    description: "Set the selected font family.",
  },
  {
    name: "EditorFontSizeControl",
    slug: "font-size-control",
    item: "editor",
    description: "Set the selected font size.",
  },
  {
    name: "EditorFontWeightControl",
    slug: "font-weight-control",
    item: "editor",
    description: "Set the selected font weight.",
  },
  {
    name: "EditorLineHeightControl",
    slug: "line-height-control",
    item: "editor",
    description: "Set selected block line height.",
  },
  {
    name: "EditorFirstLineIndentControl",
    slug: "first-line-indent-control",
    item: "editor",
    description: "Set first-line indentation for selected blocks.",
  },
  {
    name: "EditorClearFormattingButton",
    slug: "clear-formatting-button",
    item: "editor",
    description: "Clear formatting without removing document content.",
  },
  ...editorCodeParts,
  {
    name: "EditorCalloutButton",
    slug: "callout-button",
    item: "editor-blocks",
    description: "Insert a native callout at the current selection.",
  },
  {
    name: "EditorToggleButton",
    slug: "toggle-button",
    item: "editor-blocks",
    description: "Insert a toggle with a rich title and native disclosure.",
  },
  {
    name: "EditorCalloutAppearanceButton",
    slug: "callout-appearance-button",
    item: "editor-blocks",
    description: "Set the appearance of the selected callout.",
  },
  {
    name: "EditorCalloutIconControl",
    slug: "callout-icon-control",
    item: "editor-blocks",
    description: "Set the icon of the selected callout.",
  },
  {
    name: "EditorBlockTypeButton",
    slug: "block-type-button",
    item: "editor-blocks",
    description: "Convert a selected callout or toggle.",
  },
  {
    name: "EditorRemoveBlockButton",
    slug: "remove-block-button",
    item: "editor-blocks",
    description: "Remove the block wrapper and keep its content.",
  },
  {
    name: "EditorDisclosureButton",
    slug: "disclosure-button",
    item: "editor-blocks",
    description: "Open or close the selected toggle in an editable document.",
  },
  {
    name: "EditorBlocksControls",
    slug: "blocks-controls",
    item: "editor-blocks",
    description: "Compose callout and toggle controls with history actions.",
  },
  {
    name: "DocumentStatic",
    slug: "document-static",
    item: "editor-document",
    description:
      "Render validated HTML with native disclosure and safe title links.",
  },
  ...editorMathParts,
  ...editorFootnoteParts,
  ...editorTocParts,
  ...editorMediaParts,
  ...editorColumnsParts,
  ...editorDateParts,
  ...editorDocxParts,
  ...editorEditableCardParts,
  ...editorCopilotParts,
  ...editorBlockMenuParts,
  ...editorLabelsParts,
  ...editorListPresentationParts,
  ...editorReviewParts,
  ...editorAiParts,
  ...editorCollaborationParts,
  ...editorBlockSelectionParts,
  ...editorTypeaheadParts,
  ...editorSearchParts,
  ...editorFloatingToolbarParts,
  ...editorCursorOverlayParts,
  ...editorDrawingParts,
  ...editorBlockPlaceholderParts,
] as const

export function getEditorPart(slug: string) {
  return editorParts.find((part) => part.slug === slug)
}
