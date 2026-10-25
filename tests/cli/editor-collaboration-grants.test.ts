import { editorDependency } from "@registry/editor-dependencies"
import { sourceItems } from "@registry/items/index"
import { rewriteImports } from "@registry/source-files"
import { resolveSourcePath } from "@registry/source-path"
import { expect, test } from "bun:test"
import { resolve } from "node:path"

const root = resolve(import.meta.dirname, "../..")

test("native grants registry source closes over only its server factory and model", async () => {
  const item = sourceItems.find(
    (entry) => entry.name === "editor-collaboration-grants",
  )

  if (!item) throw new Error("Missing editor-collaboration-grants")

  expect(item.type).toBe("registry:lib")
  expect(item.dependencies).toEqual([editorDependency("zod")])
  expect(item.registryDependencies).toEqual(["editor-auth", "editor-store"])
  expect(item.files).toEqual([
    {
      path: "lib/editor-collaboration/collaboration-native-grants.ts",
      target: "@/lib/editor-collaboration/collaboration-native-grants.ts",
      type: "registry:lib",
    },
    {
      path: "lib/editor-collaboration/collaboration-native-model.ts",
      target: "@/lib/editor-collaboration/collaboration-native-model.ts",
      type: "registry:lib",
    },
  ])

  const [factoryFile, modelFile] = item.files

  if (!factoryFile || !modelFile) throw new Error("Missing native grants files")

  expect(resolveSourcePath(factoryFile.path)).toBe(
    resolve(root, "packages/editor/src/server/collaboration-native-grants.ts"),
  )
  expect(resolveSourcePath(modelFile.path)).toBe(
    resolve(root, "packages/editor/src/collaboration-native-model.ts"),
  )

  const rewritten = await Promise.all(
    item.files.map(async (file) =>
      rewriteImports(
        await Bun.file(resolveSourcePath(file.path)).text(),
        file.path,
      ),
    ),
  )

  const [factory, model] = rewritten

  if (!factory || !model) throw new Error("Missing native grants source")

  expect(factory).toContain('from "@/lib/editor-auth/auth"')
  expect(factory).toContain('from "@/lib/editor-store/document-service"')
  expect(factory).toContain('from "@/lib/editor-store/document-validation"')
  expect(factory).toContain('from "./collaboration-native-model"')
  expect(factory).toContain(
    "export function createEditorNativeGrantsHttpHandler",
  )

  for (const content of rewritten) {
    expect(content).not.toMatch(/@registry\/|@workspace\/|@yopem-ui\//u)
    expect(content).not.toMatch(
      /(?:@hocuspocus\/provider|@lexical\/yjs|y-webrtc|y-protocols|yjs|lib0)/u,
    )
  }
})

test("native grant server entry rewrites before the generic server entry", () => {
  expect(
    rewriteImports(
      'import { createEditorNativeGrantsHttpHandler } from "@yopem-ui/editor/server/native-grants"',
    ),
  ).toBe(
    'import { createEditorNativeGrantsHttpHandler } from "@/lib/editor-collaboration/collaboration-native-grants"',
  )
})
