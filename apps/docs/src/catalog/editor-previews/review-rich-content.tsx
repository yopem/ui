"use client"

import {
  EditorReviewRichContent,
  makeReviewRichContent,
} from "@yopem-ui/editor/review"

const content = makeReviewRichContent("Review content")

export function Preview() {
  return <EditorReviewRichContent content={content} />
}
