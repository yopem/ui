import { expect, test } from "bun:test"
import { spawnSync } from "node:child_process"
import { mkdirSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

const root = resolve(import.meta.dirname, "../../..")

test("release dry run packs both public packages with resolved catalogs", () => {
  const result = spawnSync("bun", ["run", "release", "--dry-run"], {
    cwd: root,
    encoding: "utf8",
    timeout: 120_000,
  })

  const output = `${result.stdout}${result.stderr}`
  mkdirSync(resolve(import.meta.dirname, "../test-results"), {
    recursive: true,
  })
  writeFileSync(
    resolve(import.meta.dirname, "../test-results/release-dry-run.log"),
    output,
  )
  expect(result.status, output).toBe(0)
  expect(output).toContain("@yopem-ui/cli")
  expect(output).toContain("@yopem-ui/oxlint-plugin")
  expect(output).not.toContain("catalog:")
}, 120_000)
