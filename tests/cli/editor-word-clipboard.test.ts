import { editorWordClipboardItem } from "@registry/items/editor-word-clipboard"
import { registryItemSchema } from "@registry/schema"
import { expect, test } from "bun:test"
import { readFile } from "node:fs/promises"

const files = ["word-clipboard.ts", "word-clipboard-model.ts"]

test("Word clipboard publication closes its native and preview dependencies", () => {
  expect(editorWordClipboardItem.registryDependencies).toEqual(
    expect.arrayContaining([
      "editor-document",
      "editor-list-presentation",
      "editor-media",
      "heading",
    ]),
  )
  expect(editorWordClipboardItem.registryDependencies).not.toContain(
    "editor-docx",
  )
  expect(editorWordClipboardItem.files.map((file) => file.path).sort()).toEqual(
    files.map((name) => `components/editor/${name}`).sort(),
  )

  for (const file of editorWordClipboardItem.files)
    expect(file.target).toBe(`@/${file.path}`)

  for (const name of [
    "@lexical/clipboard",
    "@lexical/extension",
    "lexical",
    "hast-util-to-html",
    "zod",
    "@types/hast",
  ]) {
    expect(
      editorWordClipboardItem.dependencies.some((dependency) =>
        dependency.startsWith(`${name}@^`),
      ),
    ).toBe(true)
  }
})

test("built Word clipboard helpers preserve optional source boundaries", async () => {
  const item = registryItemSchema.parse(
    JSON.parse(
      await readFile(
        new URL(
          "../../packages/registry/dist/r/editor-word-clipboard.json",
          import.meta.url,
        ),
        "utf8",
      ),
    ),
  )

  const base = registryItemSchema.parse(
    JSON.parse(
      await readFile(
        new URL("../../packages/registry/dist/r/editor.json", import.meta.url),
        "utf8",
      ),
    ),
  )

  expect(item.files.map((file) => file.path).sort()).toEqual(
    files.map((name) => `components/editor/${name}`).sort(),
  )
  expect(base.registryDependencies).not.toContain("editor-word-clipboard")
  expect(
    base.files.some((file) =>
      file.path.startsWith("components/editor/word-clipboard"),
    ),
  ).toBe(false)

  for (const file of item.files) {
    expect(file.content).not.toMatch(/@(?:workspace|registry|editor)\//)
  }
})
