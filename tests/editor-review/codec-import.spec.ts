import {
  parseReviewDocumentJSON,
  parseReviewDocument,
  sanitizeEditorReviewClipboard,
  reviewInlineHTML,
} from "@yopem-ui/editor/review-codecs"
import { expect, test } from "bun:test"

const data = { version: 1, threads: [] }

test("trusted review metadata requires its canonical root location", () => {
  expect(() =>
    parseReviewDocument({ root: { type: "text", text: "Wrong root" } }, true),
  ).toThrow()
  expect(() =>
    parseReviewDocument(
      {
        root: {
          type: "root",
          children: [
            { type: "paragraph", children: [], $: { yopemReview: data } },
          ],
        },
      },
      true,
    ),
  ).toThrow()
})

test("duplicate mark IDs cannot leave an anchor after thread deletion", () => {
  expect(() =>
    parseReviewDocument(
      {
        root: {
          type: "root",
          children: [
            { type: "mark", ids: ["thread-1", "thread-1"], children: [] },
          ],
        },
      },
      true,
    ),
  ).toThrow()
  expect(() =>
    parseReviewDocument(
      {
        root: {
          type: "root",
          children: [
            { type: "mark", ids: ["thread-1", "thread-2"], children: [] },
          ],
        },
      },
      true,
    ),
  ).not.toThrow()
})

test("untrusted documents lose review authority but keep text and unrelated NodeState", () => {
  const value = parseReviewDocument(
    {
      root: {
        type: "root",
        $: { yopemReview: data, custom: { keep: true } },
        children: [
          {
            type: "paragraph",
            children: [
              {
                type: "mark",
                ids: ["thread-1"],
                children: [
                  {
                    type: "text",
                    text: "Original",
                    $: { yopemSuggestion: { forged: true }, custom: "keep" },
                  },
                ],
              },
            ],
          },
        ],
      },
    },
    false,
  )

  expect(value).toEqual({
    root: {
      type: "root",
      $: { custom: { keep: true } },
      children: [
        {
          type: "paragraph",
          children: [{ type: "text", text: "Original", $: { custom: "keep" } }],
        },
      ],
    },
  })
})

test("native clipboard JSON cannot import author or thread authority", () => {
  const source = JSON.stringify({
    namespace: "editor",
    nodes: [
      {
        type: "mark",
        ids: ["thread-1"],
        children: [
          {
            type: "text",
            text: "Original",
            $: { yopemSuggestion: { forged: true } },
          },
        ],
      },
    ],
  })

  expect(sanitizeEditorReviewClipboard(source)).toEqual({
    namespace: "editor",
    nodes: [{ type: "text", text: "Original" }],
  })
  expect(() => sanitizeEditorReviewClipboard("{")).toThrow()
  expect(() => sanitizeEditorReviewClipboard(" ".repeat(1048577))).toThrow()
})

test("native clipboard JSON enforces its UTF-8 byte limit", () => {
  const input = JSON.stringify({
    namespace: "editor",
    nodes: [{ type: "text", text: "界".repeat(350000) }],
  })

  expect(input.length).toBeLessThan(1048576)
  expect(new TextEncoder().encode(input).byteLength).toBeGreaterThan(1048576)
  expect(() => sanitizeEditorReviewClipboard(input)).toThrow()
})

test("native clipboard rejects rich state rather than discarding it", () => {
  expect(() =>
    sanitizeEditorReviewClipboard(
      JSON.stringify({
        namespace: "editor",
        nodes: [{ type: "text", text: "Keep", format: 8 }],
      }),
    ),
  ).toThrow()
  expect(() =>
    sanitizeEditorReviewClipboard(
      JSON.stringify({
        namespace: "editor",
        nodes: [{ type: "text", text: "Keep", $: { custom: true } }],
      }),
    ),
  ).toThrow()
  expect(() =>
    sanitizeEditorReviewClipboard(
      JSON.stringify({
        namespace: "editor",
        nodes: [{ type: "table", children: [] }],
      }),
    ),
  ).toThrow()
})

test("sparse collection bounds run before array elements are read", () => {
  let reads = 0
  const elements: null[] = []
  elements.length = 100001

  const sparse = new Proxy(elements, {
    get(target, key) {
      if (key === "length") return target.length

      if (key === "0") reads++

      return null
    },
  })

  expect(() =>
    parseReviewDocument(
      { root: { type: "root", children: [], $: { custom: sparse } } },
      true,
    ),
  ).toThrow()
  expect(reads).toBe(0)
})

