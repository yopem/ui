import { rewriteImports } from "@registry/source-files"
import { expect, test } from "bun:test"
import { resolve } from "node:path"

const root = resolve(import.meta.dirname, "../..")

test("AI server subpath rewrites before the authentication barrel", () => {
  expect(
    rewriteImports(
      'import { createEditorAiHandler } from "@yopem-ui/editor/server/ai"',
    ),
  ).toBe('import { createEditorAiHandler } from "@/lib/editor-ai"')
})

test("published AI inventory exposes server API and keeps browser source server-free", async () => {
  const item: {
    registryDependencies: string[]
    dependencies: string[]
    files: { path: string; content: string }[]
  } = await Bun.file(
    resolve(root, "packages/registry/dist/r/editor-ai.json"),
  ).json()

  expect(item.registryDependencies).toEqual(["editor-auth"])
  expect(item.dependencies.some((value) => value.startsWith("zod@^"))).toBe(
    true,
  )
  expect(item.files.map((file) => file.path).sort()).toEqual(
    ["contracts.ts", "http.ts", "index.ts", "providers.ts", "streams.ts"]
      .map((file) => `lib/editor-ai/${file}`)
      .sort(),
  )

  const docs: { parts: { name: string }[] } = await Bun.file(
    resolve(root, "packages/registry/dist/r/docs/editor-ai.json"),
  ).json()

  expect(docs.parts.map((part) => part.name)).toContain("createEditorAiHandler")
  expect(docs.parts.map((part) => part.name)).toContain("AiHandlerOptions")

  const client: typeof item = await Bun.file(
    resolve(root, "packages/registry/dist/r/editor.json"),
  ).json()

  expect(client.registryDependencies).toContain("fieldset")
  expect(client.registryDependencies).toContain("dialog")

  for (const file of client.files) {
    expect(file.content).not.toMatch(
      /(?:@yopem-ui\/editor\/server|@\/lib\/editor-(?:ai|auth|store)|@registry\/)/,
    )
  }

  for (const file of item.files)
    expect(file.content).not.toContain("@yopem-ui/")
})
