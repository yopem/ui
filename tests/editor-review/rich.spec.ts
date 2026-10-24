import { buildEditorFromExtensions } from "@lexical/extension"
import { parseEditorReview } from "@yopem-ui/editor/review-codecs"
import { createEditorReview } from "@yopem-ui/editor/review-extension"
import {
  makeReviewRichContent,
  parseReviewRichContent,
  reviewRichHTML,
  reviewRichText,
} from "@yopem-ui/editor/review-richtext"
import {
  EditorReviewRichTextExtension,
  $toggleEditorReviewKeyboard,
  editorReviewKeyboardState,
} from "@yopem-ui/editor/review-richtext-native"
import { expect, test } from "bun:test"
import { $getState } from "lexical"
import { $createParagraphNode, $createTextNode, $getRoot } from "lexical"

const body = {
  root: {
    type: "root",
    children: [
      {
        type: "paragraph",
        children: [
          {
            type: "text",
            text: "Rich <script>",
            format: 3,
            $: { yopemReviewKeyboard: true },
          },
        ],
      },
    ],
  },
}

test("rich discussion codec keeps basic marks and escapes semantic HTML", () => {
  const content = parseReviewRichContent(body)
  expect(reviewRichText(content)).toBe("Rich <script>")
  const html = reviewRichHTML(content)
  expect(html).toContain("<strong>")
  expect(html).toContain("<em>")
  expect(html).toContain("<kbd>")
  expect(html).not.toContain("<script>")
  expect(Object.isFrozen(content.root.children[0].children)).toBe(true)
  expect(() =>
    parseReviewRichContent({
      root: {
        type: "root",
        children: [
          {
            type: "paragraph",
            children: [
              {
                type: "text",
                text: "Bad",
                style: "background:url(https://invalid.example)",
              },
            ],
          },
        ],
      },
    }),
  ).toThrow()
  expect(() =>
    parseReviewRichContent({
      root: {
        type: "root",
        children: [{ type: "link", url: "javascript:alert(1)", children: [] }],
      },
    }),
  ).toThrow()
  expect(() =>
    parseReviewRichContent({
      root: {
        type: "root",
        children: [
          {
            type: "paragraph",
            children: [
              { type: "text", text: "Bad", $: { yopemSuggestion: {} } },
            ],
          },
        ],
      },
    }),
  ).toThrow()
  expect(() =>
    parseReviewRichContent({
      root: {
        type: "root",
        children: [
          {
            type: "paragraph",
            children: [{ type: "text", text: "x".repeat(16385) }],
          },
        ],
      },
    }),
  ).toThrow()
})

test("rich comments persist with matching text and host-authored attribution", () => {
  const scope = createEditorReview()
  const editor = buildEditorFromExtensions(scope.extension)
  const review = scope.forEditor(editor)
  const content = parseReviewRichContent(body)
  review.setHost({
    viewer: { id: "alice", name: "Alice" },
    visible: true,
    replyWhileReadonly: false,
    can: () => true,
  })
  editor.update(
    () => {
      const text = $createTextNode("Original")
      $getRoot().clear().append($createParagraphNode().append(text))
      text.select(0, 8)
    },
    { discrete: true },
  )
  let id = ""
  expect(
    review.run(() => {
      id = review.$createThread("Rich <script>", content)
    }),
  ).toBe(true)
  expect(
    review.run(() => {
      review.$reply(id, "Rich <script>", content)
    }),
  ).toBe(true)
  expect(review.getView().data.threads[0].comments[1].content).toEqual(content)
  expect(review.getView().data.threads[0].comments[1].author.id).toBe("alice")
  expect(
    review.run(() => {
      review.$editComment(
        id,
        review.getView().data.threads[0].comments[1].id,
        "Mismatch",
        content,
      )
    }),
  ).toBe(false)
  expect(() =>
    parseEditorReview({
      version: 1,
      threads: [
        {
          id: "thread",
          resolved: false,
          comments: [
            {
              id: "comment",
              author: { id: "alice", name: "Alice" },
              createdAt: 1,
              updatedAt: 1,
              text: "Mismatch",
              content,
            },
          ],
        },
      ],
    }),
  ).toThrow()
  editor.read(() => expect($getRoot().getTextContent()).toBe("Original"))
  editor.dispose()
})

test("keyboard marks split selected draft text without changing other formats", () => {
  const editor = buildEditorFromExtensions(EditorReviewRichTextExtension)
  editor.update(
    () => {
      const text = $createTextNode("Original").setFormat("bold")
      $getRoot().clear().append($createParagraphNode().append(text))
      text.select(2, 5)
      $toggleEditorReviewKeyboard()
    },
    { discrete: true },
  )
  editor.read(() => {
    expect($getRoot().getTextContent()).toBe("Original")
    expect(
      $getRoot()
        .getAllTextNodes()
        .some((node) => $getState(node, editorReviewKeyboardState)),
    ).toBe(true)
    expect(
      $getRoot()
        .getAllTextNodes()
        .every((node) => node.hasFormat("bold")),
    ).toBe(true)
  })
  expect(
    reviewRichHTML(parseReviewRichContent(editor.getEditorState().toJSON())),
  ).toContain("<kbd>")
  editor.dispose()
})

test("rich canonicalization rejects hidden JSON accessors before calling them", () => {
  let calls = 0

  const value = {
    root: { type: "root", children: [{ type: "paragraph", children: [] }] },
  }

  Object.defineProperty(value, "toJSON", {
    get() {
      calls++
      throw new Error("Accessor executed")
    },
  })
  expect(() => parseReviewRichContent(value)).toThrow()
  expect(calls).toBe(0)
})

test("plain discussion builders reject oversized input before conversion", () => {
  expect(() => makeReviewRichContent("x".repeat(16385))).toThrow()
})

test("rich arrays cannot inherit serialization hooks", () => {
  let calls = 0
  const value = makeReviewRichContent("Keep")
  const children = [...value.root.children]
  Object.setPrototypeOf(children, {
    toJSON() {
      calls += 1

      return []
    },
  })
  expect(() =>
    parseReviewRichContent({ root: { ...value.root, children } }),
  ).toThrow()
  expect(calls).toBe(0)
})
