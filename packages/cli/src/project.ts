import type {
  InstallOptions,
  JsonObject,
  JsonValue,
} from "@yopem-ui/cli/install"

import { existingFile, isRecord, isString, runBun } from "@yopem-ui/cli/install"
import { readFile, realpath } from "node:fs/promises"
import { dirname, join, matchesGlob, relative } from "node:path"

type PackageManager = "bun" | "npm" | "pnpm" | "yarn"

export function isPackageName(value: unknown): value is string {
  return (
    isString(value) &&
    value.length <= 214 &&
    value === value.trim() &&
    /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/.test(value) &&
    value !== "node_modules" &&
    value !== "favicon.ico"
  )
}

async function readPackage(root: string): Promise<JsonObject> {
  if (!(await existingFile(root, "package.json"))) return {}

  const value: JsonValue = JSON.parse(
    await readFile(join(root, "package.json"), "utf8"),
  )

  if (!isRecord(value)) throw new Error(`Invalid package.json in ${root}`)

  return value
}

function pnpmPatterns(content: string) {
  // ponytail: string lists only; add YAML parser for anchors or flow lists.
  const lines = content.split(/\r?\n/)
  const start = lines.findIndex((line) => /^packages:\s*(?:#.*)?$/.test(line))

  if (start < 0) {
    if (
      lines.some((line) => /^\s*(?:["']packages["']|packages)\s*:/.test(line))
    ) {
      throw new Error("Unsupported pnpm workspace packages; use a string list")
    }

    return ["**"]
  }

  const patterns: string[] = []

  for (const line of lines.slice(start + 1)) {
    if (/^\s*(?:#.*)?$/.test(line)) continue

    if (/^\S/.test(line) && !line.startsWith("-")) break

    const entry = line.match(
      /^\s*-\s*(?:"([^"]*)"|'([^']*)'|([^"'#]+?))\s*(?:#.*)?$/,
    )

    const pattern = entry?.[1] ?? entry?.[2] ?? entry?.[3]

    if (!pattern || (entry?.[3] && /^[*&[\]{}>|]/.test(pattern))) {
      throw new Error("Unsupported pnpm workspace pattern")
    }

    patterns.push(pattern)
  }

  return patterns
}

export async function workspaceRoot(root: string) {
  const target = await realpath(root)
  let current = target

  while (true) {
    const manifest = await readPackage(current)

    let patterns = isRecord(manifest.workspaces)
      ? manifest.workspaces.packages
      : manifest.workspaces

    if (isRecord(manifest.workspaces) && patterns === undefined) {
      throw new Error(`Invalid workspace packages in ${current}`)
    }

    if (await existingFile(current, "pnpm-workspace.yaml")) {
      patterns = pnpmPatterns(
        await readFile(join(current, "pnpm-workspace.yaml"), "utf8"),
      )
    }

    if (patterns !== undefined) {
      if (
        !Array.isArray(patterns) ||
        !patterns.every(isString) ||
        patterns.some((pattern) => !pattern)
      ) {
        throw new Error(`Invalid workspace packages in ${current}`)
      }

      const path = relative(current, target).replaceAll("\\", "/")
      const includes: string[] = []
      const excludes: string[] = []

      for (const pattern of patterns) {
        const excluded = pattern.startsWith("!")

        const normalized = (excluded ? pattern.slice(1) : pattern)
          .replace(/^\.\//, "")
          .replace(/\/$/, "")

        const group = excluded ? excludes : includes
        group.push(normalized)
      }

      if (
        path &&
        (!includes.some((pattern) => matchesGlob(path, pattern)) ||
          excludes.some((pattern) => matchesGlob(path, pattern)))
      ) {
        throw new Error(`Not a workspace member: ${target}`)
      }

      return current
    }

    const parent = dirname(current)

    if (parent === current) return target
    current = parent
  }
}

async function packageManager(root: string) {
  const manifest = await readPackage(root)
  const declared = manifest.packageManager
  const found = new Set<PackageManager>()

  if (declared !== undefined) {
    if (!isString(declared)) {
      throw new Error(`Package manager declaration is invalid in ${root}`)
    }

    const name = declared.split("@")[0]

    if (
      name !== "bun" &&
      name !== "npm" &&
      name !== "pnpm" &&
      name !== "yarn"
    ) {
      throw new Error(`Package manager is unsupported: ${declared}`)
    }

    found.add(name)
  }

  const locks: [PackageManager, string][] = [
    ["bun", "bun.lock"],
    ["bun", "bun.lockb"],
    ["npm", "package-lock.json"],
    ["pnpm", "pnpm-lock.yaml"],
    ["yarn", "yarn.lock"],
  ]

  for (const [manager, path] of locks) {
    if (await existingFile(root, path)) found.add(manager)
  }

  if (found.size > 1) {
    throw new Error(
      `Package manager declarations and lockfiles conflict in ${root}`,
    )
  }

  return [...found][0]
}

export async function packageRunner(
  root: string,
  run?: InstallOptions["run"],
): Promise<NonNullable<InstallOptions["run"]>> {
  const target = await realpath(root)
  const owner = await workspaceRoot(target)
  const local = await packageManager(target)
  const workspace = owner === target ? local : await packageManager(owner)

  if (local && workspace && local !== workspace) {
    throw new Error("Package manager differs between target and workspace root")
  }

  const manager = local ?? workspace ?? "bun"

  if (run) return run

  if (manager === "bun") return runBun

  return async function runPackage(args: string[], cwd: string) {
    const command =
      manager === "npm" && args[0] === "add" ? "install" : args[0]!

    const flags = args.slice(1).map((argument) => {
      if (argument === "-d") return "-D"

      return manager === "npm"
        ? argument.replace(/@workspace:\*$/, "@*")
        : argument
    })

    const child = Bun.spawn([manager, command, ...flags], {
      cwd,
      stdout: "inherit",
      stderr: "inherit",
    })

    if ((await child.exited) !== 0) {
      throw new Error(`${manager} ${command} failed`)
    }
  }
}
