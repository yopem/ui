#!/usr/bin/env bun

import type { InitOptions } from "./init"

import { initProject } from "./init"
import { installItem } from "./install"

const usage =
  "Usage: yopem-ui init [--framework vite|tanstack-router|tanstack-start|react-router|next|astro] | <add|update> <name> [--force]"

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
  const [command, name, ...flags] = args

  if (command === "init") {
    const framework = name === "--framework" ? args[2] : undefined

    if (
      args.length !== 1 &&
      !(args.length === 3 && name === "--framework" && isFramework(framework))
    ) {
      throw new Error(usage)
    }

    const result = await initProject({
      ...options,
      framework: isFramework(framework) ? framework : undefined,
    })

    console.info(
      `Configured ${result.framework} (${result.configured} file(s))`,
    )

    return result
  }

  if (
    (command !== "add" && command !== "update") ||
    !name ||
    flags.some((flag) => flag !== "--force")
  ) {
    throw new Error(usage)
  }

  const result = await installItem(name, {
    ...options,
    mode: command,
    force: flags.includes("--force"),
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
