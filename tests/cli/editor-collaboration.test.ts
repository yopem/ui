import { registryItemSchema } from "@registry/schema"
import { expect, test } from "bun:test"
import { resolve } from "node:path"

const root = resolve(import.meta.dirname, "../..")

test("generic collaboration distribution keeps the worker adapter separate", async () => {
  const item = registryItemSchema.parse(
    await Bun.file(
      resolve(
        root,
        "packages/registry/dist/r/editor-collaboration-server.json",
      ),
    ).json(),
  )

  expect(item.registryDependencies).toContain("editor-auth")
  expect(item.registryDependencies).toContain("editor-store")
  expect(
    item.files.some((file) => file.path.endsWith("collaboration-do.ts")),
  ).toBe(false)
  expect(
    item.files.some(
      (file) =>
        file.path.endsWith("collaboration-index.ts") ||
        file.path.endsWith("editor-collaboration/index.ts"),
    ),
  ).toBe(true)
  expect(
    item.files.some((file) => file.path.endsWith("collaboration/protocol.ts")),
  ).toBe(true)
})

test("Worker collaboration distribution publishes its adapter and migration", async () => {
  const item = registryItemSchema.parse(
    await Bun.file(
      resolve(
        root,
        "packages/registry/dist/r/editor-collaboration-worker.json",
      ),
    ).json(),
  )

  expect(item.registryDependencies).toContain("editor-collaboration-server")
  expect(
    item.files.some((file) => file.path.endsWith("collaboration-do.ts")),
  ).toBe(true)
  expect(
    item.files.some((file) =>
      file.path.endsWith("collaboration/0003-do-canonical.sql"),
    ),
  ).toBe(true)
  expect(
    item.devDependencies?.some((dependency) =>
      dependency.startsWith("@cloudflare/workers-types@"),
    ),
  ).toBe(true)
})
