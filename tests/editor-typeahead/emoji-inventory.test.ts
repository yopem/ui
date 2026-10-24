import {
  editorEmojiInventory,
  parseEditorEmojiInventory,
} from "@editor/typeahead-emoji"
import { expect, test } from "bun:test"

test("host emoji inventories validate before render and clone mutable inputs", () => {
  const input = [
    {
      id: "coder",
      label: "Coder",
      emoji: "👩🏽‍💻",
      aliases: ["coder"],
      category: "people",
    },
  ]

  const parsed = parseEditorEmojiInventory(input)
  input[0]?.aliases.push("mutated")
  expect(parsed[0]?.aliases).toEqual(["coder"])
  expect(
    parseEditorEmojiInventory(editorEmojiInventory).length,
  ).toBeGreaterThan(1000)
  expect(() => parseEditorEmojiInventory([...input, ...input])).toThrow()
  expect(() =>
    parseEditorEmojiInventory([{ ...input[0], label: "\u200B" }]),
  ).toThrow()
  expect(() =>
    parseEditorEmojiInventory([{ ...input[0], label: "\u202EName" }]),
  ).toThrow()
  expect(() =>
    parseEditorEmojiInventory([{ ...input[0], emoji: "👩🏽‍💻👋" }]),
  ).toThrow()
  expect(() =>
    parseEditorEmojiInventory(
      Array.from({ length: 10001 }, (_, index) => ({
        id: `emoji-${index}`,
        label: "Wave",
        emoji: "👋",
        aliases: [],
      })),
    ),
  ).toThrow()
})
