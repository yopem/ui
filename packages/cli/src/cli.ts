#!/usr/bin/env bun

import type { InitOptions } from "@yopem-ui/cli/init"

import { initProject } from "@yopem-ui/cli/init"
import { installItem } from "@yopem-ui/cli/install"
import { resolve } from "node:path"

const usage =
  "Usage: yopem-ui init [--framework vite|tanstack-router|tanstack-start|react-router|next|astro] [--ui <path>] [--cwd <path>] | <add|update> <name> [--force] [--cwd <path>]"

function isFramework(
  value: string | undefined,
): value is NonNullable<InitOptions["framework"]> {
  return (
    value === "vite" ||
    value === "tanstack-router" ||
    value === "tanstack-start" ||
    value === "react-router" ||
    value === "next" ||
    value === "astro"
  )
}

export async function runCli(args: string[], options: InitOptions = {}) {
  const [command, ...rest] = args
  const positional: string[] = []
  const flags = new Map<string, string>()

  for (let index = 0; index < rest.length; index++) {
    const argument = rest[index]!

    if (!argument.startsWith("--")) {
      positional.push(argument)
      continue
    }

    if (flags.has(argument)) throw new Error(usage)

    if (argument === "--force") {
      flags.set(argument, "true")
      continue
    }

    if (!["--cwd", "--ui", "--framework"].includes(argument))
      throw new Error(usage)
    const value = rest[++index]

    if (!value || value.startsWith("--")) throw new Error(usage)
    flags.set(argument, value)
  }

  const cwd = resolve(options.cwd ?? process.cwd(), flags.get("--cwd") ?? ".")

  if (command === "init") {
    const framework = flags.get("--framework")

    if (
      positional.length ||
      flags.has("--force") ||
      (framework !== undefined && !isFramework(framework))
    )
      throw new Error(usage)

    const result = await initProject({
      ...options,
      cwd,
      ui: flags.get("--ui") ?? options.ui,
      framework: isFramework(framework) ? framework : options.framework,
    })

    console.info(
      `Configured ${result.framework} (${result.configured} file(s))`,
    )

    return result
  }

  if (
    (command !== "add" && command !== "update") ||
    positional.length !== 1 ||
    flags.has("--ui") ||
    flags.has("--framework")
  ) {
    throw new Error(usage)
  }

  const result = await installItem(positional[0]!, {
    ...options,
    cwd,
    mode: command,
    force: flags.has("--force"),
  })

  console.info(
    `Installed ${result.installed} file(s), skipped ${result.skipped}`,
  )

  return result
}

if (import.meta.main) {
  runCli(process.argv.slice(2)).catch((cause: unknown) => {
    console.error(cause instanceof Error ? cause.message : cause)
    process.exitCode = 1
  })
}
