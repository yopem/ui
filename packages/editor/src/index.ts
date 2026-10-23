export { Editor } from "./editor"

export type { EditorProps, EditorStateSnapshot } from "./extension"

export { EditorRoot, EditorContent, useEditor, useEditorState } from "./root"

export type { EditorRootProps, EditorContentProps } from "./root"

export {
  EditorToolbar,
  EditorFormatButton,
  EditorHistoryButton,
  EditorBlockButton,
  EditorListButton,
  EditorIndentButton,
  EditorTableButton,
} from "./controls"

export type {
  EditorToolbarProps,
  EditorControlProps,
  EditorFormatButtonProps,
  EditorHistoryButtonProps,
  EditorBlockButtonProps,
  EditorListButtonProps,
  EditorIndentButtonProps,
  EditorTableButtonProps,
} from "./controls"

export { EditorLinkControl } from "./link-control"

export type { EditorLinkControlProps } from "./link-control"

export { EditorTableMenu } from "./table-controls"

export type { EditorTableMenuProps } from "./table-controls"

export {
  EditorTableDimensions,
  EditorTableCellPresentation,
} from "./table-presentation-controls"

export { EditorTableResizeControls } from "./table-resize"

export {
  EditorTablePresentationExtension,
  editorTablePresentationHTML,
  createEditorTablePresentationHTMLConfig,
  TABLE_PRESENTATION_ERROR_COMMAND,
} from "./table-presentation"

export {
  parseTablePresentationJSON,
  validateTablePresentationHTML,
  validateTableGeometry,
  TABLE_MIN_COLUMN_WIDTH,
  TABLE_MAX_COLUMN_WIDTH,
  TABLE_MAX_ROWS,
  TABLE_MAX_COLUMNS,
  TABLE_MAX_CELLS,
} from "./table-presentation-schema"