test("inline HTML refuses oversized text before encoding", () => {
  expect(() => reviewInlineHTML("x".repeat(1048577), null)).toThrow()
})

test("prototype metadata is rejected rather than changing object prototypes", () => {
  const value: unknown = JSON.parse(
    '{"root":{"type":"root","children":[],"$":{"custom":{"__proto__":{"polluted":true}}}}}',
  )

  expect(() => parseReviewDocument(value, true)).toThrow()
  expect(Object.hasOwn(Object.prototype, "polluted")).toBe(false)
})

test("untrusted named slot descendants cannot retain review authority", () => {
  const result = parseReviewDocument(
    {
      root: {
        type: "root",
        children: [],
        $slots: {
          caption: {
            type: "paragraph",
            children: [
              {
                type: "text",
                text: "Caption",
                $: { yopemSuggestion: { forged: true }, custom: true },
              },
            ],
          },
        },
      },
    },
    false,
  )

  expect(result).toEqual({
    root: {
      type: "root",
      children: [],
      $slots: {
        caption: {
          type: "paragraph",
          children: [{ type: "text", text: "Caption", $: { custom: true } }],
        },
      },
    },
  })
})

test("document JSON decoder rejects oversized and malformed input before import", () => {
  expect(
    parseReviewDocumentJSON('{"root":{"type":"root","children":[]}}', true),
  ).toEqual({
    root: { type: "root", children: [] },
  })
  expect(() => parseReviewDocumentJSON("{", true)).toThrow()
  expect(() => parseReviewDocumentJSON(" ".repeat(1048577), true)).toThrow()
})

test("document JSON byte limits reject multibyte payloads below the character limit", () => {
  const input = JSON.stringify({
    root: { type: "root", children: [], $: { custom: "界".repeat(400000) } },
  })

  expect(input.length).toBeLessThan(1048576)
  expect(() => parseReviewDocumentJSON(input, true)).toThrow()
})

test("review metadata rejects nested roots, malformed envelopes, and cross-entity IDs", () => {
  const data = {
    version: 1,
    threads: [
      {
        id: "same",
        resolved: false,
        comments: [
          {
            id: "comment",
            author: { id: "alice", name: "Alice" },
            text: "Note",
            createdAt: 1,
            updatedAt: 1,
          },
        ],
      },
    ],
  }

  expect(() =>
    parseReviewDocument(
      {
        root: {
          type: "root",
          children: [{ type: "root", children: [], $: { yopemReview: data } }],
        },
      },
      true,
    ),
  ).toThrow()
  expect(() =>
    parseReviewDocument({ root: { type: "root", children: [], $: [] } }, true),
  ).toThrow()
  expect(() =>
    parseReviewDocument(
      {
        root: {
          type: "root",
          $: { yopemReview: data },
          children: [
            {
              type: "text",
              text: "Original",
              $: {
                yopemSuggestion: {
                  id: "same",
                  kind: "delete",
                  author: { id: "alice", name: "Alice" },
                  createdAt: 1,
                  beforeFormat: 0,
                },
              },
            },
          ],
        },
      },
      true,
    ),
  ).toThrow()
})

test("aggregate sparse collection budgets stop before indexed reads", () => {
  let reads = 0

  const arrays = Array.from({ length: 3 }, () => {
    const value: unknown[] = []
    value.length = 50000

    return new Proxy(value, {
      get(target, key) {
        if (/^\d+$/.test(String(key))) reads++

        if (key === "length") return target.length

        if (key === Symbol.iterator) return target[Symbol.iterator]

        return /^\d+$/.test(String(key)) ? target[Number(key)] : undefined
      },
    })
  })

  expect(() =>
    parseReviewDocument({ root: { type: "root", children: arrays } }, true),
  ).toThrow()
  expect(reads).toBe(0)
})

test("document trust requires a literal validated boolean", () => {
  const document = { root: { type: "root", children: [] } }
  expect(() => parseReviewDocument(document, "false")).toThrow()
  expect(() => parseReviewDocument(document, 1)).toThrow()
  expect(() => parseReviewDocument(document, true)).not.toThrow()
})

