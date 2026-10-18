import spawn from "cross-spawn"
import { createHash } from "node:crypto"
import {
  chmod,
  link,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rename,
  rm,
  unlink,
  writeFile,
} from "node:fs/promises"
import { dirname, join, relative } from "node:path"

import { isPackageName, packageRunner, pendingDependencies } from "./project.js"

const defaultRegistryUrl = "https://ui.yopem.com/r"

const namePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const hashPattern = /^sha256-[A-Za-z0-9+/]{43}=$/

const types = new Set([
  "registry:base",
  "registry:hook",
  "registry:lib",
  "registry:style",
  "registry:ui",
])

export type JsonValue =
  | boolean
  | null
  | number
  | string
  | JsonObject
  | JsonValue[]

export interface JsonObject {
  [key: string]: JsonValue | undefined
}

interface RegistryFile {
  content: string
  integrity: string
  path: string
  target: string
  type: string
}

interface RegistryItem {
  dependencies: string[]
  devDependencies: string[]
  files: RegistryFile[]
  name: string
  registryDependencies: string[]
  registryVersion: string
}

interface Provenance {
  registryUrl: string
  items: Record<string, string>
  target?: string
}

interface Manifest {
  version: 1
  files: Record<string, string>
  importPrefix?: string
  provenance?: Record<string, Provenance>
  paths?: Partial<InstallPaths>
  sourceRoot?: "." | "src"
}

export interface InstallPaths {
  components: string
  ui: string
  hooks: string
  lib: string
  styles: string
  theme: string
}

const defaultPaths: InstallPaths = {
  components: "src/components",
  ui: "src/components/ui",
  hooks: "src/hooks",
  lib: "src/lib",
  styles: "src/styles",
  theme: "src/theme",
}

const pathKeys = [
  "ui",
  "components",
  "hooks",
  "lib",
  "styles",
  "theme",
] as const

function readPaths(value: JsonValue | Partial<InstallPaths> | undefined) {
  if (value === undefined) return undefined

  if (
    !isRecord(value) ||
    Object.keys(value).some((key) => !Object.hasOwn(defaultPaths, key))
  )
    throw new Error("Invalid ui.json paths")
  const paths: Partial<InstallPaths> = {}

  for (const key of pathKeys) {
    if (!Object.hasOwn(value, key)) continue
    const directory = value[key]

    if (!isString(directory)) throw new Error("Invalid ui.json paths")
    safePath(`${directory}/file`)
    paths[key] = directory
  }

  return paths
}

export function mapTargetPath(
  target: string,
  paths: InstallPaths,
  sourceRoot: "." | "src" = "src",
) {
  const key = pathKeys.find((key) => {
    const canonical = `@/${key === "ui" ? "components/ui" : key}`

    return target === canonical || target.startsWith(`${canonical}/`)
  })

  if (!key) {
    const path = targetPath(target)

    return sourceRoot === "." ? target.slice(2) : path
  }

  const canonical = `@/${key === "ui" ? "components/ui" : key}`

  if (target !== canonical) targetPath(target)

  return `${paths[key]}${target.slice(canonical.length)}`
}

export function mapImportPath(
  target: string,
  paths: InstallPaths,
  prefix: string,
  sourceRoot: "." | "src" = "src",
) {
  const key = pathKeys.find((key) => {
    const canonical = `@/${key === "ui" ? "components/ui" : key}`

    return target === canonical || target.startsWith(`${canonical}/`)
  })

  if (!key) return `${prefix}/${target.slice(2)}`
  const canonical = `@/${key === "ui" ? "components/ui" : key}`
  const directory = paths[key]

  if (sourceRoot === ".")
    return `${prefix}/${directory}${target.slice(canonical.length)}`

  const imported = directory.startsWith("src/")
    ? directory.slice(4)
    : `${prefix === "@" ? "../" : ""}${directory}`

  return `${prefix}/${imported}${target.slice(canonical.length)}`
}

