import { displayFormItems } from "@registry/items/display-form"
import { editorItem } from "@registry/items/editor"
import { editorAuthItem } from "@registry/items/editor-auth"
import { editorBlocksItem } from "@registry/items/editor-blocks"
import { editorCodeItem } from "@registry/items/editor-code"
import { editorCodeFormatItem } from "@registry/items/editor-code-format"
import { editorColumnsItem } from "@registry/items/editor-columns"
import { editorDateItem } from "@registry/items/editor-date"
import { editorDocumentItem } from "@registry/items/editor-document"
import { editorMathItem } from "@registry/items/editor-math"
import { editorStoreItem } from "@registry/items/editor-store"
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
  editorAuthItem,
  editorBlocksItem,
  editorMathItem,
  editorCodeItem,
  editorColumnsItem,
  editorDateItem,
  editorCodeFormatItem,
  editorDocumentItem,
  editorStoreItem,
  editorTypeaheadItem,
]
