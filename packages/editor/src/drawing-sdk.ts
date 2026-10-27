import { EDITOR_DRAWING_MAX_ELEMENTS } from "./drawing-model"

export function normalizeEditorDrawingSdkElements(elements: readonly object[]) {
  if (elements.length > EDITOR_DRAWING_MAX_ELEMENTS)
    throw new Error("Editor drawing scene exceeds element limit")

  return elements.map((element) => {
    const customData = Object.getOwnPropertyDescriptor(element, "customData")

    if (
      Object.getPrototypeOf(element) !== Object.prototype ||
      !customData ||
      !customData.enumerable ||
      !("value" in customData) ||
      customData.value !== undefined
    )
      return element

    const descriptors = Object.getOwnPropertyDescriptors(element)

    Reflect.deleteProperty(descriptors, "customData")

    return Object.defineProperties({}, descriptors)
  })
}
