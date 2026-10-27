import { prepareExcalidrawAssets } from "@workspace/apps/docs/scripts/excalidraw-assets"
import { expect, test } from "bun:test"
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs"
import { createRequire } from "node:module"
import { tmpdir } from "node:os"
import { dirname, join, relative, resolve } from "node:path"

const docsRequire = createRequire(
  resolve(import.meta.dirname, "../../apps/docs/package.json"),
)

const sdkFontDirectory = resolve(
  dirname(docsRequire.resolve("@excalidraw/excalidraw")),
  "fonts",
)

function listFiles(directory: string, root = directory): string[] {
  return readdirSync(directory, { withFileTypes: true })
    .sort((left, right) =>
      left.name < right.name ? -1 : left.name > right.name ? 1 : 0,
    )
    .flatMap((entry) => {
      const file = join(directory, entry.name)

      if (entry.isDirectory()) return listFiles(file, root)

      if (entry.isFile()) return [relative(root, file)]

      throw new Error(`Unsupported SDK font entry: ${file}`)
    })
}

test("copies installed SDK assets byte-for-byte and cleans only generated files", () => {
  const publicDirectory = mkdtempSync(join(tmpdir(), "docs-excalidraw-assets-"))
  const localAsset = join(publicDirectory, "assets", "excalidraw", "local.txt")

  const outputFontDirectory = join(
    publicDirectory,
    "assets",
    "excalidraw",
    "fonts",
  )

  mkdirSync(dirname(localAsset), { recursive: true })
  writeFileSync(localAsset, "keep")

  try {
    const cleanup = prepareExcalidrawAssets(publicDirectory)
    const sourceFiles = listFiles(sdkFontDirectory)
    const outputFiles = listFiles(outputFontDirectory)

    expect(sourceFiles.length).toBeGreaterThan(0)
    expect(outputFiles).toEqual(sourceFiles)

    for (const file of sourceFiles) {
      expect(
        readFileSync(join(outputFontDirectory, file)).equals(
          readFileSync(join(sdkFontDirectory, file)),
        ),
      ).toBe(true)
    }

    cleanup()
    cleanup()

    expect(existsSync(outputFontDirectory)).toBe(false)
    expect(readFileSync(localAsset, "utf8")).toBe("keep")
  } finally {
    rmSync(publicDirectory, { recursive: true, force: true })
  }
})

test("rejects conflicting output without overwriting local bytes", () => {
  const publicDirectory = mkdtempSync(
    join(tmpdir(), "docs-excalidraw-conflict-"),
  )

  const [firstFont] = listFiles(sdkFontDirectory)

  if (!firstFont)
    throw new Error("Installed Excalidraw font directory is empty")

  const outputFontDirectory = join(
    publicDirectory,
    "assets",
    "excalidraw",
    "fonts",
  )

  const conflict = join(outputFontDirectory, firstFont)

  mkdirSync(dirname(conflict), { recursive: true })
  writeFileSync(conflict, "local bytes")

  try {
    expect(() => prepareExcalidrawAssets(publicDirectory)).toThrow()
    expect(readFileSync(conflict, "utf8")).toBe("local bytes")
    expect(listFiles(outputFontDirectory)).toEqual([firstFont])
  } finally {
    rmSync(publicDirectory, { recursive: true, force: true })
  }
})

test("rejects symlinked output paths without writing outside public assets", () => {
  const publicDirectory = mkdtempSync(
    join(tmpdir(), "docs-excalidraw-symlink-"),
  )

  const outsideDirectory = mkdtempSync(
    join(tmpdir(), "docs-excalidraw-outside-"),
  )

  const outputFontDirectory = join(
    publicDirectory,
    "assets",
    "excalidraw",
    "fonts",
  )

  mkdirSync(outputFontDirectory, { recursive: true })
  symlinkSync(outsideDirectory, join(outputFontDirectory, "Assistant"), "dir")

  try {
    expect(() => prepareExcalidrawAssets(publicDirectory)).toThrow()
    expect(readdirSync(outsideDirectory)).toEqual([])
  } finally {
    rmSync(publicDirectory, { recursive: true, force: true })
    rmSync(outsideDirectory, { recursive: true, force: true })
  }
})