async function resolvePaths(
  root: string,
  importPrefix: string | undefined,
  overrides: Partial<InstallPaths> | undefined,
  init: boolean,
) {
  const content = (await existingFile(root, "ui.json"))
    ? await readFile(join(root, "ui.json"), "utf8")
    : null

  const manifest = readManifest(content)
  const prefix = importPrefix ?? manifest.importPrefix ?? "@"

  if (!validImportPrefix(prefix))
    throw new Error(`Invalid import prefix: ${String(prefix)}`)

  const tracked = Object.keys(manifest.files).length > 0
  let sourceRoot = manifest.sourceRoot ?? "src"
  let defaults = defaultPaths

  if (init && !tracked) {
    if (manifest.sourceRoot === undefined) {
      const src = await lstat(join(root, "src")).catch((cause: unknown) => {
        if (
          cause instanceof Error &&
          "code" in cause &&
          cause.code === "ENOENT"
        )
          return null
        throw cause
      })

      sourceRoot = src?.isDirectory() ? "src" : "."
    }

    const directory = sourceRoot === "src" ? "src/" : ""
    defaults = {
      components: `${directory}components`,
      ui: `${directory}components/ui`,
      hooks: `${directory}hooks`,
      lib: `${directory}lib`,
      styles: `${directory}styles`,
      theme: `${directory}themes`,
    }
  }

  return {
    paths: { ...defaults, ...manifest.paths, ...readPaths(overrides) },
    importPrefix: prefix,
    sourceRoot,
  }
}

export async function resolveInstallPaths(
  root: string,
  importPrefix?: string,
  overrides?: Partial<InstallPaths>,
) {
  return await resolvePaths(root, importPrefix, overrides, false)
}

export async function resolveInitPaths(
  root: string,
  importPrefix?: string,
  overrides?: Partial<InstallPaths>,
) {
  return await resolvePaths(root, importPrefix, overrides, true)
}

export interface InstallPreview {
  files: {
    path: string
    action: "write" | "skip" | "conflict"
    reason?: string
    forced?: true
  }[]
  dependencies: string[]
  devDependencies: string[]
}

export interface InstallResult {
  installed: number
  skipped: number
  preview?: InstallPreview
  warnings?: string[]
}

export interface InstallOptions {
  cwd?: string
  dryRun?: boolean
  force?: boolean
  importPrefix?: string
  paths?: Partial<InstallPaths>
  sourceRoot?: "." | "src"
  mode?: "add" | "update"
  registryUrl?: string
  requestTimeoutMs?: number
  fetcher?: (url: string, init?: RequestInit) => Promise<Response>
  run?: (args: string[], cwd: string) => Promise<void>
  onWarning?: (warning: string) => void
}

function registryBaseUrl(value: string) {
  const url = URL.parse(value)

  const local =
    url &&
    (url.hostname === "localhost" ||
      url.hostname === "[::1]" ||
      /^127(?:\.\d+){3}$/.test(url.hostname))

  if (
    !url ||
    url.username ||
    url.password ||
    url.href.includes("?") ||
    url.href.includes("#") ||
    (url.protocol !== "https:" && !(url.protocol === "http:" && local))
  ) {
    throw new Error(
      "Invalid registry URL. Use HTTPS (or local HTTP on localhost or a loopback address), without credentials, query or fragment.",
    )
  }

  return url.href.replace(/\/+$/, "")
}

async function registryItemJson(
  url: string,
  fetcher: NonNullable<InstallOptions["fetcher"]>,
  timeoutMs: number,
) {
  const controller = new AbortController()
  const deadline = Promise.withResolvers<never>()

  const timer = setTimeout(() => {
    deadline.reject(
      new Error(
        `Registry request timed out after ${timeoutMs}ms: ${url}. Check your connection and --registry URL.`,
      ),
    )
    controller.abort()
  }, timeoutMs)

  async function read() {
    let response: Response

    try {
      response = await fetcher(url, {
        signal: controller.signal,
        redirect: "error",
      })
    } catch {
      throw new Error(
        `Registry network error: ${url}. Check your connection and --registry URL.`,
      )
    }

    if (response.status >= 300 && response.status < 400) {
      throw new Error(
        `Registry redirect rejected: ${url} (HTTP ${response.status}). Redirects are not allowed; check --registry URL.`,
      )
    }

    if (!response.ok) {
      throw new Error(
        `Registry request failed: ${url} (HTTP ${response.status}). Check --registry URL and item name.`,
      )
    }

    try {
      const value: JsonValue = await response.json()

      return value
    } catch (cause) {
      throw new Error(
        cause instanceof SyntaxError
          ? `Registry returned malformed JSON: ${url}. Check --registry URL and registry contents.`
          : `Registry network error reading response: ${url}. Check your connection and --registry URL.`,
      )
    }
  }

  try {
    return await Promise.race([read(), deadline.promise])
  } finally {
    clearTimeout(timer)
    controller.abort()
  }
}

