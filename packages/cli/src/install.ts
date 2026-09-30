import { createHash } from "node:crypto"
import { lstat, mkdir, readFile, realpath, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"

const registryUrl = "http://localhost:3100/r"

const namePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const hashPattern = /^sha256-[A-Za-z0-9+/]{43}=$/

const types = new Set([
  "registry:base",
  "registry:hook",
  "registry:lib",
  "registry:style",
  "registry:ui",
])

type RecordValue = Record<string, unknown>

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
}

interface Manifest {
  version: 1
  files: Record<string, string>
}

export interface InstallOptions {
  cwd?: string
  force?: boolean
  mode?: "add" | "update"
  fetcher?: (url: string) => Promise<Response>
  run?: (args: string[], cwd: string) => Promise<void>
}

export function isRecord(value: unknown): value is RecordValue {
  // oxlint-disable-next-line quality/no-runtime-typeof -- SAFETY: reject primitives before reading untrusted registry JSON.
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function isString(value: unknown): value is string {
  // oxlint-disable-next-line quality/no-runtime-typeof -- SAFETY: validate untrusted registry fields before use.
  return typeof value === "string"
}

function isStringArray(value: unknown): value is string[] {
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

function parseItem(value: unknown, name: string): RegistryItem {
  if (
    !isRecord(value) ||
    value.schemaVersion !== 1 ||
    value.name !== name ||
    !isString(value.type) ||
    !types.has(value.type) ||
    !isString(value.title) ||
    !isString(value.description) ||
    !isString(value.registryVersion) ||
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
  }
}

export async function existingFile(root: string, relative: string) {
  const parts = relative.split("/")
  let current = root

  for (const [index, part] of parts.entries()) {
    current = join(current, part)

    const entry = await lstat(current).catch((error: unknown) => {
      if (isRecord(error) && error.code === "ENOENT") return null
      throw error
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

async function readManifest(root: string): Promise<Manifest> {
  if (!(await existingFile(root, ".yopem-ui.json"))) {
    return { version: 1, files: {} }
  }

  const value: unknown = JSON.parse(
    await readFile(join(root, ".yopem-ui.json"), "utf8"),
  )

  if (!isRecord(value) || value.version !== 1 || !isRecord(value.files)) {
    throw new Error("Invalid .yopem-ui.json")
  }

  const files: Record<string, string> = {}

  for (const [path, integrity] of Object.entries(value.files)) {
    if (
      path !== targetPath(`@/${path.slice(4)}`) ||
      !path.startsWith("src/") ||
      !isString(integrity) ||
      !hashPattern.test(integrity)
    ) {
      throw new Error("Invalid .yopem-ui.json")
    }

    files[path] = integrity
  }

  return { version: 1, files }
}

export async function runBun(args: string[], cwd: string) {
  const process = Bun.spawn(["bun", ...args], {
    cwd,
    stdout: "inherit",
    stderr: "inherit",
  })

  if ((await process.exited) !== 0) {
    throw new Error(`bun ${args.join(" ")} failed`)
  }
}

export async function installItem(name: string, options: InstallOptions = {}) {
  if (!namePattern.test(name)) throw new Error(`Invalid item name: ${name}`)
  const root = await realpath(options.cwd ?? process.cwd())
  const manifest = await readManifest(root)
  const items = new Map<string, RegistryItem>()
  const visiting = new Set<string>()
  const fetcher = options.fetcher ?? fetch

  async function visit(itemName: string): Promise<void> {
    if (items.has(itemName)) return

    if (visiting.has(itemName)) {
      throw new Error(`Cyclic registry dependency: ${itemName}`)
    }

    visiting.add(itemName)
    const response = await fetcher(`${registryUrl}/${itemName}.json`)

    if (!response.ok)
      throw new Error(
        `Registry request failed: ${itemName} (${response.status})`,
      )
    const item = parseItem(await response.json(), itemName)

    for (const dependency of item.registryDependencies) await visit(dependency)
    items.set(itemName, item)
    visiting.delete(itemName)
  }

  await visit(name)
  const files = new Map<string, RegistryFile>()
  const dependencies = new Set<string>()
  const devDependencies = new Set<string>()

  for (const item of items.values()) {
    for (const dependency of item.dependencies) dependencies.add(dependency)

    for (const dependency of item.devDependencies)
      devDependencies.add(dependency)

    for (const file of item.files) {
      const path = targetPath(file.target)
      const previous = files.get(path)

      if (previous && previous.integrity !== file.integrity) {
        throw new Error(`Conflicting registry files: ${path}`)
      }

      files.set(path, file)
    }
  }

  const writes: [string, RegistryFile][] = []
  let skipped = 0

  for (const [path, file] of files) {
    const exists = await existingFile(root, path)

    const current = exists
      ? hash(await readFile(join(root, path), "utf8"))
      : null

    const previous = manifest.files[path]

    if (current && previous && current !== previous && !options.force) {
      if (options.mode === "update") {
        throw new Error(`Modified file: ${path} (use --force to overwrite)`)
      }

      skipped++
      continue
    }

    if (current === file.integrity) {
      manifest.files[path] = file.integrity
      skipped++
    } else if (
      current &&
      !options.force &&
      previous === current &&
      options.mode !== "update"
    ) {
      skipped++
    } else if (current && !options.force && previous !== current) {
      throw new Error(`Existing file: ${path} (use --force to overwrite)`)
    } else {
      writes.push([path, file])
    }
  }

  const run = options.run ?? runBun

  if (dependencies.size) await run(["add", ...dependencies], root)

  for (const dependency of dependencies) devDependencies.delete(dependency)

  if (devDependencies.size) await run(["add", "-d", ...devDependencies], root)

  for (const [path, file] of writes) {
    if (await existingFile(root, path)) {
      const current = hash(await readFile(join(root, path), "utf8"))
      const previous = manifest.files[path]

      if (
        current !== previous &&
        current !== file.integrity &&
        !options.force
      ) {
        throw new Error(`Modified file: ${path} (use --force to overwrite)`)
      }
    }

    await mkdir(dirname(join(root, path)), { recursive: true })
    await writeFile(join(root, path), file.content, { flag: "w" })
    manifest.files[path] = file.integrity
  }

  await writeFile(
    join(root, ".yopem-ui.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  )

  return { installed: writes.length, skipped }
}
