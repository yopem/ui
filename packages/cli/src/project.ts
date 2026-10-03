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

export async function readPackage(root: string): Promise<JsonObject> {
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

  const existingLocks = await Promise.all(
    locks.map(([, path]) => existingFile(root, path)),
  )

  for (const [index, [manager]] of locks.entries()) {
    if (existingLocks[index]) found.add(manager)
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

  const [owner, local] = await Promise.all([
    workspaceRoot(target),
    packageManager(target),
  ])

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

interface PendingDependencies {
  dependencies: string[]
  devDependencies: string[]
}

interface Requirement {
  name: string
  spec: string
  argument: string
}

function requirement(argument: string): Requirement {
  const separator = argument.indexOf("@", 1)
  const name = separator < 0 ? argument : argument.slice(0, separator)
  const spec = separator < 0 ? "" : argument.slice(separator + 1)

  if (!isPackageName(name) || (separator >= 0 && !spec)) {
    throw new Error(`Invalid package dependency: ${argument}`)
  }

  return { name, spec, argument }
}

function bounds(spec: string) {
  const match = spec
    .trim()
    .match(/^(\^|~)?(\d+)(?:\.(\d+|[xX*]))?(?:\.(\d+|[xX*]))?$/)

  if (!match) return null
  const major = Number(match[2])
  const hasMinor = match[3] !== undefined && /^\d+$/.test(match[3])
  const hasPatch = match[4] !== undefined && /^\d+$/.test(match[4])

  if (!hasMinor && hasPatch) return null
  const minor = hasMinor ? Number(match[3]) : 0
  const patch = hasPatch ? Number(match[4]) : 0
  const minimum = `${major}.${minor}.${patch}`

  if (!Bun.semver.satisfies(minimum, spec)) return null

  const maximum =
    match[1] === "^"
      ? major > 0 || !hasMinor
        ? `${major + 1}.0.0`
        : minor > 0 || !hasPatch
          ? `0.${minor + 1}.0`
          : `0.0.${patch + 1}`
      : !hasMinor
        ? `${major + 1}.0.0`
        : match[1] === "~" || !hasPatch
          ? `${major}.${minor + 1}.0`
          : null

  return { minimum, maximum }
}

function compatible(existing: string, requested: string) {
  if (!requested || requested === "*" || existing === requested) return true

  if (requested === "workspace:*") {
    return existing === "*" || existing.startsWith("workspace:")
  }

  const current = bounds(existing)
  const wanted = bounds(requested)

  if (!current) {
    return (
      /^v?\d+\.\d+\.\d+(?:-[\da-zA-Z.-]+)?(?:\+[\da-zA-Z.-]+)?$/.test(
        existing,
      ) && Bun.semver.satisfies(existing, requested)
    )
  }

  if (!current.maximum) return Bun.semver.satisfies(current.minimum, requested)

  if (!wanted?.maximum) return false

  return (
    Bun.semver.satisfies(current.minimum, requested) &&
    Bun.semver.order(current.maximum, wanted.maximum) <= 0
  )
}

function section(manifest: JsonObject, name: string) {
  const value = manifest[name]

  if (value === undefined) return {}

  if (!isRecord(value)) throw new Error(`Invalid package.json ${name}`)

  for (const [name, spec] of Object.entries(value)) {
    if (!isPackageName(name) || !isString(spec) || !spec.trim()) {
      throw new Error(`Invalid package.json dependency: ${name}`)
    }
  }

  return value
}

export async function pendingDependencies(
  root: string,
  runtime: Iterable<string>,
  dev: Iterable<string>,
) {
  const manifest = await readPackage(root)
  const dependencies = section(manifest, "dependencies")
  const devDependencies = section(manifest, "devDependencies")

  const groups = new Map<
    string,
    { runtime: boolean; requirements: Requirement[] }
  >()

  for (const [arguments_, isRuntime] of [
    [runtime, true],
    [dev, false],
  ] as const) {
    for (const argument of arguments_) {
      const entry = requirement(argument)

      const group = groups.get(entry.name) ?? {
        runtime: false,
        requirements: [],
      }

      group.runtime ||= isRuntime
      group.requirements.push(entry)
      groups.set(entry.name, group)
    }
  }

  const pending: PendingDependencies = {
    dependencies: [],
    devDependencies: [],
  }

  for (const [name, group] of groups) {
    const installed = dependencies[name] ?? devDependencies[name]

    const satisfied =
      isString(installed) &&
      group.requirements.every((entry) => compatible(installed, entry.spec))

    if (satisfied && (!group.runtime || dependencies[name] !== undefined))
      continue

    const chosen = group.requirements.find((candidate) =>
      group.requirements.every((entry) =>
        compatible(candidate.spec || "*", entry.spec),
      ),
    )

    if (!chosen && !satisfied) {
      throw new Error(
        `Conflicting package requirements: ${group.requirements.map((entry) => entry.argument).join(", ")}`,
      )
    }

    const argument = satisfied ? `${name}@${installed}` : chosen!.argument

    const target = group.runtime
      ? pending.dependencies
      : pending.devDependencies

    target.push(argument)
  }

  return pending
}
