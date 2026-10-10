import { afterAll, beforeAll, expect, test } from "bun:test"
import { spawnSync } from "node:child_process"
import {
  appendFileSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"

import { snapshot } from "./files"

const root = resolve(import.meta.dirname, "../../..")

const results = resolve(import.meta.dirname, "../test-results")

const registry = ["--registry", "http://localhost:3100/r"]

let registryServer: Bun.Server<undefined> | undefined

beforeAll(async () => {
  const active = await fetch("http://localhost:3100/r/base.json").then(
    (response) => response.ok,
    () => false,
  )

  if (active) return

  registryServer = Bun.serve({
    hostname: "localhost",
    port: 3100,
    async fetch(request) {
      const name = new URL(request.url).pathname.match(
        /^\/r\/([a-z0-9-]+)\.json$/,
      )?.[1]

      if (!name) return new Response("Not found", { status: 404 })

      const file = Bun.file(
        join(root, "packages/registry/dist/r", `${name}.json`),
      )

      return (await file.exists())
        ? new Response(file)
        : new Response("Not found", { status: 404 })
    },
  })
})

afterAll(async () => {
  await registryServer?.stop(true)
})

async function run(logs: string[], cwd: string, ...args: string[]) {
  const child = Bun.spawn(args, {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
    timeout: 120_000,
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
  })

  const [status, stdout, stderr] = await Promise.all([
    child.exited,
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
  ])

  const output = `${stdout}${stderr}`
  logs.push(`${cwd}\n${args.join(" ")}\nexit: ${status}\n${output}`)
  expect(status, output).toBe(0)

  return output
}

async function installPackedCli(
  logs: string[],
  directory: string,
  project: string,
) {
  for (const name of ["cli", "oxlint-plugin"]) {
    await run(
      logs,
      join(root, "packages", name),
      "bun",
      "pm",
      "pack",
      "--destination",
      directory,
    )
  }

  const archives = readdirSync(directory)
    .filter((name) => name.endsWith(".tgz"))
    .map((name) => join(directory, name))

  let version: string | undefined

  for (const archive of archives) {
    const manifest = spawnSync(
      "tar",
      ["-xOf", archive, "package/package.json"],
      { encoding: "utf8" },
    )

    expect(manifest.status, `${archive}: ${manifest.stderr}`).toBe(0)
    expect(manifest.stdout).not.toContain("catalog:")

    const metadata: { name: string; version: string } = JSON.parse(
      manifest.stdout,
    )

    if (metadata.name === "@yopem-ui/cli") version = metadata.version
  }

  expect(version).toBeString()

  if (version === undefined) throw new Error("Missing packed CLI version")
  await run(logs, project, "bun", "add", "-d", ...archives)
  const before = snapshot(project)
  const help = await run(logs, project, "bunx", "yopem-ui", "--help")
  expect(help).toContain("Usage:")
  expect(help).toContain("--dry-run")

  const installedVersion = await run(
    logs,
    project,
    "bunx",
    "yopem-ui",
    "--version",
  )

  expect(installedVersion.trim()).toBe(version)
  expect(snapshot(project)).toEqual(before)

  const dryInit = await run(
    logs,
    project,
    "bunx",
    "yopem-ui",
    "init",
    "--dry-run",
    ...registry,
  )

  expect(dryInit).toContain("No files written or package-manager commands run")
  expect(dryInit).toContain(join(project, "package.json"))
  expect(dryInit).toContain(join(project, "ui.json"))
  expect(dryInit).toContain("@stylex;")
  expect(snapshot(project)).toEqual(before)

  logs.push(
    `Packed help/version/init dry-run verified; version matches packed manifest: ${version}; project unchanged`,
  )
}

async function previewPackedCli(
  logs: string[],
  project: string,
  args: string[],
  snapshotRoot = project,
) {
  const before = snapshot(snapshotRoot)

  const output = await run(
    logs,
    project,
    "bunx",
    "yopem-ui",
    ...args,
    "--dry-run",
  )

  expect(output).toContain("src/components/ui/button.tsx")
  expect(output).toContain("No files written")
  expect(output).not.toContain("Installed ")
  expect(output).toContain("Runtime dependencies:")
  expect(output).toContain("Dev dependencies:")
  expect(snapshot(snapshotRoot)).toEqual(before)
  logs.push(
    "Dry-run preview verified: all files/directories unchanged, no package or config changes",
  )
}

async function verifyNoOpPackedCli(
  logs: string[],
  project: string,
  flags: string[] = [],
  snapshotRoot = project,
) {
  const before = snapshot(snapshotRoot)

  for (const command of ["add", "update"]) {
    const output = await run(
      logs,
      project,
      "bunx",
      "yopem-ui",
      command,
      "button",
      ...registry,
      ...flags,
    )

    expect(output).toContain("Installed 0 file(s)")
    expect(output).not.toContain("bun add")
    expect(snapshot(snapshotRoot)).toEqual(before)
  }

  logs.push(
    "Repeated packed add/update: no package-manager output; project, lockfile and node_modules unchanged",
  )
}

function saveLogs(name: string, logs: string[]) {
  mkdirSync(results, { recursive: true })
  writeFileSync(join(results, `${name}.log`), logs.join("\n\n"))
}

function verifyBuild(
  project: string,
  framework: "vite" | "next",
  name: string,
  logs: string[],
) {
  const output = join(project, framework === "vite" ? "dist" : ".next/static")

  const htmlPath =
    framework === "vite" ? "dist/index.html" : ".next/server/app/index.html"

  const html = readFileSync(join(project, htmlPath), "utf8")

  if (framework === "vite") {
    expect(html).toContain('type="module"')
    expect(html).toContain(".css")
  } else {
    const buildId = readFileSync(join(project, ".next/BUILD_ID"), "utf8").trim()
    expect(buildId.length).toBeGreaterThan(0)
    expect(html).toContain('data-slot="button"')
    expect(html).toContain("Build smoke")
    logs.push(`.next/BUILD_ID: ${buildId}`)
  }

  const cssFiles = [...new Bun.Glob("**/*.css").scanSync({ cwd: output })]
  const jsFiles = [...new Bun.Glob("**/*.js").scanSync({ cwd: output })]
  expect(cssFiles.length).toBeGreaterThan(0)
  expect(jsFiles.length).toBeGreaterThan(0)

  const css = cssFiles
    .map((path) => readFileSync(join(output, path), "utf8"))
    .join("\n")

  const js = jsFiles
    .map((path) => readFileSync(join(output, path), "utf8"))
    .join("\n")

  expect(js).toMatch(/["'`]data-slot["'`]\s*:\s*["'`]button["'`]/)

  if (framework === "vite") expect(js).toContain("Build smoke")
  expect(css).toContain("@layer")
  expect(css).toMatch(/--primary\s*:/)
  expect(css).toMatch(/\.[^{]+\{[^}]*background-color:\s*var\(--primary\)/)
  expect(css).toContain(":focus-visible")
  expect(css).not.toContain("@stylex")
  mkdirSync(results, { recursive: true })
  writeFileSync(join(results, `${name}.css`), css)
  writeFileSync(join(results, `${name}.html`), html)
  logs.push(
    `Verified ${htmlPath}, CSS: ${cssFiles.join(", ")}, JS: ${jsFiles.join(", ")}\nStyleX CSS: ${css.length} bytes`,
  )
}

test("packed CLI installs from local registry, builds Vite and runs published lint plugin", async () => {
  const response = await fetch("http://localhost:3100/r/base.json")
  expect(response.ok).toBe(true)
  const directory = mkdtempSync(join(tmpdir(), "yopem-public-cli-"))
  const project = join(directory, "project")
  const logs: string[] = []

  try {
    mkdirSync(join(project, "src"), { recursive: true })
    writeFileSync(
      join(project, "package.json"),
      JSON.stringify({
        name: "yopem-public-cli-test",
        private: true,
        type: "module",
        dependencies: {
          vite: "^8.3.1",
          react: "^19.3.0",
          "react-dom": "^19.3.0",
        },
        scripts: { lint: "oxlint lint src", build: "vite build" },
      }),
    )
    writeFileSync(
      join(project, "tsconfig.json"),
      JSON.stringify({ compilerOptions: { strict: true, jsx: "react-jsx" } }),
    )
    writeFileSync(
      join(project, "vite.config.ts"),
      'export default { plugins: [], resolve: { alias: { "@": "./src" } } }',
    )
    writeFileSync(
      join(project, "index.html"),
      '<!doctype html><html lang="en"><head><title>Build smoke</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>',
    )
    writeFileSync(
      join(project, "src/main.tsx"),
      'import React from "react"\nimport { createRoot } from "react-dom/client"\nimport { Button } from "@/components/ui/button"\ncreateRoot(document.getElementById("root")!).render(<Button>Build smoke</Button>)',
    )
    await installPackedCli(logs, directory, project)
    await previewPackedCli(logs, project, ["add", "button", ...registry])
    await run(
      logs,
      project,
      "bunx",
      "yopem-ui",
      "init",
      "--framework",
      "vite",
      ...registry,
    )
    await previewPackedCli(logs, project, ["add", "button", ...registry])
    await run(logs, project, "bunx", "yopem-ui", "add", "button", ...registry)
    await verifyNoOpPackedCli(logs, project)
    await run(logs, project, "bun", "run", "build")
    verifyBuild(project, "vite", "packaged-cli", logs)
    const tokens = join(project, "src/styles/tokens.stylex.ts")
    appendFileSync(tokens, "\n")
    const edited = readFileSync(tokens, "utf8")
    await run(logs, project, "bunx", "yopem-ui", "add", "box", ...registry)
    await run(
      logs,
      project,
      "bunx",
      "yopem-ui",
      "add",
      "container",
      ...registry,
    )

    for (const name of [
      "highlight",
      "rating",
      "native-select",
      "clipboard",
      "link",
      "wrap",
      "text",
    ]) {
      await run(logs, project, "bunx", "yopem-ui", "add", name, ...registry)
      expect(
        readFileSync(join(project, `src/components/ui/${name}.tsx`), "utf8"),
      ).toContain("data-slot")
    }

    expect(
      readFileSync(join(project, "src/components/ui/container.tsx"), "utf8"),
    ).toContain("export function Container")
    await run(
      logs,
      project,
      "bunx",
      "yopem-ui",
      "init",
      "--framework",
      "vite",
      ...registry,
    )
    expect(readFileSync(tokens, "utf8")).toBe(edited)
    await run(logs, project, "bun", "run", "lint")
    writeFileSync(
      join(project, "src/invalid.tsx"),
      'import { Box } from "@/components/ui/box"\nexport const Invalid = <Box style={{ padding: 4 }} />',
    )

    const invalid = spawnSync("bun", ["run", "lint"], {
      cwd: project,
      encoding: "utf8",
    })

    logs.push(`invalid lint\n${invalid.stdout}${invalid.stderr}`)
    expect(invalid.status).toBe(1)
    expect(`${invalid.stdout}${invalid.stderr}`).toContain(
      "yopem-ui(enforce-styling-methods)",
    )
    writeFileSync(
      join(project, "src/invalid.tsx"),
      'import { Text } from "@/components/ui/text"\nimport { tokens } from "@/styles/tokens.stylex"\nimport * as stylex from "@stylexjs/stylex"\nconst styles = stylex.create({ root: { color: tokens["--foreground"] } })\nexport const Invalid = <Text xstyle={styles.root}>Text</Text>',
    )

    const invalidText = spawnSync("bun", ["run", "lint"], {
      cwd: project,
      encoding: "utf8",
    })

    logs.push(`invalid Text lint\n${invalidText.stdout}${invalidText.stderr}`)
    expect(invalidText.status).toBe(1)
    expect(`${invalidText.stdout}${invalidText.stderr}`).toContain(
      "color cannot restyle Text",
    )
  } finally {
    saveLogs("packaged-cli", logs)
    rmSync(directory, { recursive: true, force: true })
  }
}, 180_000)

for (const { framework, shared } of [
  { framework: "next", shared: false },
  { framework: "vite", shared: true },
  { framework: "next", shared: true },
] as const) {
  test(`packed CLI builds ${framework}${shared ? " with shared UI" : ""}`, async () => {
    const directory = mkdtempSync(join(tmpdir(), "yopem-public-build-"))
    const project = join(directory, "project")
    const app = shared ? join(project, "apps/web") : project
    const logs: string[] = []
    const name = `packaged-${framework}${shared ? "-shared" : ""}`

    function put(path: string, content: string) {
      mkdirSync(join(project, path, ".."), { recursive: true })
      writeFileSync(join(project, path), content)
    }

    try {
      if (shared) {
        put(
          "package.json",
          JSON.stringify({
            private: true,
            type: "module",
            workspaces: ["apps/*", "packages/*"],
          }),
        )
        put(
          "packages/ui/package.json",
          JSON.stringify({
            name: "@acme/ui",
            private: true,
            type: "module",
            sideEffects: false,
            peerDependencies: { react: "^19.3.0", "react-dom": "^19.3.0" },
          }),
        )
        put(
          "packages/ui/tsconfig.json",
          JSON.stringify({
            compilerOptions: { strict: true, jsx: "react-jsx" },
          }),
        )
      }

      const prefix = shared ? "apps/web/" : ""
      put(
        `${prefix}package.json`,
        JSON.stringify({
          name: "web",
          private: true,
          type: "module",
          dependencies: {
            [framework === "next" ? "next" : "vite"]:
              framework === "next" ? "16.3.8" : "^8.3.1",
            react: "^19.3.0",
            "react-dom": "^19.3.0",
          },
          devDependencies: {
            typescript: "npm:@typescript/typescript6@^6.0.2",
            "@types/react": "^19.3.0",
            "@types/react-dom": "^19.3.0",
            "@types/node": "^26.6.3",
          },
          scripts:
            framework === "next"
              ? {
                  dev: "next dev",
                  build: "next build",
                  lint: "oxlint lint src",
                }
              : { build: "vite build", lint: "oxlint lint src" },
        }),
      )
      put(
        `${prefix}tsconfig.json`,
        JSON.stringify({ compilerOptions: { strict: true, jsx: "react-jsx" } }),
      )
      const button = shared ? "@acme/ui" : "@"

      if (framework === "next") {
        put(`${prefix}next.config.mjs`, "export default {}")
        put(
          `${prefix}src/app/layout.tsx`,
          'import type { ReactNode } from "react"\nexport default function Layout({ children }: { children: ReactNode }) { return <html lang="en"><body>{children}</body></html> }',
        )
        put(
          `${prefix}src/app/page.tsx`,
          `import { Button } from "${button}/components/ui/button"\nexport default function Page() { return <Button>Build smoke</Button> }`,
        )
      } else {
        put(`${prefix}vite.config.ts`, "export default { plugins: [] }")
        put(
          `${prefix}index.html`,
          '<!doctype html><html lang="en"><head><title>Build smoke</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>',
        )
        put(
          `${prefix}src/main.tsx`,
          `import React from "react"\nimport { createRoot } from "react-dom/client"\nimport { Button } from "${button}/components/ui/button"\ncreateRoot(document.getElementById("root")!).render(<Button>Build smoke</Button>)`,
        )
      }

      await installPackedCli(logs, directory, app)
      await run(
        logs,
        app,
        "bunx",
        "yopem-ui",
        "init",
        "--framework",
        framework,
        ...registry,
        ...(shared ? ["--ui", "../../packages/ui"] : []),
      )
      await previewPackedCli(
        logs,
        app,
        [
          "add",
          "button",
          ...registry,
          ...(shared ? ["--cwd", "../../packages/ui"] : []),
        ],
        project,
      )
      await run(
        logs,
        app,
        "bunx",
        "yopem-ui",
        "add",
        "button",
        ...registry,
        ...(shared ? ["--cwd", "../../packages/ui"] : []),
      )
      await verifyNoOpPackedCli(
        logs,
        app,
        shared ? ["--cwd", "../../packages/ui"] : [],
        project,
      )
      await run(logs, app, "bun", "run", "lint")
      await run(logs, app, "bun", "run", "build")
      verifyBuild(app, framework, name, logs)
    } finally {
      saveLogs(name, logs)
      rmSync(directory, { recursive: true, force: true })
    }
  }, 180_000)
}
