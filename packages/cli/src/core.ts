import { createHash } from "node:crypto"
import { existsSync, readFileSync } from "node:fs"
import { basename, dirname, join, relative, resolve } from "node:path"

export const registryUrl =
  process.env.YOPEM_REGISTRY_URL ?? "https://ui.yopem.com/r"
export const aliases = ["ui", "lib", "hooks", "styles", "components"] as const

export type Alias = (typeof aliases)[number]
export type Framework =
  | "next-app"
  | "next-pages"
  | "tanstack-start"
  | "unknown"
  | "vite"
export type PackageManager = "bun" | "npm" | "pnpm" | "yarn"

export interface RegistryFile {
  content: string
  integrity?: string
  path: string
  target?: string
}

export interface RegistryItem {
  dependencies: string[]
  devDependencies: string[]
  files: RegistryFile[]
  name: string
  peerDependencies: string[]
  registryDependencies: string[]
  registryVersion?: string
}

export interface Config {
  aliases: Record<Alias, string>
  css: string
  framework: Framework
  paths: Record<Alias, string>
  registry: string
}

export interface Lock {
  items: Record<
    string,
    {
      dependencies: string[]
      files: Record<string, string>
      registryDependencies: string[]
      version?: string
    }
  >
  version: 1
}

export const defaultConfig: Config = {
  aliases: {
    components: "@/components",
    hooks: "@/hooks",
    lib: "@/lib",
    styles: "@/styles",
    ui: "@/components/ui",
  },
  css: "src/styles/yopem/styles.css",
  framework: "unknown",
  paths: {
    components: "src/components",
    hooks: "src/hooks",
    lib: "src/lib",
    styles: "src/styles",
    ui: "src/components/ui",
  },
  registry: registryUrl,
}

const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const stringArray = (value: unknown, field: string, item: string) => {
  if (value === undefined) return []
  if (
    !Array.isArray(value) ||
    !value.every((entry) => typeof entry === "string")
  ) {
    throw new Error(`Invalid ${field} for ${item}`)
  }
  return value
}

export function parseItem(value: unknown): RegistryItem {
  if (
    !object(value) ||
    typeof value.name !== "string" ||
    !Array.isArray(value.files)
  ) {
    throw new Error("Invalid registry item: expected name and files")
  }
  const files = value.files.map((file) => {
    if (
      !object(file) ||
      typeof file.path !== "string" ||
      typeof file.content !== "string"
    ) {
      throw new Error(`Invalid file in ${value.name}`)
    }
    if (file.target !== undefined && typeof file.target !== "string") {
      throw new Error(`Invalid file target in ${value.name}`)
    }
    if (file.integrity !== undefined && typeof file.integrity !== "string") {
      throw new Error(`Invalid file integrity in ${value.name}`)
    }
    return {
      content: file.content,
      integrity: file.integrity,
      path: file.path,
      target: file.target,
    }
  })
  return {
    dependencies: stringArray(value.dependencies, "dependencies", value.name),
    devDependencies: stringArray(
      value.devDependencies,
      "devDependencies",
      value.name,
    ),
    files,
    name: value.name,
    peerDependencies: stringArray(
      value.peerDependencies,
      "peerDependencies",
      value.name,
    ),
    registryDependencies: stringArray(
      value.registryDependencies,
      "registryDependencies",
      value.name,
    ),
    registryVersion:
      typeof value.registryVersion === "string"
        ? value.registryVersion
        : undefined,
  }
}

export function parseConfig(value: unknown): Config {
  if (!object(value)) throw new Error("Invalid ui.json")
  const paths = value.paths
  const imports = value.aliases
  if (!object(paths) || !object(imports)) {
    throw new Error("ui.json requires paths and aliases")
  }
  for (const key of aliases) {
    if (typeof paths[key] !== "string" || typeof imports[key] !== "string") {
      throw new Error(`ui.json requires string paths.${key} and aliases.${key}`)
    }
  }
  const framework = value.framework ?? "unknown"
  if (
    framework !== "unknown" &&
    framework !== "vite" &&
    framework !== "tanstack-start" &&
    framework !== "next-app" &&
    framework !== "next-pages"
  ) {
    throw new Error("ui.json framework is invalid")
  }
  return {
    aliases: imports as Record<Alias, string>,
    css:
      typeof value.css === "string" ? value.css : "src/styles/yopem/styles.css",
    framework,
    paths: paths as Record<Alias, string>,
    registry: typeof value.registry === "string" ? value.registry : registryUrl,
  }
}

export function parseLock(value: unknown): Lock {
  if (!object(value) || value.version !== 1 || !object(value.items)) {
    throw new Error("Invalid ui-lock.json")
  }
  const items: Lock["items"] = {}
  for (const [name, item] of Object.entries(value.items)) {
    if (!object(item) || !object(item.files)) {
      throw new Error(`Invalid lock entry ${name}`)
    }
    const files: Record<string, string> = {}
    for (const [path, fileHash] of Object.entries(item.files)) {
      if (typeof fileHash !== "string")
        throw new Error(`Invalid lock hashes for ${name}`)
      files[path] = fileHash
    }
    items[name] = {
      dependencies: stringArray(item.dependencies, "dependencies", name),
      files,
      registryDependencies: stringArray(
        item.registryDependencies,
        "registryDependencies",
        name,
      ),
      version: typeof item.version === "string" ? item.version : undefined,
    }
  }
  return { items, version: 1 }
}

