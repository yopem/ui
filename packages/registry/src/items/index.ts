import { displayFormItems } from "@registry/items/display-form"
import { editorItem } from "@registry/items/editor"
import { editorAiItem } from "@registry/items/editor-ai"
import { editorAssetsItem } from "@registry/items/editor-assets"
import { editorAuthItem } from "@registry/items/editor-auth"
import { editorBlockSelectionItem } from "@registry/items/editor-block-selection"
import { editorBlocksItem } from "@registry/items/editor-blocks"
import { editorCodeItem } from "@registry/items/editor-code"
import { editorCodeFormatItem } from "@registry/items/editor-code-format"
import { editorCollaborationItem } from "@registry/items/editor-collaboration"
import { editorCollaborationBunItem } from "@registry/items/editor-collaboration-bun"
import { editorCollaborationNodeItem } from "@registry/items/editor-collaboration-node"
import { editorCollaborationServerItem } from "@registry/items/editor-collaboration-server"
import { editorCollaborationWorkerItem } from "@registry/items/editor-collaboration-worker"
import { editorColumnsItem } from "@registry/items/editor-columns"
import { editorCsvItem } from "@registry/items/editor-csv"
import { editorDateItem } from "@registry/items/editor-date"
import { editorDocumentItem } from "@registry/items/editor-document"
import { editorFootnotesItem } from "@registry/items/editor-footnotes"
import { editorMathItem } from "@registry/items/editor-math"
import { editorMediaItem } from "@registry/items/editor-media"
import { editorReviewItem } from "@registry/items/editor-review"
import { editorStoreItem } from "@registry/items/editor-store"
import { editorTocItem } from "@registry/items/editor-toc"
import { editorTypeaheadItem } from "@registry/items/editor-typeahead"
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
  editorAssetsItem,
  editorAuthItem,
  editorBlocksItem,
  editorMathItem,
  editorMediaItem,
  editorCollaborationItem,
  editorCollaborationBunItem,
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
  editorDocumentItem,
  editorStoreItem,
  editorReviewItem,
  editorTypeaheadItem,
]
