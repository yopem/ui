#!/usr/bin/env bun

import { installItem } from "./install"

export async function runCli(args: string[]) {
  const [command, name, ...flags] = args
  if (
    (command !== "add" && command !== "update") ||
    !name ||
    flags.some((flag) => flag !== "--force")
  ) {
    throw new Error("Usage: yopem-ui <add|update> <name> [--force]")
  }
  const result = await installItem(name, {
    mode: command,
    force: flags.includes("--force"),
  })
  console.info(
    `Installed ${result.installed} file(s), skipped ${result.skipped}`,
  )
  return result
}

if (import.meta.main) {
  runCli(process.argv.slice(2)).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
