import { displayFormItems } from "@registry/items/display-form"
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
]
