#!/usr/bin/env node
import { spawnSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises"
import { dirname, isAbsolute, join, relative, resolve } from "node:path"
import { stdin, stdout } from "node:process"
import { createInterface } from "node:readline/promises"

import { configureFramework } from "./adapters.js"
import {
  defaultConfig,
  detectProject,
  findProjectRoot,
  hash,
  integrity,
  parseConfig,
  parseItem,
  parseLock,
  registryUrl,
  resolveGraph,
  rewriteAliases,
  targetPath,
  type Lock,
  type PackageManager,
  type RegistryItem,
} from "./core.js"

interface Flags {
  dryRun: boolean
  overwrite: boolean
  skipInstall: boolean
  yes: boolean
}
const emptyLock = (): Lock => ({ items: {}, version: 1 })

function parseArgs(argv: string[]) {
  const args: string[] = []
  const flags: Flags = {
    dryRun: false,
    overwrite: false,
    skipInstall: false,
    yes: false,
  }
  for (const arg of argv) {
    if (arg === "--dry-run") flags.dryRun = true
    else if (arg === "--overwrite") flags.overwrite = true
    else if (arg === "--skip-install") flags.skipInstall = true
    else if (arg === "--yes" || arg === "-y") flags.yes = true
    else if (arg.startsWith("-")) throw new Error(`Unknown flag: ${arg}`)
    else args.push(arg)
  }
  return { command: args.shift(), args, flags }
}

async function readJson(path: string) {
  return JSON.parse(await readFile(path, "utf8")) as unknown
}

async function atomicWrite(path: string, content: string) {
  await mkdir(dirname(path), { recursive: true })
  const temporary = `${path}.${process.pid}.${Date.now()}.tmp`
  await writeFile(temporary, content)
  await rename(temporary, path)
}

async function writeJson(path: string, value: unknown, dryRun = false) {
  if (!dryRun) await atomicWrite(path, `${JSON.stringify(value, null, 2)}\n`)
}

async function confirm(message: string, flags: Flags) {
  if (flags.yes || flags.overwrite) return true
  if (!stdin.isTTY || !stdout.isTTY) return false
  const prompt = createInterface({ input: stdin, output: stdout })
  try {
    const answer = await prompt.question(`${message} [y/N] `)
    return answer.trim().toLowerCase() === "y"
  } finally {
    prompt.close()
  }
}

function packageName(spec: string) {
  if (!spec.startsWith("@")) return spec.split("@")[0] ?? spec
  const separator = spec.indexOf("@", 1)
  return separator === -1 ? spec : spec.slice(0, separator)
}

async function installPackages(
  root: string,
  manager: PackageManager,
  runtime: string[],
  development: string[],
  flags: Flags,
) {
  if (flags.skipInstall || flags.dryRun) {
    const requested = [...runtime, ...development]
    if (requested.length) {
      console.info(
        `${flags.dryRun ? "Would install" : "Skipped installing"} ${requested.join(", ")}`,
      )
    }
    return
  }
  let packageJson: {
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
  } = {}
  try {
    packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"))
  } catch {
    throw new Error("package.json is required before installing Yopem UI")
  }
  const installed = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  }
  const missingRuntime = runtime.filter((spec) => !installed[packageName(spec)])
  const missingDevelopment = development.filter(
    (spec) => !installed[packageName(spec)],
  )
  const run = (specs: string[], developmentOnly: boolean) => {
    if (!specs.length) return
    const args =
      manager === "npm"
        ? ["install", ...(developmentOnly ? ["--save-dev"] : []), ...specs]
        : manager === "yarn"
          ? ["add", ...(developmentOnly ? ["--dev"] : []), ...specs]
          : ["add", ...(developmentOnly ? ["--dev"] : []), ...specs]
    const result = spawnSync(manager, args, { cwd: root, stdio: "inherit" })
    if (result.status !== 0) {
      throw new Error(`${manager} failed to install ${specs.join(", ")}`)
    }
  }
  run(missingRuntime, false)
  run(missingDevelopment, true)
}

