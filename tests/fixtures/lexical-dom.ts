import { withDOM as withLexicalDOM } from "@lexical/headless/dom"

export function withDOM<T>(run: (window: typeof globalThis.window) => T) {
  const previous = new Map(
    [
      "window",
      "document",
      "MutationObserver",
      "DOMParser",
      "getComputedStyle",
    ].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]),
  )

  try {
    return withLexicalDOM(run)
  } finally {
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else Reflect.deleteProperty(globalThis, key)
    }
  }
}