test("trusted suggestions reject token and segmented text modes", () => {
  for (const mode of ["token", "segmented"]) {
    expect(() =>
      parseReviewDocument(
        {
          root: {
            type: "root",
            children: [
              {
                type: "paragraph",
                children: [
                  {
                    type: "text",
                    text: "Keep",
                    mode,
                    $: {
                      yopemSuggestion: {
                        id: "suggestion",
                        author: { id: "alice", name: "Alice" },
                        createdAt: 1,
                        kind: "delete",
                        beforeFormat: 0,
                      },
                    },
                  },
                ],
              },
            ],
          },
        },
        true,
      ),
    ).toThrow()
  }
})

test("trusted native operation markers round-trip and untrusted markers are stripped", () => {
  const document = {
    root: {
      type: "root",
      children: [
        {
          type: "paragraph",
          $: {
            yopemReviewNativeOperation: {
              version: 1,
              id: "operation-1",
              kind: "insert",
            },
          },
          children: [
            {
              type: "text",
              text: "Inserted",
              $: {
                yopemSuggestion: {
                  id: "operation-1",
                  author: { id: "alice", name: "Alice" },
                  createdAt: 1,
                  kind: "insert",
                  beforeFormat: 0,
                },
              },
            },
          ],
        },
      ],
    },
  }

  expect(parseReviewDocumentJSON(JSON.stringify(document), true)).toEqual(
    document,
  )
  const untrusted = parseReviewDocument(document, false)

  expect(JSON.stringify(untrusted)).not.toContain("yopemReviewNativeOperation")
  expect(JSON.stringify(untrusted)).not.toContain("yopemSuggestion")
  expect(JSON.stringify(untrusted)).not.toContain("operation-1")
})

test("empty insert operation blocks require attributed sibling ownership", () => {
  const marker = {
    version: 1,
    id: "operation-1",
    kind: "insert",
  }

  const suggestion = {
    id: "operation-1",
    author: { id: "alice", name: "Alice" },
    createdAt: 1,
    kind: "insert",
    beforeFormat: 0,
  }

  const emptyBlock = {
    type: "paragraph",
    $: { yopemReviewNativeOperation: marker },
    children: [],
  }

  const attributedBlock = {
    type: "paragraph",
    $: { yopemReviewNativeOperation: marker },
    children: [
      {
        type: "text",
        text: "Inserted",
        $: { yopemSuggestion: suggestion },
      },
    ],
  }

  const groupedDocument = {
    root: {
      type: "root",
      children: [emptyBlock, attributedBlock],
    },
  }

  expect(
    parseReviewDocumentJSON(JSON.stringify(groupedDocument), true),
  ).toEqual(groupedDocument)
  expect(() =>
    parseReviewDocumentJSON(
      JSON.stringify({
        root: {
          type: "root",
          children: [
            emptyBlock,
            {
              type: "paragraph",
              children: [
                {
                  type: "text",
                  text: "Inserted",
                  $: { yopemSuggestion: suggestion },
                },
              ],
            },
          ],
        },
      }),
      true,
    ),
  ).toThrow()
})