function compilerDependencies(
  framework: ReturnType<typeof detectProject>["framework"],
) {
  return framework === "next-app" || framework === "next-pages"
    ? [
        "@stylexjs/babel-plugin@^0.19.0",
        "@stylexjs/postcss-plugin@^0.19.0",
        "autoprefixer@^10.4.0",
      ]
    : framework === "vite" || framework === "tanstack-start"
      ? ["@stylexjs/unplugin@^0.19.0", "unplugin@^2.3.11"]
      : []
}

async function ensureNextStylexDirective(
  root: string,
  cssPath: string,
  dryRun: boolean,
) {
  const path = resolve(root, cssPath)
  if (dryRun) {
    console.info(`Would append @stylex to ${cssPath}`)
    return
  }
  const content = await readFile(path, "utf8")
  if (!content.includes("@stylex;"))
    await atomicWrite(path, `${content.trimEnd()}\n\n@stylex;\n`)
}

function configForProject(
  root: string,
  framework: ReturnType<typeof detectProject>["framework"],
) {
  let sourceRoot = "src"
  for (const name of ["tsconfig.json", "jsconfig.json"]) {
    try {
      const value = JSON.parse(readFileSync(join(root, name), "utf8")) as {
        compilerOptions?: { paths?: Record<string, string[]> }
      }
      const target = value.compilerOptions?.paths?.["@/*"]?.[0]
      if (target) {
        sourceRoot = target
          .replace(/^\.\//, "")
          .replace(/\*$/, "")
          .replace(/\/$/, "")
          .replace(/^\.$/, "")
      }
      break
    } catch {
      // Continue to the other supported config name.
    }
  }
  const at = (path: string) => (sourceRoot ? join(sourceRoot, path) : path)
  return {
    ...defaultConfig,
    css: at("styles/yopem/styles.css"),
    framework,
    paths: {
      components: at("components"),
      hooks: at("hooks"),
      lib: at("lib"),
      styles: at("styles"),
      ui: at("components/ui"),
    },
    registry: registryUrl,
  }
}

async function loadProject() {
  const root = findProjectRoot()
  const configPath = join(root, "ui.json")
  if (!existsSync(configPath))
    throw new Error("ui.json not found. Run `yopem-ui init` first.")
  const config = parseConfig(await readJson(configPath))
  const lockPath = join(root, "ui-lock.json")
  const lock = existsSync(lockPath)
    ? parseLock(await readJson(lockPath))
    : emptyLock()
  return { root, config, lock, lockPath }
}

const endpoint = (base: string, path: string) =>
  `${base.replace(/\/$/, "")}/${path}`

async function fetchJson(url: string) {
  const response = await fetch(url, { headers: { accept: "application/json" } })
  if (!response.ok)
    throw new Error(`Registry request failed (${response.status}): ${url}`)
  try {
    return (await response.json()) as unknown
  } catch {
    throw new Error(`Registry returned invalid JSON: ${url}`)
  }
}

async function fetchItem(base: string, name: string) {
  return parseItem(
    await fetchJson(endpoint(base, `${encodeURIComponent(name)}.json`)),
  )
}

async function fetchGraph(base: string, roots: string[]) {
  const items = new Map<string, RegistryItem>()
  const loading = new Set<string>()
  const load = async (name: string): Promise<void> => {
    if (items.has(name)) return
    if (loading.has(name)) return
    loading.add(name)
    const item = await fetchItem(base, name)
    if (item.name !== name)
      throw new Error(`Registry returned ${item.name} for ${name}`)
    items.set(name, item)
    await Promise.all(item.registryDependencies.map(load))
    loading.delete(name)
  }
  await Promise.all(roots.map(load))
  return resolveGraph(roots, items)
}

async function initialize(flags: Flags) {
  const root = process.cwd()
  const configPath = join(root, "ui.json")
  if (existsSync(configPath) && !flags.overwrite)
    throw new Error("ui.json already exists; use --overwrite")
  const detected = detectProject(root)
  const config = {
    $schema: "https://ui.yopem.com/schema/config.json",
    ...configForProject(root, detected.framework),
  }
  console.info(
    `${flags.dryRun ? "Would create" : "Created"} ui.json (${detected.framework}, ${detected.manager}${detected.workspace ? ", workspace" : ""})`,
  )
  await writeJson(configPath, config, flags.dryRun)
  await writeJson(join(root, "ui-lock.json"), emptyLock(), flags.dryRun)
  await patchTsconfig(root, flags.dryRun)
  await installPackages(
    root,
    detected.manager,
    [],
    compilerDependencies(detected.framework),
    flags,
  )
  await configureFramework(root, detected.framework, flags.dryRun)
  if (flags.dryRun) {
    console.info("Would install Yopem base registry item.")
    if (
      detected.framework === "next-app" ||
      detected.framework === "next-pages"
    ) {
      await ensureNextStylexDirective(root, config.css, true)
    }
  } else {
    await install(["base"], flags)
    if (
      detected.framework === "next-app" ||
      detected.framework === "next-pages"
    ) {
      await ensureNextStylexDirective(root, config.css, false)
    }
  }
}

async function patchTsconfig(root: string, dryRun: boolean) {
  const candidates = ["tsconfig.json", "jsconfig.json"]
  const name = candidates.find((candidate) => existsSync(join(root, candidate)))
  if (!name) {
    console.info(
      "Manual: configure @/* -> ./src/* in tsconfig/jsconfig and bundler.",
    )
    return
  }
  const path = join(root, name)
  try {
    const value = JSON.parse(await readFile(path, "utf8")) as Record<
      string,
      unknown
    >
    const compilerOptions = (value.compilerOptions ?? {}) as Record<
      string,
      unknown
    >
    const paths = (compilerOptions.paths ?? {}) as Record<string, unknown>
    if (paths["@/*"] === undefined) paths["@/*"] = ["./src/*"]
    compilerOptions.paths = paths
    value.compilerOptions = compilerOptions
    if (!dryRun) await writeJson(path, value)
    console.info(
      `${dryRun ? "Would patch" : "Patched"} ${name} with @/* alias.`,
    )
  } catch {
    console.info(
      `Manual: add compilerOptions.paths { "@/*": ["./src/*"] } to ${name}; comments prevented safe patch.`,
    )
  }
  if (detectProject(root).framework === "vite") {
    console.info("Manual if unresolved: add Vite resolve.alias '@' -> './src'.")
  }
}

async function install(names: string[], flags: Flags, updating = false) {
  if (!names.length) {
    throw new Error(
      `${updating ? "update" : "add"} requires at least one component`,
    )
  }
  const project = await loadProject()
  const items = await fetchGraph(project.config.registry, names)
  const detected = detectProject(project.root)
  await installPackages(
    project.root,
    detected.manager,
    [...new Set(items.flatMap((item) => item.dependencies))],
    [...new Set(items.flatMap((item) => item.devDependencies))],
    flags,
  )
  for (const item of items) {
    const files: Record<string, string> = {}
    for (const file of item.files) {
      if (file.integrity && integrity(file.content) !== file.integrity) {
        throw new Error(`Integrity check failed for ${item.name}/${file.path}`)
      }
      const relativePath = targetPath(file.target ?? file.path, project.config)
      const path = resolve(project.root, relativePath)
      const target = relative(project.root, path)
      if (
        target === ".." ||
        target.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) ||
        isAbsolute(target)
      ) {
        throw new Error(`Unsafe target path: ${relativePath}`)
      }
      const content = rewriteAliases(file.content, project.config.aliases)
      const previousHash = project.lock.items[item.name]?.files[relativePath]
      if (existsSync(path) && !flags.overwrite) {
        const currentHash = hash(await readFile(path))
        if (!previousHash || currentHash !== previousHash) {
          const allowed = await confirm(
            `Overwrite modified file ${relativePath}?`,
            flags,
          )
          if (!allowed) {
            throw new Error(
              `Refusing to overwrite modified file: ${relativePath} (use --overwrite)`,
            )
          }
        }
      }
      console.info(
        `${flags.dryRun ? "Would write" : "Writing"} ${relativePath}`,
      )
      if (!flags.dryRun) await atomicWrite(path, content)
      files[relativePath] = hash(content)
    }
    project.lock.items[item.name] = {
      dependencies: item.dependencies,
      files,
      registryDependencies: item.registryDependencies,
      version: item.registryVersion,
    }
  }
  await writeJson(project.lockPath, project.lock, flags.dryRun)
}

