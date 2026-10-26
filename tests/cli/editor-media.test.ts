import { sourceItems } from "@registry/items/index"
import { registryItemSchema } from "@registry/schema"
import { rewriteImports } from "@registry/source-files"
import { resolveSourcePath } from "@registry/source-path"
import { expect, test } from "bun:test"
import { mkdir, writeFile } from "node:fs/promises"
import { dirname, join, posix, resolve } from "node:path"

const root = resolve(import.meta.dirname, "../..")

test("optional media publishes a complete consumer source closure", async () => {
  const pending = ["editor-media"]
  const visited = new Set<string>()
  const files = new Map<string, string>()

  while (pending.length) {
    const name = pending.pop()

    if (!name || visited.has(name)) continue
    visited.add(name)
    const item = sourceItems.find((entry) => entry.name === name)

    if (!item) throw new Error(`Missing registry item: ${name}`)
    pending.push(...item.registryDependencies)

    const published = registryItemSchema.parse({
      ...item,
      schemaVersion: 1,
      registryVersion: "0.1.0",
      files: await Promise.all(
        item.files.map(async (file) => ({
          ...file,
          content: rewriteImports(
            await Bun.file(resolveSourcePath(file.path)).text(),
            file.path,
          ),
        })),
      ),
    })

    for (const file of published.files) {
      if (file.content === undefined)
        throw new Error(`Missing source: ${file.path}`)
      files.set(file.path, file.content)
    }
  }

  expect(visited.has("editor")).toBe(true)
  expect(visited.has("aspect-ratio")).toBe(true)
  expect(visited.has("figcaption")).toBe(true)
  expect(visited.has("progress")).toBe(true)
  expect(visited.has("scroll-area")).toBe(true)
  expect(visited.has("slider")).toBe(true)
  expect(files.has("components/editor/media.ts")).toBe(true)
  expect(files.has("components/editor/media-preview.tsx")).toBe(true)
  expect(files.has("components/editor/media-embed.tsx")).toBe(true)
  expect(files.has("components/editor/root.tsx")).toBe(true)
  expect(files.has("components/editor/selection-bookmark.ts")).toBe(true)

  for (const [path, content] of files) {
    if (!path.startsWith("components/editor/media")) continue
    expect(content).not.toContain("@workspace/")
    expect(content).not.toContain("@registry/")

    for (const match of content.matchAll(/from\s+["']([^"']+)["']/gu)) {
      const specifier = match[1]

      if (!specifier) continue

      const target = specifier.startsWith(".")
        ? posix.normalize(posix.join(posix.dirname(path), specifier))
        : specifier.startsWith("@/")
          ? specifier.slice(2)
          : null

      if (target === null) continue
      expect(
        [target, `${target}.ts`, `${target}.tsx`, `${target}/index.ts`].some(
          (file) => files.has(file),
        ),
        `${path}: ${specifier}`,
      ).toBe(true)
    }
  }

  const report = join(root, "test-results/cli/editor-media/source-closure.json")
  await mkdir(dirname(report), { recursive: true })
  await writeFile(
    report,
    JSON.stringify(
      { items: [...visited].sort(), files: [...files.keys()].sort() },
      null,
      2,
    ),
  )
})
