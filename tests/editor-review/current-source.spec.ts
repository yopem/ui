import { EditorBlockPresentationExtension } from "@editor/block-presentation-extension"
import {
  makeReviewRichContent,
  parseReviewRichContent,
  reviewRichText,
} from "@editor/review-richtext"
import { EditorReviewRichTextExtension } from "@editor/review-richtext-native"
import { buildEditorFromExtensions } from "@lexical/extension"
import { expect, test } from "bun:test"
import { $getRoot, $createParagraphNode, $createTextNode } from "lexical"

test("native rich reply edits keep valid paragraphs and text formats", () => {
  const editor = buildEditorFromExtensions(
    EditorBlockPresentationExtension,
    EditorReviewRichTextExtension,
  )

  editor.setEditorState(
    editor.parseEditorState(
      JSON.stringify(makeReviewRichContent("Review content")),
    ),
  )
  editor.update(
    () => {
      $getRoot().append(
        $createParagraphNode().append(
          $createTextNode("Reply").setFormat("bold"),
        ),
      )
    },
    { discrete: true },
  )
  const value = parseReviewRichContent(editor.getEditorState().toJSON())
  expect(reviewRichText(value)).toBe("Review content\n\nReply")
  expect(value.root.children[1].children[0]).toMatchObject({
    type: "text",
    text: "Reply",
    format: 1,
  })
  editor.dispose()
})
