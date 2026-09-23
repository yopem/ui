import { runCli } from "@yopem-ui/cli/cli"
import { expect, test } from "bun:test"

test("rejects missing command, name, or unknown flags before network access", async () => {
  for (const args of [
    [],
    ["add"],
    ["remove", "button"],
    ["update", "button", "--oops"],
  ]) {
    await expect(runCli(args)).rejects.toThrow("Usage: yopem-ui")
  }
})

test("bin prints usage error and exits nonzero", () => {
  const result = Bun.spawnSync(["bun", "src/cli.ts", "remove", "button"], {
    cwd: new URL("..", import.meta.url).pathname,
    stdout: "pipe",
    stderr: "pipe",
  })
  expect(result.exitCode).toBe(1)
  expect(result.stderr.toString()).toContain("Usage: yopem-ui")
})