async function listInstalled() {
  const { lock } = await loadProject()
  const names = Object.keys(lock.items).sort()
  console.info(names.length ? names.join("\n") : "No components installed.")
}

async function registryIndex(base: string) {
  const value = await fetchJson(endpoint(base, "registry.json"))
  const entries = Array.isArray(value)
    ? value
    : typeof value === "object" &&
        value !== null &&
        Array.isArray((value as Record<string, unknown>).items)
      ? (value as { items: unknown[] }).items
      : null
  if (!entries)
    throw new Error("Invalid registry index: expected array or { items: [] }")
  return entries.map((entry) => {
    if (typeof entry === "string") return { name: entry, description: "" }
    if (
      typeof entry !== "object" ||
      entry === null ||
      typeof (entry as Record<string, unknown>).name !== "string"
    ) {
      throw new Error("Invalid registry index entry")
    }
    return {
      name: (entry as { name: string }).name,
      description:
        typeof (entry as Record<string, unknown>).description === "string"
          ? (entry as { description: string }).description
          : "",
    }
  })
}

async function searchRegistry(query: string) {
  const { config } = await loadProject()
  const needle = query.toLowerCase()
  const entries = (await registryIndex(config.registry)).filter(
    ({ name, description }) =>
      `${name} ${description}`.toLowerCase().includes(needle),
  )
  console.info(
    entries.length
      ? entries
          .map(
            ({ name, description }) =>
              `${name}${description ? ` — ${description}` : ""}`,
          )
          .join("\n")
      : "No matches.",
  )
}

