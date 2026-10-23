import { registryItemSchema, registrySchema } from "@registry/schema"
import { expect, test } from "bun:test"
import { resolve } from "node:path"
import { z } from "zod"

const root = resolve(import.meta.dirname, "../..")

const dependencies = z.record(z.string(), z.string())

const manifestSchema = z.object({
  dependencies: dependencies.default({}),
  devDependencies: dependencies.default({}),
  peerDependencies: dependencies.default({}),
  optionalDependencies: dependencies.default({}),
})

const workspaceSchema = manifestSchema.extend({
  workspaces: z.array(z.string()),
  catalog: dependencies,
  catalogs: z.record(z.string(), dependencies),
})

test("workspace versions use caret ranges and only shared catalog entries", async () => {
  const workspace = workspaceSchema.parse(
    await Bun.file(resolve(root, "package.json")).json(),
  )

  const paths = new Set(["package.json"])

  for (const pattern of workspace.workspaces)
    for await (const path of new Bun.Glob(`${pattern}/package.json`).scan(root))
      paths.add(path)

  const usage = new Map<string, Set<string>>()

  for (const path of paths) {
    const manifest = manifestSchema.parse(
      await Bun.file(resolve(root, path)).json(),
    )

    for (const section of Object.values(manifest))
      for (const [name, version] of Object.entries(section)) {
        expect(
          /^(?:\^|workspace:|catalog:)/.test(version) ||
            /^npm:.+@\^/.test(version),
          `${path}: ${name}@${version}`,
        ).toBe(true)
        const consumers = usage.get(name) ?? new Set<string>()
        consumers.add(path)
        usage.set(name, consumers)
      }
  }

  for (const catalog of [
    workspace.catalog,
    ...Object.values(workspace.catalogs),
  ])
    for (const [name, version] of Object.entries(catalog)) {
      expect(usage.get(name)?.size, name).toBeGreaterThan(1)
      expect(/^\^|^npm:.+@\^/.test(version), name).toBe(true)
    }
})

test("published editor versions match the editor manifest and shared catalog", async () => {
  const workspace = workspaceSchema.parse(
    await Bun.file(resolve(root, "package.json")).json(),
  )

  const editor = manifestSchema.parse(
    await Bun.file(resolve(root, "packages/editor/package.json")).json(),
  )

  const registry = registrySchema.parse(
    await Bun.file(
      resolve(root, "packages/registry/dist/r/registry.json"),
    ).json(),
  )

  const editors = registry.items.filter(
    (item) => item.name === "editor" || item.name === "editor-auth",
  )

  expect(editors).not.toBeEmpty()

  for (const { name } of editors) {
    const item = registryItemSchema.parse(
      await Bun.file(
        resolve(root, "packages/registry/dist/r", `${name}.json`),
      ).json(),
    )

    expect(item.dependencies).not.toBeEmpty()

    for (const dependency of item.dependencies) {
      const separator = dependency.lastIndexOf("@")
      expect(separator).toBeGreaterThan(0)
      const packageName = dependency.slice(0, separator)
      const configured = editor.dependencies[packageName]
      expect(configured).toBeDefined()
      expect(dependency.slice(separator + 1)).toBe(
        configured === "catalog:" ? workspace.catalog[packageName] : configured,
      )
    }
  }
})
