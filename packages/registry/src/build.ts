import { sourceItems } from "@registry/items/index"
import { registryItemSchema, registrySchema } from "@registry/schema"
import { createHash } from "node:crypto"
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { z } from "zod"

import { componentDocs } from "./docs"
import { rewriteImports } from "./source-files"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const projectRoot = resolve(root, "../..")
const dist = resolve(root, "dist")
const version = "0.1.0"
const schemaBase = "https://ui.yopem.com/schema"

function integrity(content: string) {
  return `sha256-${createHash("sha256").update(content).digest("base64")}`
}

async function writeJson(path: string, value: unknown) {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`)
}

await rm(dist, { force: true, recursive: true })

const items = await Promise.all(
  sourceItems.map(async (sourceItem) => {
    const files = await Promise.all(
      sourceItem.files.map(async (file) => {
        const content = rewriteImports(
          await readFile(resolve(root, "src", file.path), "utf8"),
        )
        return { ...file, content, integrity: integrity(content) }
      }),
    )

    return registryItemSchema.parse({
      ...sourceItem,
      $schema: `${schemaBase}/registry-item.json`,
      files,
      registryVersion: version,
      schemaVersion: 1,
    })
  }),
)

for (const item of items) {
  await writeJson(resolve(dist, "r", `${item.name}.json`), item)
  await writeJson(resolve(dist, "r", version, `${item.name}.json`), item)
}

const registry = registrySchema.parse({
  $schema: `${schemaBase}/registry.json`,
  homepage: "https://ui.yopem.com",
  items: items.map(
    ({ $schema: _, registryVersion: __, schemaVersion: ___, ...item }) => ({
      ...item,
      files: item.files.map(({ content: ____, ...file }) => file),
    }),
  ),
  name: "yopem-ui",
  schemaVersion: 1,
  version,
})

for (const doc of componentDocs) {
  await writeJson(resolve(dist, "r/docs", `${doc.name}.json`), doc)
}
await writeJson(
  resolve(dist, "r", "docs.json"),
  componentDocs.map(({ parts: _, ...doc }) => ({
    ...doc,
    apiUrl: `/r/docs/${doc.name}.json`,
  })),
)
await writeJson(resolve(dist, "r", "registry.json"), registry)
await writeJson(
  resolve(dist, "schema", "registry.json"),
  z.toJSONSchema(registrySchema),
)
await writeJson(
  resolve(dist, "schema", "registry-item.json"),
  z.toJSONSchema(registryItemSchema),
)
const publicDir = resolve(projectRoot, "apps/docs/public")
await rm(resolve(publicDir, "r"), { force: true, recursive: true })
await rm(resolve(publicDir, "schema"), { force: true, recursive: true })
await cp(resolve(dist, "r"), resolve(publicDir, "r"), { recursive: true })
await cp(resolve(dist, "schema"), resolve(publicDir, "schema"), {
  recursive: true,
})

console.info(`Built ${items.length} registry items for ${version}`)