test("native operation markers reject malformed placement and attribution", () => {
  const author = { id: "alice", name: "Alice" }
  const marker = { version: 1, id: "operation-1", kind: "insert" }

  const suggestion = {
    id: "operation-1",
    author,
    createdAt: 1,
    kind: "insert",
    beforeFormat: 0,
  }

  function document(
    nodeType: string,
    operation: typeof marker & { extra?: boolean },
    textSuggestion: typeof suggestion | undefined,
  ) {
    interface NativeReviewTextFixture {
      type: "text"
      text: string
      $?: { yopemSuggestion: typeof suggestion }
    }

    const textNode: NativeReviewTextFixture = {
      type: "text",
      text: "Inserted",
    }

    if (textSuggestion !== undefined)
      textNode.$ = { yopemSuggestion: textSuggestion }

    return {
      root: {
        type: "root",
        children: [
          {
            type: nodeType,
            $: { yopemReviewNativeOperation: operation },
            children: [textNode],
          },
        ],
      },
    }
  }

  expect(() =>
    parseReviewDocument(
      document("paragraph", { ...marker, version: 2 }, suggestion),
      true,
    ),
  ).toThrow()
  expect(() =>
    parseReviewDocument(
      document("paragraph", { ...marker, extra: true }, suggestion),
      true,
    ),
  ).toThrow()
  expect(() =>
    parseReviewDocument(document("quote", marker, suggestion), true),
  ).toThrow()
  expect(() =>
    parseReviewDocument(
      document("paragraph", marker, { ...suggestion, id: "other-operation" }),
      true,
    ),
  ).toThrow()
  expect(() =>
    parseReviewDocument(
      document("paragraph", marker, { ...suggestion, kind: "delete" }),
      true,
    ),
  ).toThrow()
  expect(() =>
    parseReviewDocument(document("paragraph", marker, undefined), true),
  ).toThrow()
  expect(() =>
    parseReviewDocument(
      {
        root: {
          type: "root",
          children: [
            {
              type: "paragraph",
              $: { yopemReviewNativeOperation: marker },
              children: [
                {
                  type: "text",
                  text: "One",
                  $: { yopemSuggestion: suggestion },
                },
                {
                  type: "text",
                  text: "Two",
                  $: {
                    yopemSuggestion: {
                      ...suggestion,
                      author: { id: "bob", name: "Bob" },
                    },
                  },
                },
              ],
            },
          ],
        },
      },
      true,
    ),
  ).toThrow()
  expect(() =>
    parseReviewDocument(
      {
        root: {
          type: "root",
          children: [
            {
              type: "paragraph",
              $: { yopemReviewNativeOperation: marker },
              children: [
                {
                  type: "list",
                  $: { yopemReviewNativeOperation: marker },
                  children: [
                    {
                      type: "listitem",
                      children: [
                        {
                          type: "text",
                          text: "Inserted",
                          $: { yopemSuggestion: suggestion },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
      true,
    ),
  ).toThrow()
  expect(() =>
    parseReviewDocument(
      {
        root: {
          type: "root",
          children: [
            {
              type: "paragraph",
              $: { yopemReviewNativeOperation: marker },
              children: [
                {
                  type: "text",
                  text: "Inserted",
                  $: { yopemSuggestion: suggestion },
                },
                { type: "text", text: "Unmarked" },
              ],
            },
          ],
        },
      },
      true,
    ),
  ).toThrow()
  expect(() =>
    parseReviewDocument(
      {
        root: {
          type: "root",
          children: [
            {
              type: "paragraph",
              $: { yopemReviewNativeOperation: marker },
              children: [
                {
                  type: "text",
                  text: "Inserted",
                  $: { yopemSuggestion: suggestion },
                },
                { type: "horizontalrule" },
              ],
            },
          ],
        },
      },
      true,
    ),
  ).toThrow()
  expect(() =>
    parseReviewDocument(
      {
        root: {
          type: "root",
          children: [
            {
              type: "paragraph",
              $: { yopemReviewNativeOperation: marker },
              children: [
                {
                  type: "text",
                  text: "Inserted",
                  $: { yopemSuggestion: suggestion },
                },
                {
                  type: "text",
                  text: "Wrapper",
                  $: { yopemSuggestion: suggestion },
                  children: [{ type: "text", text: "Hidden" }],
                },
              ],
            },
          ],
        },
      },
      true,
    ),
  ).toThrow()
  expect(() =>
    parseReviewDocument(
      {
        root: {
          type: "root",
          children: [
            {
              type: "paragraph",
              $: { yopemReviewNativeOperation: marker },
              children: [
                {
                  type: "text",
                  text: "Inserted",
                  $: { yopemSuggestion: suggestion },
                },
                {
                  type: "linebreak",
                  children: [{ type: "text", text: "Hidden" }],
                },
              ],
            },
          ],
        },
      },
      true,
    ),
  ).toThrow()
})

test("untrusted structural metadata cannot widen ordinary document depth", () => {
  interface NestedState {
    child?: NestedState
  }

  let nested: NestedState = {}

  for (let index = 0; index < 30; index += 1) nested = { child: nested }

  const input = {
    root: {
      type: "root",
      children: [],
      $: { custom: nested, yopemReviewStructural: null },
    },
  }

  expect(() => parseReviewDocument(input, false)).toThrow()
  expect(parseReviewDocument(input, false, true)).toHaveProperty(
    "root.$.custom",
    nested,
  )
})
