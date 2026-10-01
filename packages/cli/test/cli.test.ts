import { expect, test } from "bun:test"
import { spawnSync } from "node:child_process"
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"

const cli = resolve(import.meta.dirname, "../src/cli.ts")

const manifest: { version: string } = JSON.parse(
  readFileSync(resolve(import.meta.dirname, "../package.json"), "utf8"),
)

for (const args of [[], ["--help"], ["-h"], ["--version"], ["-v"]]) {
  test(`CLI discovery succeeds without project: ${args.join(" ") || "no arguments"}`, () => {
    const cwd = mkdtempSync(join(tmpdir(), "yopem-cli-discovery-"))

    try {
      const result = spawnSync("bun", [cli, ...args], {
        cwd,
        encoding: "utf8",
        timeout: 10_000,
      })

      expect(result.status, result.stderr).toBe(0)
      expect(result.stderr).toBe("")

      if (args.includes("--version") || args.includes("-v")) {
        expect(result.stdout.trim()).toBe(manifest.version)
      } else {
        expect(result.stdout).toContain("Usage:")
        expect(result.stdout).toContain("--registry")
        expect(result.stdout).toContain("--help")
        expect(result.stdout).toContain("--version")
      }

      expect(readdirSync(cwd)).toEqual([])
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })
}

for (const args of [
  ["unknown"],
  ["--unknown"],
  ["--help", "extra"],
  ["--version", "extra"],
  ["add"],
  ["init", "--unknown"],
]) {
  test(`CLI invalid arguments fail: ${args.join(" ")}`, () => {
    const result = spawnSync("bun", [cli, ...args], {
      encoding: "utf8",
      timeout: 10_000,
    })

    expect(result.status).toBe(1)
    expect(result.stdout).toBe("")
    expect(result.stderr).toContain("Usage:")
  })
}