export function isRecord(
  value: JsonValue | Partial<InstallPaths> | undefined,
): value is JsonObject {
  // oxlint-disable-next-line quality/no-runtime-typeof -- SAFETY: reject primitives before reading untrusted registry JSON.
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function isString(value: unknown): value is string {
  // oxlint-disable-next-line quality/no-runtime-typeof -- SAFETY: validate untrusted registry fields before use.
  return typeof value === "string"
}

function isStringArray(value: JsonValue | undefined): value is string[] {
  return Array.isArray(value) && value.every(isString)
}

function safePath(path: string) {
  const parts = path.split("/")

  if (
    parts.length < 2 ||
    parts.some(
      (part) =>
        part === "." ||
        part === ".." ||
        !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(part),
    )
  ) {
    throw new Error(`Unsafe registry path: ${path}`)
  }

  return parts
}

function targetPath(target: string) {
  if (!target.startsWith("@/")) {
    throw new Error(`Unsafe registry target: ${target}`)
  }

  const parts = safePath(target.slice(2))

  return join("src", ...parts)
}

function hash(content: string) {
  return `sha256-${createHash("sha256").update(content).digest("base64")}`
}

function validImportPrefix(value: unknown): value is string {
  return value === "@" || isPackageName(value)
}

function parseItem(value: JsonValue, name: string): RegistryItem {
  if (
    !isRecord(value) ||
    value.schemaVersion !== 1 ||
    value.name !== name ||
    !isString(value.type) ||
    !types.has(value.type) ||
    !isString(value.title) ||
    !isString(value.description) ||
    !isString(value.registryVersion) ||
    !value.registryVersion.trim() ||
    !isStringArray(value.categories) ||
    !isStringArray(value.dependencies) ||
    !isStringArray(value.devDependencies) ||
    !isStringArray(value.peerDependencies) ||
    !isStringArray(value.registryDependencies) ||
    !Array.isArray(value.files) ||
    value.files.length === 0
  ) {
    throw new Error(`Invalid registry item: ${name}`)
  }

  for (const dependency of value.registryDependencies) {
    if (!namePattern.test(dependency)) {
      throw new Error(`Invalid registry dependency: ${dependency}`)
    }
  }

  for (const dependency of [...value.dependencies, ...value.devDependencies]) {
    if (
      !dependency ||
      dependency.startsWith("-") ||
      /[\r\n\0]/.test(dependency)
    ) {
      throw new Error(`Invalid package dependency: ${dependency}`)
    }
  }

  const files: RegistryFile[] = []

  for (const file of value.files) {
    if (
      !isRecord(file) ||
      !isString(file.path) ||
      !isString(file.target) ||
      !isString(file.type) ||
      !types.has(file.type) ||
      !isString(file.content) ||
      !isString(file.integrity) ||
      !hashPattern.test(file.integrity)
    ) {
      throw new Error(`Invalid registry file in ${name}`)
    }

    safePath(file.path)
    targetPath(file.target)

    if (hash(file.content) !== file.integrity) {
      throw new Error(`Integrity mismatch: ${file.target}`)
    }

    files.push({
      content: file.content,
      integrity: file.integrity,
      path: file.path,
      target: file.target,
      type: file.type,
    })
  }

  return {
    name,
    files,
    dependencies: value.dependencies,
    devDependencies: value.devDependencies,
    registryDependencies: value.registryDependencies,
    registryVersion: value.registryVersion,
  }
}

export async function existingFile(root: string, relative: string) {
  const parts = relative.split("/")
  let current = root

  for (const [index, part] of parts.entries()) {
    current = join(current, part)

    const entry = await lstat(current).catch((cause: unknown) => {
      if (cause instanceof Error && "code" in cause && cause.code === "ENOENT")
        return null
      throw cause
    })

    if (!entry) return false

    if (
      entry.isSymbolicLink() ||
      (index < parts.length - 1 && !entry.isDirectory())
    ) {
      throw new Error(`Unsafe existing path: ${relative}`)
    }

    if (index === parts.length - 1 && !entry.isFile()) {
      throw new Error(`Not a regular file: ${relative}`)
    }
  }

  return true
}

function readManifest(content: string | null): Manifest {
  if (content === null) return { version: 1, files: {} }

  const value: JsonValue = JSON.parse(content)

  if (
    !isRecord(value) ||
    value.version !== 1 ||
    !isRecord(value.files) ||
    (value.importPrefix !== undefined && !validImportPrefix(value.importPrefix))
  ) {
    throw new Error("Invalid ui.json")
  }

  const paths = readPaths(value.paths)

  if (
    value.sourceRoot !== undefined &&
    value.sourceRoot !== "." &&
    value.sourceRoot !== "src"
  )
    throw new Error("Invalid source root in ui.json")
  const files: Record<string, string> = {}

  for (const [path, integrity] of Object.entries(value.files)) {
    if (
      path !== safePath(path).join("/") ||
      !isString(integrity) ||
      !hashPattern.test(integrity)
    ) {
      throw new Error("Invalid ui.json")
    }

    files[path] = integrity
  }

  const provenance: Record<string, Provenance> = {}

  if (value.provenance !== undefined) {
    if (!isRecord(value.provenance)) throw new Error("Invalid ui.json")

    for (const [path, origin] of Object.entries(value.provenance)) {
      if (
        !files[path] ||
        !isRecord(origin) ||
        !isString(origin.registryUrl) ||
        !isRecord(origin.items) ||
        Object.keys(origin.items).length === 0
      )
        throw new Error("Invalid ui.json")

      try {
        if (registryBaseUrl(origin.registryUrl) !== origin.registryUrl)
          throw new Error("Invalid ui.json")
      } catch {
        throw new Error("Invalid ui.json provenance registry URL")
      }

      const items: Record<string, string> = {}

      for (const [name, version] of Object.entries(origin.items)) {
        if (!namePattern.test(name) || !isString(version) || !version.trim())
          throw new Error("Invalid ui.json")
        items[name] = version
      }

      if (origin.target !== undefined) {
        if (!isString(origin.target))
          throw new Error("Invalid ui.json provenance target")
        targetPath(origin.target)
      }

      provenance[path] = {
        registryUrl: origin.registryUrl,
        items,
        ...(origin.target !== undefined && { target: origin.target }),
      }
    }
  }

  return {
    version: 1,
    files,
    ...(paths !== undefined && { paths }),
    ...(value.sourceRoot !== undefined && { sourceRoot: value.sourceRoot }),
    ...(value.provenance !== undefined && { provenance }),
    ...(value.importPrefix !== undefined && {
      importPrefix: value.importPrefix,
    }),
  }
}

export interface FileChange {
  before: string | null
  after: string | null
}

interface StagedFile {
  path: string
  before: Buffer | null
  after: Buffer | null
  mode: number | null
  afterMode: number | null
  changed: boolean
  directory: string | null
}

export async function writeFiles(
  root: string,
  changes: ReadonlyMap<string, FileChange>,
  prepare?: () => Promise<void>,
) {
  const staged: StagedFile[] = []
  const committed: StagedFile[] = []
  const recovery = new Set<StagedFile>()

  async function verify(
    file: StagedFile,
    expected: Buffer | null,
    mode: number | null,
  ) {
    const exists = await existingFile(root, file.path)
    const path = join(root, file.path)
    const current = exists ? await readFile(path) : null

    if (
      (current === null
        ? expected !== null
        : expected === null || !current.equals(expected)) ||
      (exists && ((await lstat(path)).mode & 0o7777) !== mode)
    ) {
      throw new Error(`File changed before commit: ${file.path}`)
    }
  }

  async function cleanup() {
    const failures: string[] = []

    for (const file of staged) {
      if (!file.directory || recovery.has(file)) continue

      try {
        await existingFile(root, relative(root, join(file.directory, "before")))
        await rm(file.directory, { recursive: true, force: true })
      } catch (cause) {
        failures.push(
          `Temporary cleanup failed: ${file.directory}: ${String(cause)}`,
        )
      }
    }

    return failures
  }

  try {
    staged.push(
      ...(await Promise.all(
        [...changes].map(async ([path, change]): Promise<StagedFile> => {
          const exists = await existingFile(root, path)
          const before = exists ? await readFile(join(root, path)) : null

          if ((before?.toString("utf8") ?? null) !== change.before) {
            throw new Error(`File changed before commit: ${path}`)
          }

          const mode = exists
            ? (await lstat(join(root, path))).mode & 0o7777
            : null

          const after = change.after === null ? null : Buffer.from(change.after)

          return {
            path,
            before,
            after,
            mode,
            afterMode: mode,
            changed: change.before !== change.after,
            directory: null,
          }
        }),
      )),
    )

    for (const file of staged) {
      if (!file.changed) continue
      const parent = dirname(join(root, file.path))
      await mkdir(parent, { recursive: true })
      await verify(file, file.before, file.mode)
      file.directory = await mkdtemp(join(parent, ".yopem-ui-"))

      if (file.after !== null) {
        const path = join(file.directory, "after")
        await writeFile(path, file.after, { flag: "wx" })

        if (file.mode !== null) await chmod(path, file.mode)
        file.afterMode = (await lstat(path)).mode & 0o7777
      }

      if (file.before !== null) {
        const path = join(file.directory, "before")
        await writeFile(path, file.before, { flag: "wx" })
        await chmod(path, file.mode!)
      }
    }

    await prepare?.()

    await Promise.all(
      staged.map((file) => verify(file, file.before, file.mode)),
    )

    for (const file of staged) {
      if (!file.changed) continue
      await verify(file, file.before, file.mode)
      const path = join(root, file.path)

      try {
        if (file.after === null) await unlink(path)
        else if (file.before === null)
          await link(join(file.directory!, "after"), path)
        else await rename(join(file.directory!, "after"), path)
      } catch (cause) {
        throw new Error(`Failed to commit ${file.path}: ${String(cause)}`, {
          cause,
        })
      }

      committed.push(file)
    }
  } catch (cause) {
    const failures: string[] = []

    for (const file of committed.toReversed()) {
      try {
        await verify(
          file,
          file.after,
          file.after === null ? null : file.afterMode,
        )

        if (file.before === null) await unlink(join(root, file.path))
        else if (file.after === null)
          await link(join(file.directory!, "before"), join(root, file.path))
        else
          await rename(join(file.directory!, "before"), join(root, file.path))
      } catch (rollbackCause) {
        const backup =
          file.before === null
            ? ""
            : `; original backup: ${join(file.directory!, "before")}`

        if (file.before !== null) recovery.add(file)
        failures.push(`${file.path}: ${String(rollbackCause)}${backup}`)
      }
    }

    const rollback = committed.length
      ? failures.length
        ? `\nRollback incomplete: ${failures.join("\n")}`
        : "\nCommitted files restored."
      : ""

    const cleanupFailures = await cleanup()
    throw new Error(
      `${cause instanceof Error ? cause.message : String(cause)}${rollback}${cleanupFailures.length ? `\n${cleanupFailures.join("\n")}` : ""}`,
      { cause },
    )
  }

  const failures = await cleanup()

  if (failures.length) {
    throw new Error(`Files committed. ${failures.join("\n")}`)
  }
}

export async function runBun(args: string[], cwd: string) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn("bun", args, { cwd, stdio: "inherit" })
    child.on("error", reject)
    child.on("exit", (code) => {
      if (code === 0) resolve()
      else reject(new Error(`bun ${args.join(" ")} failed`))
    })
  })
}

