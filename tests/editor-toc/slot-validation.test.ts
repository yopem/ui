import { validateEditorTocJSON } from "@editor/toc-model"
import { expect, test } from "bun:test"

interface TocFixtureNode {
  type: string
  version?: number
  extra?: boolean
  children?: TocFixtureNode[]
  $slots?: Record<string, TocFixtureNode>
}

const toc = { type: "editor-toc", version: 1 }

function nestedSlot(depth: number): TocFixtureNode {
  if (depth === 0) return toc

  return { type: "quote", children: [nestedSlot(depth - 1)] }
}

test("TOC validation visits root slots and retains placement rules", () => {
  const document = (slot: TocFixtureNode) => ({
    root: { type: "root", children: [], $slots: { contents: slot } },
  })

  expect(() => validateEditorTocJSON(document(toc))).not.toThrow()
  expect(() =>
    validateEditorTocJSON(document({ ...toc, extra: true })),
  ).toThrow()
  expect(() =>
    validateEditorTocJSON(document({ ...toc, version: 2 })),
  ).toThrow()
  expect(() =>
    validateEditorTocJSON(document({ type: "editor-toc-unknown" })),
  ).toThrow()
  expect(() =>
    validateEditorTocJSON(document({ type: "quote", children: [toc] })),
  ).toThrow()
  expect(() =>
    validateEditorTocJSON(
      document({ type: "quote", children: [], $slots: { nested: toc } }),
    ),
  ).toThrow()
})

test("root slots count toward TOC depth and node limits", () => {
  const document = {
    root: { type: "root", children: [], $slots: { slot: nestedSlot(64) } },
  }

  expect(() => validateEditorTocJSON(document)).toThrow("too deep")

  const wide = {
    root: {
      type: "root",
      children: [],
      $slots: {
        slot: {
          type: "quote",
          children: Array.from({ length: 10_000 }, () => ({
            type: "paragraph",
          })),
        },
      },
    },
  }

  expect(() => validateEditorTocJSON(wide)).toThrow("too many nodes")
})
