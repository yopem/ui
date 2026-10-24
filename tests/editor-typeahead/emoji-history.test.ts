import { createEditorEmojiHistory } from "@editor/emoji-history"
import {
  editorEmojiInventory,
  searchEditorEmoji,
} from "@editor/typeahead-emoji"
import { expect, test } from "bun:test"

test("frequency storage is bounded, counts selections, and clears explicitly", () => {
  const history = createEditorEmojiHistory()
  const coder = { id: "coder", label: "Coder", emoji: "👩🏽‍💻", aliases: ["coder"] }
  const wave = { id: "wave", label: "Wave", emoji: "👋", aliases: ["wave"] }
  history.record(coder)
  history.record(wave)
  history.record(coder)
  expect(
    history.getSnapshot().map((entry) => [entry.emoji.id, entry.count]),
  ).toEqual([
    ["coder", 2],
    ["wave", 1],
  ])

  for (let index = 0; index < 60; index++)
    history.record({ ...wave, id: `wave-${index}` })
  expect(history.getSnapshot()).toHaveLength(50)
  expect(() => history.record({ ...wave, emoji: "not emoji" })).toThrow()
  history.clear()
  expect(history.getSnapshot()).toEqual([])
})

test("category browsing pages full published inventory without repeating entries", () => {
  const first = searchEditorEmoji(
    "",
    editorEmojiInventory,
    (emoji) => emoji.category === "people-body",
  )

  const next = searchEditorEmoji(
    "",
    editorEmojiInventory,
    (emoji) => emoji.category === "people-body",
    50,
  )

  expect(first).toHaveLength(50)
  expect(next).toHaveLength(50)
  expect(new Set([...first, ...next].map((emoji) => emoji.id)).size).toBe(100)
  expect(first.every((emoji) => emoji.category === "people-body")).toBe(true)
  expect(searchEditorEmoji("", editorEmojiInventory, undefined, -1)).toEqual([])
  expect(
    searchEditorEmoji(
      "woman technologist",
      editorEmojiInventory,
      (emoji) => emoji.category === "people-body",
    ).some((emoji) => emoji.emoji === "👩🏽‍💻"),
  ).toBe(true)
})
