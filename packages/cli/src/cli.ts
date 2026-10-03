#!/usr/bin/env bun

import type { InitOptions } from "@yopem-ui/cli/init"
import type { JsonValue } from "@yopem-ui/cli/install"

import { initProject } from "@yopem-ui/cli/init"
import { installItem, isRecord, isString } from "@yopem-ui/cli/install"
import { resolve } from "node:path"

const usage =
  "Usage: yopem-ui [--help | --version] | init [--framework vite|tanstack-router|tanstack-start|react-router|next|astro] [--ui <path>] [--dry-run] [--cwd <path>] [--registry <URL>] | <add|update> <name> [--force] [--dry-run] [--cwd <path>] [--registry <URL>]"

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

  if (command === undefined || command === "--help" || command === "-h") {
    if (rest.length) throw new Error(usage)
    console.info(usage)

    return
  }

  if (command === "--version" || command === "-v") {
    if (rest.length) throw new Error(usage)

    const manifest: JsonValue = await Bun.file(
      new URL("../package.json", import.meta.url),
    ).json()

    if (!isRecord(manifest) || !isString(manifest.version)) {
      throw new Error("Invalid CLI package version")
    }

    console.info(manifest.version)

    return
  }

  const positional: string[] = []
  const flags = new Map<string, string>()

  for (let index = 0; index < rest.length; index++) {
    const argument = rest[index]!

    if (!argument.startsWith("--")) {
      positional.push(argument)
      continue
    }

    if (flags.has(argument)) throw new Error(usage)

    if (argument === "--force" || argument === "--dry-run") {
      flags.set(argument, "true")
      continue
    }

    if (!["--cwd", "--ui", "--framework", "--registry"].includes(argument))
      throw new Error(usage)
    const value = rest[++index]

    if (!value || value.startsWith("--")) throw new Error(usage)
    flags.set(argument, value)
  }

  const cwd = resolve(options.cwd ?? process.cwd(), flags.get("--cwd") ?? ".")
  const registryUrl = flags.get("--registry") ?? options.registryUrl

  function onWarning(warning: string) {
    console.warn(`Warning: ${warning}`)
    options.onWarning?.(warning)
  }

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
      registryUrl,
      dryRun: flags.has("--dry-run") || options.dryRun,
      onWarning,
      ui: flags.get("--ui") ?? options.ui,
      framework: isFramework(framework) ? framework : options.framework,
    })

    if (result.preview) {
      for (const file of result.preview.files) {
        const label =
          file.action === "write"
            ? "Write"
            : file.action === "delete"
              ? "Delete"
              : "Skip"

        console.info(
          `${label} ${file.path}${file.reason ? ` (${file.reason})` : ""}`,
        )
      }

      for (const group of result.preview.dependencies) {
        console.info(
          `Runtime dependencies (${group.cwd}): ${group.dependencies.join(", ") || "none"}`,
        )
        console.info(
          `Dev dependencies (${group.cwd}): ${group.devDependencies.join(", ") || "none"}`,
        )
      }

      console.info(`Prerequisites: ${result.preview.prerequisites.join("; ")}`)
      console.info(
        `Dry run: ${result.framework}. No files written or package-manager commands run.`,
      )
    } else {
      console.info(
        `Configured ${result.framework} (${result.configured} file(s))`,
      )
    }

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
    registryUrl,
    mode: command,
    onWarning,
    force: flags.has("--force"),
    dryRun: flags.has("--dry-run") || options.dryRun,
  })

  if (result.preview) {
    const { files, dependencies, devDependencies } = result.preview
    const labels = { write: "Write", skip: "Skip", conflict: "Conflict" }

    for (const file of files) {
      console.info(
        `${labels[file.action]} ${file.reason ?? file.path}${file.forced ? " (forced overwrite)" : ""}`,
      )
    }

    console.info(`Runtime dependencies: ${dependencies.join(", ") || "none"}`)
    console.info(`Dev dependencies: ${devDependencies.join(", ") || "none"}`)
    console.info(
      `Dry run: ${files.filter((file) => file.action === "write").length} file write(s), ${files.filter((file) => file.action === "skip").length} skip(s), ${files.filter((file) => file.action === "conflict").length} conflict(s). No files written.`,
    )
  } else {
    console.info(
      `Installed ${result.installed} file(s), skipped ${result.skipped}`,
    )
  }

  return result
}

if (import.meta.main) {
  runCli(process.argv.slice(2)).catch((cause: unknown) => {
    console.error(cause instanceof Error ? cause.message : cause)
    process.exitCode = 1
  })
}
