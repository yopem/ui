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
import { dirname, join, relative, resolve, sep } from "node:path"

const docsRequire = createRequire(
  resolve(import.meta.dirname, "../../apps/docs/package.json"),
)

const sdkFontDirectory = resolve(
  dirname(docsRequire.resolve("@excalidraw/excalidraw")),
  "fonts",
)

const interPackageDirectory = dirname(
  docsRequire.resolve("@fontsource-variable/inter/package.json"),
)

const interFontDirectory = resolve(interPackageDirectory, "files")

const interLicense = resolve(interPackageDirectory, "LICENSE")

const interFontBySdkFile = new Map([
  [
    join(
      "Nunito",
      "Nunito-Regular-XRXI3I6Li01BKofiOc5wtlZ2di8HDIkhdTQ3j6zbXWjgeg.woff2",
    ),
    "inter-latin-wght-normal.woff2",
  ],
  [
    join(
      "Nunito",
      "Nunito-Regular-XRXI3I6Li01BKofiOc5wtlZ2di8HDIkhdTo3j6zbXWjgevT5.woff2",
    ),
    "inter-latin-ext-wght-normal.woff2",
  ],
  [
    join(
      "Nunito",
      "Nunito-Regular-XRXI3I6Li01BKofiOc5wtlZ2di8HDIkhdTs3j6zbXWjgevT5.woff2",
    ),
    "inter-vietnamese-wght-normal.woff2",
  ],
  [
    join(
      "Nunito",
      "Nunito-Regular-XRXI3I6Li01BKofiOc5wtlZ2di8HDIkhdTA3j6zbXWjgevT5.woff2",
    ),
    "inter-cyrillic-wght-normal.woff2",
  ],
  [
    join(
      "Nunito",
      "Nunito-Regular-XRXI3I6Li01BKofiOc5wtlZ2di8HDIkhdTk3j6zbXWjgevT5.woff2",
    ),
    "inter-cyrillic-ext-wght-normal.woff2",
  ],
])

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

test("uses Inter subsets for Nunito assets and cleans only generated files", () => {
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

    const nunitoFiles = sourceFiles.filter((file) =>
      file.startsWith(`Nunito${sep}`),
    )

    const expectedSources = new Map<string, string>()

    for (const file of sourceFiles) {
      const interFile = interFontBySdkFile.get(file)

      expectedSources.set(
        file,
        interFile
          ? join(interFontDirectory, interFile)
          : join(sdkFontDirectory, file),
      )
    }

    expectedSources.set("Inter-OFL.txt", interLicense)

    expect(sourceFiles.length).toBeGreaterThan(0)
    expect(nunitoFiles).toEqual([...interFontBySdkFile.keys()].sort())
    expect(listFiles(outputFontDirectory)).toEqual(
      [...expectedSources.keys()].sort(),
    )

    for (const [file, source] of expectedSources) {
      expect(
        readFileSync(join(outputFontDirectory, file)).equals(
          readFileSync(source),
        ),
      ).toBe(true)
    }

    for (const file of nunitoFiles) {
      expect(
        readFileSync(join(outputFontDirectory, file)).equals(
          readFileSync(join(sdkFontDirectory, file)),
        ),
      ).toBe(false)
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
