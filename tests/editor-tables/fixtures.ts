export interface TestNode {
  type: string
  children?: TestNode[]
}

export function cell(colSpan = 1, rowSpan = 1) {
  return {
    type: "tablecell",
    colSpan,
    rowSpan,
    children: [
      {
        type: "paragraph",
        children: [{ type: "text", text: "Rich", format: 1 }],
      },
    ],
  }
}

export function table(rows = 2, columns = 2) {
  return {
    type: "table",
    children: Array.from({ length: rows }, () => ({
      type: "tablerow",
      children: Array.from({ length: columns }, () => cell()),
    })),
  }
}

export function document<T extends TestNode>(...children: T[]) {
  return { root: { type: "root", children } }
}