export const hash = (content: string | Uint8Array) =>
  createHash("sha256").update(content).digest("hex")

export const integrity = (content: string | Uint8Array) =>
  `sha256-${createHash("sha256").update(content).digest("base64")}`

export function resolveGraph(
  roots: string[],
  items: Map<string, RegistryItem>,
) {
  const result: RegistryItem[] = []
  const done = new Set<string>()
  const visiting: string[] = []
  const visit = (name: string) => {
    if (done.has(name)) return
    const cycleAt = visiting.indexOf(name)
    if (cycleAt !== -1) {
      throw new Error(
        `Registry dependency cycle: ${[...visiting.slice(cycleAt), name].join(" -> ")}`,
      )
    }
    const item = items.get(name)
    if (!item) throw new Error(`Registry dependency not found: ${name}`)
    visiting.push(name)
    item.registryDependencies.forEach(visit)
    visiting.pop()
    done.add(name)
    result.push(item)
  }
  roots.forEach(visit)
  return result
}

export function rewriteAliases(content: string, imports: Config["aliases"]) {
  return aliases.reduce(
    (text, key) =>
      text.replaceAll(`@${key}/`, `${imports[key].replace(/\/$/, "")}/`),
    content,
  )
}

export function targetPath(filePath: string, config: Config) {
  const normalized = filePath
    .replaceAll("\\", "/")
    .replace(/^\.\//, "")
    .replace(/^@/, "")
  if (normalized.split("/").includes("..") || normalized.startsWith("/")) {
    throw new Error(`Unsafe registry file path: ${filePath}`)
  }
  const [prefix, ...rest] = normalized.split("/")
  const root = aliases.includes(prefix as Alias)
    ? config.paths[prefix as Alias]
    : config.paths.ui
  return join(root, ...(rest.length ? rest : [basename(normalized)]))
}

export function detectProject(cwd: string) {
  const has = (path: string) => existsSync(join(cwd, path))
  const text = (path: string) =>
    has(path) ? readFileSync(join(cwd, path), "utf8") : ""
  const pkg = (() => {
    try {
      return JSON.parse(text("package.json")) as {
        dependencies?: Record<string, string>
        devDependencies?: Record<string, string>
        packageManager?: string
        workspaces?: unknown
      }
    } catch {
      return {}
    }
  })()
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }
  const framework: Framework = deps["@tanstack/react-start"]
    ? "tanstack-start"
    : deps.next
      ? has("app") || has("src/app")
        ? "next-app"
        : "next-pages"
      : deps.vite || has("vite.config.ts") || has("vite.config.js")
        ? "vite"
        : "unknown"
  const declaredManager = pkg.packageManager?.split("@")[0]
  let manager: PackageManager =
    declaredManager === "bun" ||
    declaredManager === "npm" ||
    declaredManager === "pnpm" ||
    declaredManager === "yarn"
      ? declaredManager
      : "npm"
  let workspace = Boolean(pkg.workspaces)
  let current = resolve(cwd)
  while (true) {
    if (
      existsSync(join(current, "bun.lock")) ||
      existsSync(join(current, "bun.lockb"))
    ) {
      manager = "bun"
      workspace ||= current !== resolve(cwd)
      break
    }
    if (existsSync(join(current, "pnpm-lock.yaml"))) {
      manager = "pnpm"
      workspace ||= current !== resolve(cwd)
      break
    }
    if (existsSync(join(current, "yarn.lock"))) {
      manager = "yarn"
      workspace ||= current !== resolve(cwd)
      break
    }
    if (existsSync(join(current, "package-lock.json"))) {
      manager = "npm"
      workspace ||= current !== resolve(cwd)
      break
    }
    if (current !== resolve(cwd) && existsSync(join(current, "package.json"))) {
      try {
        const parentPackage = JSON.parse(
          readFileSync(join(current, "package.json"), "utf8"),
        ) as { workspaces?: unknown }
        workspace ||= Boolean(parentPackage.workspaces)
      } catch {
        // Invalid parent package is not this project's configuration.
      }
    }
    const parent = dirname(current)
    if (parent === current) break
    current = parent
  }
  workspace ||= has("pnpm-workspace.yaml") || has("turbo.json")
  return { framework, manager, workspace }
}

export function findProjectRoot(start = process.cwd()) {
  let current = resolve(start)
  while (true) {
    if (existsSync(join(current, "ui.json"))) return current
    const parent = dirname(current)
    if (parent === current) return resolve(start)
    current = parent
  }
}

export function displayPath(root: string, path: string) {
  return relative(root, resolve(root, path)) || "."
}