export async function planInstall(name: string, options: InstallOptions = {}) {
  if (!namePattern.test(name)) throw new Error(`Invalid item name: ${name}`)
  const registryUrl = registryBaseUrl(options.registryUrl ?? defaultRegistryUrl)
  const requestTimeoutMs = options.requestTimeoutMs ?? 30_000

  if (
    !Number.isInteger(requestTimeoutMs) ||
    requestTimeoutMs <= 0 ||
    requestTimeoutMs > 2_147_483_647
  ) {
    throw new Error(
      "Registry request timeout must be an integer from 1 to 2147483647ms",
    )
  }

  const root = await realpath(options.cwd ?? process.cwd())
  const run = await packageRunner(root, options.run)

  const manifestText = (await existingFile(root, "ui.json"))
    ? await readFile(join(root, "ui.json"), "utf8")
    : null

  const manifest = readManifest(manifestText)
  const originalManifest = JSON.stringify(manifest)
  const importPrefix = options.importPrefix ?? manifest.importPrefix ?? "@"

  if (
    !validImportPrefix(importPrefix) ||
    (options.importPrefix !== undefined &&
      !validImportPrefix(options.importPrefix))
  ) {
    throw new Error(`Invalid import prefix: ${importPrefix}`)
  }

  if (
    importPrefix !== (manifest.importPrefix ?? "@") &&
    Object.keys(manifest.files).length > 0
  ) {
    throw new Error("Cannot change import prefix with tracked files")
  }

  const overrides = readPaths(options.paths)
  const paths = { ...defaultPaths, ...manifest.paths, ...overrides }
  const sourceRoot = options.sourceRoot ?? manifest.sourceRoot ?? "src"

  if (
    options.sourceRoot !== undefined &&
    options.sourceRoot !== "." &&
    options.sourceRoot !== "src"
  )
    throw new Error("Invalid source root")

  if (
    sourceRoot !== (manifest.sourceRoot ?? "src") &&
    Object.keys(manifest.files).length > 0
  )
    throw new Error("Cannot change source root with tracked files")

  for (const tracked of Object.keys(manifest.files)) {
    const target =
      manifest.provenance?.[tracked]?.target ??
      (tracked.startsWith("src/") ? `@/${tracked.slice(4)}` : undefined)

    if (target && mapTargetPath(target, paths, sourceRoot) !== tracked)
      throw new Error(
        `Cannot change install paths with tracked file: ${tracked}`,
      )
  }

  const importPaths = { ...paths }

  for (const key of pathKeys) {
    importPaths[key] = mapImportPath(
      `@/${key === "ui" ? "components/ui" : key}`,
      paths,
      importPrefix,
      sourceRoot,
    )
  }

  if (overrides !== undefined)
    manifest.paths = { ...manifest.paths, ...overrides }

  if (options.sourceRoot !== undefined) manifest.sourceRoot = sourceRoot

  if (options.importPrefix !== undefined) manifest.importPrefix = importPrefix
  const items = new Map<string, RegistryItem>()
  const visiting = new Set<string>()
  const fetcher = options.fetcher ?? fetch

  async function visit(itemName: string): Promise<void> {
    if (items.has(itemName)) return

    if (visiting.has(itemName)) {
      throw new Error(`Cyclic registry dependency: ${itemName}`)
    }

    visiting.add(itemName)

    const item = parseItem(
      await registryItemJson(
        `${registryUrl}/${itemName}.json`,
        fetcher,
        requestTimeoutMs,
      ),
      itemName,
    )

    for (const dependency of item.registryDependencies) await visit(dependency)
    items.set(itemName, item)
    visiting.delete(itemName)
  }

  await visit(name)
  const files = new Map<string, RegistryFile>()
  const owners = new Map<string, Record<string, string>>()
  const dependencies = new Set<string>()
  const devDependencies = new Set<string>()

  for (const item of items.values()) {
    for (const dependency of item.dependencies) dependencies.add(dependency)

    for (const dependency of item.devDependencies)
      devDependencies.add(dependency)

    for (const file of item.files) {
      const path = mapTargetPath(file.target, paths, sourceRoot)

      const content = file.content.replace(
        /(["'`])@\/([^"'`\s]*)/g,
        (_match: string, quote: string, specifier: string) => {
          return `${quote}${mapImportPath(`@/${specifier}`, paths, importPrefix, sourceRoot)}`
        },
      )

      const transformed = { ...file, content, integrity: hash(content) }
      const previous = files.get(path)

      if (previous && previous.target !== file.target) {
        throw new Error(`Install path collision: ${path}`)
      }

      for (const other of files.keys()) {
        if (other.startsWith(`${path}/`) || path.startsWith(`${other}/`))
          throw new Error(`Install path collision: ${path} and ${other}`)
      }

      const originTarget = manifest.provenance?.[path]?.target

      if (originTarget && originTarget !== file.target)
        throw new Error(`Install path collision with tracked file: ${path}`)

      if (previous && previous.integrity !== transformed.integrity) {
        throw new Error(`Conflicting registry files: ${path}`)
      }

      files.set(path, transformed)
      const ownership = owners.get(path) ?? {}
      ownership[item.name] = item.registryVersion
      owners.set(path, ownership)
    }
  }

  const changes = new Map<string, FileChange>()
  const previewFiles: InstallPreview["files"] = []
  let installed = 0
  let skipped = 0
  const warnings: string[] = []

  function track(path: string, integrity: string, applied: boolean) {
    manifest.files[path] = integrity
    const previous = manifest.provenance?.[path]

    if (!applied && previous && previous.registryUrl !== registryUrl) return

    const ownership =
      applied || !previous ? { ...owners.get(path)! } : { ...previous.items }

    if (!applied && previous) {
      for (const [name, version] of Object.entries(owners.get(path)!)) {
        if (!Object.hasOwn(ownership, name)) ownership[name] = version
      }
    }

    manifest.provenance ??= {}
    manifest.provenance[path] = {
      registryUrl,
      items: ownership,
      target: files.get(path)!.target,
    }
  }

  const currentFiles = await Promise.all(
    [...files].map(async ([path, file]) => {
      const exists = await existingFile(root, path)
      const before = exists ? await readFile(join(root, path), "utf8") : null

      return { path, file, before }
    }),
  )

  for (const { path, file, before } of currentFiles) {
    const current = before === null ? null : hash(before)
    changes.set(path, { before, after: before })
    const previous = manifest.files[path]
    const origin = manifest.provenance?.[path]

    if (origin && origin.registryUrl !== registryUrl) {
      warnings.push(
        `Updating tracked file from a different registry: ${path}. Previous: ${origin.registryUrl}; requested: ${registryUrl}. Review source before applying.`,
      )
    }

    const decision: InstallPreview["files"][number] = { path, action: "skip" }
    previewFiles.push(decision)

    if (current && previous && current !== previous && !options.force) {
      decision.reason = `Modified file: ${path} (use --force to overwrite)`

      if (options.mode === "update") {
        decision.action = "conflict"

        if (!options.dryRun) throw new Error(decision.reason)
      } else skipped++

      continue
    }

    if (current === file.integrity) {
      track(path, file.integrity, false)
      decision.reason = `Identical file: ${path}`
      skipped++
    } else if (
      current &&
      !options.force &&
      previous === current &&
      options.mode !== "update"
    ) {
      decision.reason = `Tracked file: ${path} (use update to replace)`
      skipped++
    } else if (current && !options.force && previous !== current) {
      decision.action = "conflict"
      decision.reason = `Existing file: ${path} (use --force to overwrite)`

      if (!options.dryRun) throw new Error(decision.reason)
    } else {
      decision.action = "write"

      if (current && options.force) decision.forced = true
      changes.set(path, { before, after: file.content })
      track(path, file.integrity, true)
      installed++
    }
  }

  const manifestAfter =
    manifestText !== null && JSON.stringify(manifest) === originalManifest
      ? manifestText
      : `${JSON.stringify(manifest, null, 2)}\n`

  changes.set("ui.json", { before: manifestText, after: manifestAfter })
  previewFiles.push({
    path: "ui.json",
    action: manifestText === manifestAfter ? "skip" : "write",
  })

  const pending = await pendingDependencies(root, dependencies, devDependencies)

  return {
    root,
    run,
    paths,
    importPaths,
    changes,
    installed,
    skipped,
    warnings,
    requirements: {
      dependencies: [...dependencies],
      devDependencies: [...devDependencies],
    },
    preview: { files: previewFiles, ...pending },
  }
}

export async function installItem(
  name: string,
  options: InstallOptions = {},
): Promise<InstallResult> {
  return await applyInstall(await planInstall(name, options), options)
}

export async function applyInstall(
  plan: Awaited<ReturnType<typeof planInstall>>,
  options: InstallOptions = {},
): Promise<InstallResult> {
  const { root, run, changes, installed, skipped, warnings, preview } = plan
  const warningResult = warnings.length ? { warnings } : {}

  for (const warning of warnings) options.onWarning?.(warning)

  if (options.dryRun) {
    return {
      installed: 0,
      skipped,
      preview,
      ...warningResult,
    }
  }

  let dependenciesStarted = false

  try {
    await writeFiles(root, changes, async () => {
      if (preview.dependencies.length) {
        dependenciesStarted = true
        await run(["add", ...preview.dependencies], root)
      }

      if (preview.devDependencies.length) {
        dependenciesStarted = true
        await run(["add", "-d", ...preview.devDependencies], root)
      }
    })
  } catch (cause) {
    if (!dependenciesStarted) throw cause
    throw new Error(
      `${cause instanceof Error ? cause.message : String(cause)}\nDependencies may have changed (package.json, lockfiles, node_modules); package-manager changes were not rolled back.`,
      { cause },
    )
  }

  return { installed, skipped, ...warningResult }
}
