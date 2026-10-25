import { isEditorEditableCardInteractiveTarget } from "@editor/editable-card-extension"
import { expect, test } from "bun:test"

test("editable card key handling targets interactive nodes across DOM realms", () => {
  const foreignInputElement = {}

  const foreignInput = {
    closest(selector: string) {
      return selector.includes('[data-slot="editor-editable-card"] input')
        ? foreignInputElement
        : null
    },
  }

  const foreignParagraph = {
    closest() {
      return null
    },
  }

  expect(isEditorEditableCardInteractiveTarget(foreignInput)).toBe(true)
  expect(isEditorEditableCardInteractiveTarget(foreignParagraph)).toBe(false)
})
