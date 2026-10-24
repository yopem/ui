"use client"

import { EditorReviewPreset } from "@yopem-ui/editor/review"

const host = {
  viewer: { id: "demo-reviewer", name: "Demo reviewer" },
  visible: true,
  replyWhileReadonly: false,
  can: () => true,
}

export function Preview() {
  return <EditorReviewPreset host={host} ariaLabel="Review document" />
}