async function diffInstalled(names: string[]) {
  const project = await loadProject()
  const selected = names.length ? names : Object.keys(project.lock.items)
  if (!selected.length) return console.info("No components installed.")
  const items = await fetchGraph(project.config.registry, selected)
  let changed = false
  for (const item of items.filter(({ name }) => selected.includes(name))) {
    for (const file of item.files) {
      const relativePath = targetPath(file.target ?? file.path, project.config)
      const path = resolve(project.root, relativePath)
      const expected = hash(
        rewriteAliases(file.content, project.config.aliases),
      )
      const actual = existsSync(path) ? hash(await readFile(path)) : "missing"
      if (actual !== expected) {
        changed = true
        console.info(
          `${item.name}: ${relativePath} (${actual === "missing" ? "missing" : "modified"})`,
        )
      }
    }
  }
  if (!changed) console.info("No differences.")
}

async function updateInstalled(names: string[], flags: Flags) {
  const { lock } = await loadProject()
  await install(names.length ? names : Object.keys(lock.items), flags, true)
}

async function removeInstalled(names: string[], flags: Flags) {
  if (!names.length) throw new Error("remove requires at least one component")
  const project = await loadProject()
  const removing = new Set(names)
  for (const name of names) {
    if (!project.lock.items[name])
      throw new Error(`Component not installed: ${name}`)
  }
  while (true) {
    const dependent = Object.entries(project.lock.items).find(
      ([name, item]) =>
        !removing.has(name) &&
        item.registryDependencies.some((dependency) =>
          removing.has(dependency),
        ),
    )
    if (!dependent) break
    const allowed = await confirm(
      `${dependent[0]} depends on a removed item. Remove it too?`,
      flags,
    )
    if (!allowed) {
      throw new Error(
        `Refusing to remove dependency required by ${dependent[0]}`,
      )
    }
    removing.add(dependent[0])
  }
  const retainedFiles = new Set(
    Object.entries(project.lock.items)
      .filter(([name]) => !removing.has(name))
      .flatMap(([, item]) => Object.keys(item.files)),
  )
  for (const name of removing) {
    const item = project.lock.items[name]
    if (!item) continue
    for (const [relativePath, installedHash] of Object.entries(item.files)) {
      if (retainedFiles.has(relativePath)) continue
      const path = resolve(project.root, relativePath)
      if (
        existsSync(path) &&
        !flags.overwrite &&
        hash(await readFile(path)) !== installedHash
      ) {
        const allowed = await confirm(
          `Remove modified file ${relativePath}?`,
          flags,
        )
        if (!allowed) {
          throw new Error(
            `Refusing to remove modified file: ${relativePath} (use --overwrite)`,
          )
        }
      }
      console.info(
        `${flags.dryRun ? "Would remove" : "Removing"} ${relativePath}`,
      )
      if (!flags.dryRun) await rm(path, { force: true })
    }
    delete project.lock.items[name]
  }
  await writeJson(project.lockPath, project.lock, flags.dryRun)
}

