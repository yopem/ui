import { displayFormItems } from "@registry/items/display-form"
import { editorItem } from "@registry/items/editor"
import { editorAiItem } from "@registry/items/editor-ai"
import { editorAiMenuItem } from "@registry/items/editor-ai-menu"
import { editorAssetsItem } from "@registry/items/editor-assets"
import { editorAuthItem } from "@registry/items/editor-auth"
import { editorAutoformatItem } from "@registry/items/editor-autoformat"
import { editorBlockBehaviorItem } from "@registry/items/editor-block-behavior"
import { editorBlockMenuItem } from "@registry/items/editor-block-menu"
import { editorBlockPlaceholderItem } from "@registry/items/editor-block-placeholder"
import { editorBlockSelectionItem } from "@registry/items/editor-block-selection"
import { editorBlocksItem } from "@registry/items/editor-blocks"
import { editorCodeItem } from "@registry/items/editor-code"
import { editorCodeFormatItem } from "@registry/items/editor-code-format"
import { editorCollaborationItem } from "@registry/items/editor-collaboration"
import { editorCollaborationBunItem } from "@registry/items/editor-collaboration-bun"
import { editorCollaborationGrantsItem } from "@registry/items/editor-collaboration-grants"
import { editorCollaborationNativeItem } from "@registry/items/editor-collaboration-native"
import { editorCollaborationNodeItem } from "@registry/items/editor-collaboration-node"
import { editorCollaborationServerItem } from "@registry/items/editor-collaboration-server"
import { editorCollaborationWorkerItem } from "@registry/items/editor-collaboration-worker"
import { editorColumnsItem } from "@registry/items/editor-columns"
import { editorCopilotItem } from "@registry/items/editor-copilot"
import { editorCsvItem } from "@registry/items/editor-csv"
import { editorCursorOverlayItem } from "@registry/items/editor-cursor-overlay"
import { editorDateItem } from "@registry/items/editor-date"
import { editorDiagramItem } from "@registry/items/editor-diagram"
import {
  editorDiagramMermaidItem,
  editorDiagramPlantUmlItem,
  editorDiagramGraphvizItem,
  editorDiagramFlowchartItem,
} from "@registry/items/editor-diagram-renderers"
import { editorDocumentItem } from "@registry/items/editor-document"
import {
  editorDocumentExportItem,
  editorDocumentExportImageItem,
} from "@registry/items/editor-document-export"
import { editorDocxItem } from "@registry/items/editor-docx"
import { editorDrawingItem } from "@registry/items/editor-drawing"
import { editorEditableCardItem } from "@registry/items/editor-editable-card"
import { editorEditingRulesItem } from "@registry/items/editor-editing-rules"
import { editorFloatingToolbarItem } from "@registry/items/editor-floating-toolbar"
import { editorFootnotesItem } from "@registry/items/editor-footnotes"
import { editorLabelsItem } from "@registry/items/editor-labels"
import { editorListPresentationItem } from "@registry/items/editor-list-presentation"
import { editorMathItem } from "@registry/items/editor-math"
import { editorMediaItem } from "@registry/items/editor-media"
import { editorReviewItem } from "@registry/items/editor-review"
import { editorSearchItem } from "@registry/items/editor-search"
import { editorStoreItem } from "@registry/items/editor-store"
import { editorTocItem } from "@registry/items/editor-toc"
import { editorTypeaheadItem } from "@registry/items/editor-typeahead"
import { editorWordClipboardItem } from "@registry/items/editor-word-clipboard"
import { foundationItems } from "@registry/items/foundation"
import { hookItems } from "@registry/items/hooks"
import { layoutItems } from "@registry/items/layout"
import { remainingItems } from "@registry/items/remaining"

export const sourceItems = [
  ...foundationItems,
  ...hookItems,
  ...layoutItems,
  ...displayFormItems,
  ...remainingItems,
  editorItem,
  editorAiItem,
  editorAiMenuItem,
  editorAssetsItem,
  editorAuthItem,
  editorBlocksItem,
  editorMathItem,
  editorMediaItem,
  editorCollaborationItem,
  editorCollaborationBunItem,
  editorCollaborationGrantsItem,
  editorCollaborationNativeItem,
  editorCollaborationNodeItem,
  editorCollaborationServerItem,
  editorCollaborationWorkerItem,
  editorCodeItem,
  editorColumnsItem,
  editorDateItem,
  editorCodeFormatItem,
  editorBlockSelectionItem,
  editorFootnotesItem,
  editorTocItem,
  editorCsvItem,
  editorWordClipboardItem,
  editorCursorOverlayItem,
  editorDrawingItem,
  editorSearchItem,
  editorFloatingToolbarItem,
  editorAutoformatItem,
  editorBlockBehaviorItem,
  editorDocxItem,
  editorDocumentExportItem,
  editorDocumentExportImageItem,
  editorDiagramItem,
  editorDiagramMermaidItem,
  editorDiagramPlantUmlItem,
  editorDiagramGraphvizItem,
  editorDiagramFlowchartItem,
  editorEditableCardItem,
  editorCopilotItem,
  editorBlockMenuItem,
  editorListPresentationItem,
  editorLabelsItem,
  editorEditingRulesItem,
  editorBlockPlaceholderItem,
  editorDocumentItem,
  editorStoreItem,
  editorReviewItem,
  editorTypeaheadItem,
]
