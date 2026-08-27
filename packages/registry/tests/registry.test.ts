import { registryItemSchema, registrySchema } from "@registry/schema"
import { describe, expect, test } from "bun:test"
import { createHash } from "node:crypto"
import { readdir, readFile } from "node:fs/promises"
import { resolve } from "node:path"

const root = resolve(import.meta.dirname, "..")
const registryDir = resolve(root, "dist/r")

function integrity(content: string) {
  return `sha256-${createHash("sha256").update(content).digest("base64")}`
}

describe("built registry", () => {
  test("index and every item match their schemas", async () => {
    const registry = registrySchema.parse(
      JSON.parse(await readFile(resolve(registryDir, "registry.json"), "utf8")),
    )
    const names = new Set(registry.items.map((item) => item.name))

    for (const name of names) {
      const item = registryItemSchema.parse(
        JSON.parse(
          await readFile(resolve(registryDir, `${name}.json`), "utf8"),
        ),
      )
      for (const dependency of item.registryDependencies) {
        expect(names.has(dependency)).toBeTrue()
      }
      for (const file of item.files) {
        expect(file.content).toBeDefined()
        expect(file.integrity).toBe(integrity(file.content ?? ""))
        expect(file.content).not.toContain("@registry/")
      }
    }
  })

  test("latest and versioned items are identical", async () => {
    const registry = registrySchema.parse(
      JSON.parse(await readFile(resolve(registryDir, "registry.json"), "utf8")),
    )
    const versioned = new Set(
      await readdir(resolve(registryDir, registry.version)),
    )

    for (const item of registry.items) {
      const fileName = `${item.name}.json`
      expect(versioned.has(fileName)).toBeTrue()
      expect(await readFile(resolve(registryDir, fileName), "utf8")).toBe(
        await readFile(
          resolve(registryDir, registry.version, fileName),
          "utf8",
        ),
      )
    }
  })

  test("consumer output has no Tailwind dependency", async () => {
    const registry = registrySchema.parse(
      JSON.parse(await readFile(resolve(registryDir, "registry.json"), "utf8")),
    )
    for (const item of registry.items) {
      expect(
        item.dependencies.some((dependency) => dependency.includes("tailwind")),
      ).toBeFalse()
      expect(
        item.devDependencies.some((dependency) =>
          dependency.includes("tailwind"),
        ),
      ).toBeFalse()
    }
  })
})
