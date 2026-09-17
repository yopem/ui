import { registryItemSchema, registrySchema } from "@registry/schema"
import { expect, test } from "bun:test"
import { createHash } from "node:crypto"
import { readdir, readFile } from "node:fs/promises"
import { resolve } from "node:path"

const registryRoot = resolve(import.meta.dir, "..")
const projectRoot = resolve(registryRoot, "../..")
const distRoot = resolve(registryRoot, "dist")

async function json(path: string) {
  return JSON.parse(await readFile(path, "utf8"))
}

test("registry build writes valid, immutable, mirrored artifacts", async () => {
  const result = Bun.spawnSync(["bun", "src/build.ts"], {
    cwd: registryRoot,
    stderr: "pipe",
    stdout: "pipe",
  })
  expect(result.exitCode, result.stderr.toString()).toBe(0)

  const registry = registrySchema.parse(
    await json(resolve(distRoot, "r/registry.json")),
  )
  const itemFiles = (await readdir(resolve(distRoot, "r")))
    .filter(
      (file) =>
        file.endsWith(".json") &&
        file !== "registry.json" &&
        file !== "docs.json",
    )
    .toSorted()
  expect(itemFiles).toHaveLength(registry.items.length)

  for (const file of itemFiles) {
    const path = resolve(distRoot, "r", file)
    const item = registryItemSchema.parse(await json(path))
    expect(await readFile(path)).toEqual(
      await readFile(resolve(distRoot, "r", registry.version, file)),
    )
    for (const source of item.files) {
      expect(source.content).toBeDefined()
      expect(source.content).not.toContain("@registry/")
      expect(source.integrity).toBe(
        `sha256-${createHash("sha256")
          .update(source.content ?? "")
          .digest("base64")}`,
      )
    }
  }

  for (const directory of ["r", "schema"])
    expect(
      await readFile(resolve(distRoot, directory, "registry.json")),
    ).toEqual(
      await readFile(
        resolve(projectRoot, "apps/docs/public", directory, "registry.json"),
      ),
    )
})
