import { expect, test } from "@playwright/test"
import { spawnSync } from "node:child_process"
import { writeFileSync } from "node:fs"
import { resolve } from "node:path"

const root = resolve(import.meta.dirname, "../..")

test("release dry run packs both public packages with resolved catalogs", async () => {
  const result = spawnSync("bun", ["run", "release", "--dry-run"], {
    cwd: root,
    encoding: "utf8",
    timeout: 120_000,
  })
  const output = `${result.stdout}${result.stderr}`
  writeFileSync(resolve(root, "test-results/release-dry-run.log"), output)
  await test.info().attach("release-dry-run.log", {
    body: output,
    contentType: "text/plain",
  })
  expect(result.status, output).toBe(0)
  expect(output).toContain("@yopem-ui/cli")
  expect(output).toContain("@yopem-ui/oxlint-plugin")
  expect(output).not.toContain("catalog:")
})
