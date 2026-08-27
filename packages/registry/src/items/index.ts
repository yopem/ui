import { displayFormItems } from "@registry/items/display-form"
import { foundationItems } from "@registry/items/foundation"
import { remainingItems } from "@registry/items/remaining"

export const sourceItems = [
  ...foundationItems,
  ...displayFormItems,
  ...remainingItems,
]