async function doctor() {
  const root = findProjectRoot()
  const detected = detectProject(root)
  const checks: [string, boolean, string][] = [
    [
      "Node >=22",
      Number(process.versions.node.split(".")[0]) >= 22,
      process.versions.node,
    ],
    ["ui.json", existsSync(join(root, "ui.json")), join(root, "ui.json")],
    ["package.json", existsSync(join(root, "package.json")), detected.manager],
    ["framework", detected.framework !== "unknown", detected.framework],
  ]
  if (checks[1][1]) {
    try {
      const config = parseConfig(await readJson(join(root, "ui.json")))
      const lock = existsSync(join(root, "ui-lock.json"))
        ? parseLock(await readJson(join(root, "ui-lock.json")))
        : emptyLock()
      checks.push(["ui-lock.json", true, "valid"])
      const packageJson = (await readJson(join(root, "package.json"))) as {
        dependencies?: Record<string, string>
        devDependencies?: Record<string, string>
      }
      const packages = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      }
      checks.push([
        "StyleX runtime",
        Boolean(packages["@stylexjs/stylex"]),
        packages["@stylexjs/stylex"] ?? "missing",
      ])
      const compiler =
        detected.framework === "next-app" || detected.framework === "next-pages"
          ? "@stylexjs/babel-plugin"
          : "@stylexjs/unplugin"
      checks.push([
        "StyleX compiler",
        Boolean(packages[compiler]),
        packages[compiler] ?? "missing",
      ])
      const files = Object.values(lock.items).flatMap((item) =>
        Object.entries(item.files),
      )
      const invalidFiles = []
      for (const [relativePath, expected] of files) {
        const path = resolve(root, relativePath)
        if (!existsSync(path) || hash(await readFile(path)) !== expected) {
          invalidFiles.push(relativePath)
        }
      }
      checks.push([
        "installed files",
        invalidFiles.length === 0,
        invalidFiles.length
          ? `${invalidFiles.length} missing or modified`
          : `${files.length} valid`,
      ])
      const response = await fetch(endpoint(config.registry, "registry.json"))
      checks.push([
        "registry",
        response.ok,
        response.ok ? config.registry : `HTTP ${response.status}`,
      ])
    } catch (error) {
      checks.push([
        "configuration",
        false,
        error instanceof Error ? error.message : String(error),
      ])
    }
  }
  checks.forEach(([name, ok, detail]) =>
    console.info(`${ok ? "✓" : "✗"} ${name}: ${detail}`),
  )
  if (checks.some(([, ok]) => !ok)) process.exitCode = 1
}

function help() {
  console.info(`Usage: yopem-ui <command> [components] [flags]

Commands: init, add, list, search, diff, update, remove, doctor
Flags: --dry-run, --overwrite, --skip-install, --yes (-y)`)
}

async function main() {
  const { command, args, flags } = parseArgs(process.argv.slice(2))
  if (command === "init") await initialize(flags)
  else if (command === "add") await install(args, flags)
  else if (command === "list") await listInstalled()
  else if (command === "search") await searchRegistry(args.join(" "))
  else if (command === "diff") await diffInstalled(args)
  else if (command === "update") await updateInstalled(args, flags)
  else if (command === "remove") await removeInstalled(args, flags)
  else if (command === "doctor") await doctor()
  else if (!command || command === "help") help()
  else throw new Error(`Unknown command: ${command}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
