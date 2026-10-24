export function isElement(node: Node): node is Element {
  return node.nodeType === 1
}
