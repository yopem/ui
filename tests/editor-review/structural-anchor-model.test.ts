import { preserveEditorReviewTreeMarks } from "@yopem-ui/editor/review-tree-diff"
import { expect, test } from "bun:test"

type ReviewAnchorJsonValue =
  | string
  | number
  | boolean
  | null
  | ReviewAnchorJsonValue[]
  | ReviewAnchorJsonObject

interface ReviewAnchorJsonObject {
  [key: string]: ReviewAnchorJsonValue
}

function text(value: string, properties: ReviewAnchorJsonObject = {}) {
  return { type: "text", text: value, mode: "normal", ...properties }
}

function paragraph(children: ReviewAnchorJsonValue[]) {
  return { type: "paragraph", children }
}

function document(children: ReviewAnchorJsonValue[]) {
  return { root: { type: "root", children } }
}

function mark(ids: readonly string[], children: ReviewAnchorJsonValue[]) {
  return { type: "mark", ids: [...ids], children }
}

function anchoredDocument(values: readonly string[]) {
  return document([
    paragraph([
      mark(
        ["thread-1"],
        values.map((value) => text(value)),
      ),
    ]),
  ])
}

function plainDocument(values: readonly string[]) {
  return document([paragraph(values.map((value) => text(value)))])
}

test("preserves single-leaf mark properties and state", () => {
  const sourceMark = {
    ...mark(["thread-1"], [text("Anchor")]),
    sourceProperty: { kind: "retained" },
    $: { anchorState: { version: 1 } },
  }

  const targetText = text("Anchor", { format: 1, style: "font-weight: 700;" })

  expect(
    preserveEditorReviewTreeMarks(
      document([paragraph([sourceMark])]),
      document([paragraph([targetText])]),
    ),
  ).toEqual(document([paragraph([{ ...sourceMark, children: [targetText] }])]))
})

test("preserves target formatting and multi-leaf mark state", () => {
  const sourceMark = {
    ...mark(
      ["thread-1", "thread-2"],
      [text("Bold", { format: 1 }), text(" normal", { format: 0 })],
    ),
    version: 1,
    sourceProperty: { kind: "retained" },
    $: { anchorState: { version: 1 } },
  }

  const boldTarget = text("Bold", {
    format: 1,
    style: "font-weight: 700;",
    $: { targetTextState: "bold" },
  })

  const normalTarget = text(" normal", {
    format: 0,
    style: "",
    $: { targetTextState: "normal" },
  })

  expect(
    preserveEditorReviewTreeMarks(
      document([paragraph([sourceMark])]),
      document([paragraph([boldTarget, normalTarget])]),
    ),
  ).toEqual(
    document([
      paragraph([
        { ...sourceMark, children: [boldTarget] },
        { ...sourceMark, children: [normalTarget] },
      ]),
    ]),
  )
})

test("preserves nested IDs and rejects nested ID overlap", () => {
  const inner = {
    ...mark(["inner-thread"], [text("Overlap")]),
    sourceProperty: "inner",
    $: { anchorState: "inner" },
  }

  const outer = {
    ...mark(["outer-thread"], [inner]),
    sourceProperty: "outer",
    $: { anchorState: "outer" },
  }

  const targetText = text("Overlap", { format: 2 })

  expect(
    preserveEditorReviewTreeMarks(
      document([paragraph([outer])]),
      document([paragraph([targetText])]),
    ),
  ).toEqual(
    document([
      paragraph([
        {
          ...outer,
          children: [
            {
              ...inner,
              children: [targetText],
            },
          ],
        },
      ]),
    ]),
  )

  const overlapping = {
    ...mark(["same-thread"], [mark(["same-thread"], [text("Overlap")])]),
  }

  expect(
    preserveEditorReviewTreeMarks(
      document([paragraph([overlapping])]),
      document([paragraph([targetText])]),
    ),
  ).toBeNull()
})

test("allows a shared ID on separate, uniquely matched mark nodes", () => {
  const source = document([
    paragraph([
      mark(["thread-1"], [text("First")]),
      mark(["thread-1"], [text("Second")]),
    ]),
  ])

  const target = plainDocument(["First", "Second"])

  expect(preserveEditorReviewTreeMarks(source, target)).toEqual(
    document([
      paragraph([
        mark(["thread-1"], [text("First")]),
        mark(["thread-1"], [text("Second")]),
      ]),
    ]),
  )
})

test.each([
  ["removed", ["Anchor"], ["Replacement"]],
  ["duplicate target", ["Anchor"], ["Anchor", "Anchor"]],
  ["duplicate source", ["Anchor", "Anchor"], ["Anchor", "Other"]],
  ["split", ["Anchor"], ["An", "chor"]],
  ["merged", ["An", "chor"], ["Anchor"]],
] as const)("rejects %s leaf correspondence", (_name, source, target) => {
  expect(
    preserveEditorReviewTreeMarks(
      anchoredDocument(source),
      plainDocument(target),
    ),
  ).toBeNull()
})

test("restores anchors inside named slots without moving them", () => {
  const source = document([
    {
      type: "container",
      $slots: {
        body: paragraph([mark(["slot-thread"], [text("Slot text")])]),
      },
    },
  ])

  const target = document([
    {
      type: "container",
      $slots: {
        body: paragraph([text("Slot text", { format: 1 })]),
      },
    },
  ])

  expect(preserveEditorReviewTreeMarks(source, target)).toEqual(
    document([
      {
        type: "container",
        $slots: {
          body: paragraph([
            mark(["slot-thread"], [text("Slot text", { format: 1 })]),
          ]),
        },
      },
    ]),
  )
})

test("keeps root ownership and existing input bounds", () => {
  const source = anchoredDocument(["Anchor"])
  const target = plainDocument(["Anchor"])

  expect(() =>
    preserveEditorReviewTreeMarks(
      { root: { type: "paragraph", children: [] } },
      target,
    ),
  ).toThrow("Expected a Lexical source root.")
  expect(() =>
    preserveEditorReviewTreeMarks(source, {
      root: { type: "paragraph", children: [] },
    }),
  ).toThrow()
  expect(() =>
    preserveEditorReviewTreeMarks(
      document([
        paragraph([
          mark(
            Array.from({ length: 257 }, (_, index) => `thread-${index}`),
            [text("Anchor")],
          ),
        ]),
      ]),
      target,
    ),
  ).toThrow()
  expect(() =>
    preserveEditorReviewTreeMarks(
      source,
      document([
        paragraph(
          Array.from({ length: 257 }, (_, index) => text(`leaf-${index}`)),
        ),
      ]),
    ),
  ).toThrow()
})
