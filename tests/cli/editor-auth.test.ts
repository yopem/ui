import type { JsonValue } from "@cli/install"

import { designGuidance } from "@cli/guidance"
import { expect, test } from "bun:test"
import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"

const root = resolve(import.meta.dirname, "../..")

const results = join(root, "test-results/cli/editor-auth")

test("packed CLI exposes shared authentication roots to external workspace consumers", async () => {
  const directory = await mkdtemp(join(tmpdir(), "yopem-editor-auth-"))
  const logs: string[] = []
  await mkdir(results, { recursive: true })

  async function run(cwd: string, args: string[], success = true) {
    const child = Bun.spawn(args, {
      cwd,
      stdout: "pipe",
      stderr: "pipe",
      timeout: 120_000,
    })

    const [status, stdout, stderr] = await Promise.all([
      child.exited,
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
    ])

    logs.push(`${cwd}\n${args.join(" ")}\nexit: ${status}\n${stdout}${stderr}`)
    expect(status === 0, `${stdout}${stderr}`).toBe(success)

    return `${stdout}${stderr}`
  }

  async function put(base: string, path: string, value: string) {
    await mkdir(join(base, path, ".."), { recursive: true })
    await writeFile(join(base, path), value)
  }

  async function putJson(base: string, path: string, value: JsonValue) {
    await put(base, path, JSON.stringify(value, null, 2))
  }

  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    async fetch(request) {
      const name = new URL(request.url).pathname.match(
        /^\/r\/([a-z0-9-]+)\.json$/,
      )?.[1]

      if (!name) return new Response(null, { status: 404 })

      const file = Bun.file(
        join(root, "packages/registry/dist/r", `${name}.json`),
      )

      return (await file.exists())
        ? new Response(file)
        : new Response(null, { status: 404 })
    },
  })

  try {
    await run(join(root, "packages/cli"), [
      "bun",
      "pm",
      "pack",
      "--destination",
      directory,
    ])

    const archive = (await readdir(directory)).find((file) =>
      file.endsWith(".tgz"),
    )

    if (!archive) throw new Error("Missing CLI archive")

    for (const custom of [false, true]) {
      const workspace = join(directory, custom ? "custom" : "default")
      const ui = join(workspace, "packages/ui")
      const app = join(workspace, "apps/web")
      const components = custom ? "src/widgets" : "src/components"
      const lib = custom ? "src/services" : "src/lib"
      const authKey = `./${lib.slice(4)}/editor-auth`
      await putJson(workspace, "package.json", {
        private: true,
        workspaces: ["apps/*", "packages/*"],
        packageManager: "bun@1.3.10",
      })
      await putJson(ui, "package.json", {
        name: "@acme/ui",
        type: "module",
        sideEffects: ["./keep.css"],
        exports: { "./keep": "./keep.ts" },
        dependencies: { react: "^19.2.0", "react-dom": "^19.2.0" },
      })
      await mkdir(join(ui, "src"), { recursive: true })
      await putJson(ui, "ui.json", {
        version: 1,
        files: {},
        paths: {
          components,
          lib,
          ui: custom ? "src/controls" : "src/components/ui",
        },
      })
      await putJson(ui, "tsconfig.json", {})
      await putJson(app, "package.json", {
        name: "web",
        type: "module",
        dependencies: {
          react: "^19.2.0",
          "react-dom": "^19.2.0",
          vite: "^8.0.0",
          "@acme/ui": "workspace:*",
        },
      })
      await putJson(app, "tsconfig.json", {
        compilerOptions: {
          target: "ES2022",
          module: "ESNext",
          moduleResolution: "Bundler",
          jsx: "react-jsx",
          strict: true,
          noUncheckedSideEffectImports: true,
          skipLibCheck: true,
          noEmit: true,
          allowImportingTsExtensions: true,
        },
        include: ["src"],
      })
      await put(app, "vite.config.ts", "export default { plugins: [] }\n")
      await put(app, "src/main.tsx", 'import React from "react"\n')
      await put(app, "src/vite-env.d.ts", 'import "vite/client"\n')
      await run(workspace, [
        "bun",
        "add",
        "-d",
        join(directory, archive),
        "typescript",
        "@types/react",
        "@types/react-dom",
      ])
      const command = ["bunx", "--no-install", "yopem-ui"]
      await run(app, [
        ...command,
        "init",
        "--ui",
        "../../packages/ui",
        "--registry",
        `${server.url}r`,
      ])

      const inventory: { files: { target: string }[] } = await Bun.file(
        join(root, "packages/registry/dist/r/editor-auth.json"),
      ).json()

      const authFiles = inventory.files
        .map((file) => {
          expect(file.target.startsWith("@/lib/editor-auth/")).toBe(true)

          return file.target.slice("@/lib/editor-auth/".length)
        })
        .sort()

      expect(authFiles).not.toBeEmpty()

      const initialized: {
        exports: Record<string, string>
        sideEffects: string[]
      } = await Bun.file(join(ui, "package.json")).json()

      expect(initialized.exports[authKey]).toBe(`./${lib}/editor-auth/index.ts`)
      expect(initialized.sideEffects).toEqual(["./keep.css", "**/*.css"])

      delete initialized.exports[authKey]
      await putJson(ui, "package.json", initialized)
      const before = await readFile(join(ui, "package.json"), "utf8")
      const manifestBefore = await readFile(join(ui, "ui.json"), "utf8")
      await run(ui, [
        ...command,
        "add",
        "editor-auth",
        "--dry-run",
        "--registry",
        `${server.url}r`,
      ])
      expect(await readFile(join(ui, "package.json"), "utf8")).toBe(before)
      expect(await readFile(join(ui, "ui.json"), "utf8")).toBe(manifestBefore)
      expect(
        await Bun.file(join(ui, lib, "editor-auth/index.ts")).exists(),
      ).toBe(false)
      await run(ui, [
        ...command,
        "add",
        "editor-auth",
        "--registry",
        `${server.url}r`,
      ])
      expect((await readdir(join(ui, lib, "editor-auth"))).sort()).toEqual(
        authFiles,
      )

      const manifest: { files: Record<string, string> } = await Bun.file(
        join(ui, "ui.json"),
      ).json()

      expect(
        Object.keys(manifest.files).filter((file) =>
          file.startsWith(`${lib}/editor-auth/`),
        ).length,
      ).toBe(authFiles.length)
      await put(
        app,
        "src/check.tsx",
        `import { createOpenAuthAuthentication, createBetterAuthAuthentication, authorizeEditorRequest } from "@acme/ui/${lib.slice(4)}/editor-auth"\nexport const parts = [createOpenAuthAuthentication, createBetterAuthAuthentication, authorizeEditorRequest]\n`,
      )
      await run(app, ["bunx", "--no-install", "tsc", "--noEmit"])
      await run(ui, [join(root, "node_modules/.bin/oxlint"), "src"])

      const installed: typeof initialized = await Bun.file(
        join(ui, "package.json"),
      ).json()

      expect(installed.exports["./keep"]).toBe("./keep.ts")
      expect(installed.sideEffects).toEqual(initialized.sideEffects)
      delete installed.exports[authKey]
      await putJson(ui, "package.json", installed)
      await run(ui, [
        ...command,
        "update",
        "editor-auth",
        "--registry",
        `${server.url}r`,
      ])
      await run(app, ["bunx", "--no-install", "tsc", "--noEmit"])
      await run(ui, [join(root, "node_modules/.bin/oxlint"), "src"])

      const conflict: typeof initialized = await Bun.file(
        join(ui, "package.json"),
      ).json()

      await putJson(results, `${custom ? "custom" : "default"}.json`, conflict)
      conflict.exports[authKey] = "./private.ts"
      await putJson(ui, "package.json", conflict)
      const conflictBefore = await readFile(join(ui, "package.json"), "utf8")

      const sourceBefore = await readFile(
        join(ui, lib, "editor-auth/index.ts"),
        "utf8",
      )

      const trackingBefore = await readFile(join(ui, "ui.json"), "utf8")
      const lockBefore = await readFile(join(workspace, "bun.lock"), "utf8")

      for (const mode of ["add", "update"]) {
        await run(
          ui,
          [...command, mode, "editor-auth", "--registry", `${server.url}r`],
          false,
        )
        await run(
          ui,
          [
            ...command,
            mode,
            "editor-auth",
            "--dry-run",
            "--registry",
            `${server.url}r`,
          ],
          false,
        )
        expect(await readFile(join(ui, "package.json"), "utf8")).toBe(
          conflictBefore,
        )
        expect(
          await readFile(join(ui, lib, "editor-auth/index.ts"), "utf8"),
        ).toBe(sourceBefore)
        expect(await readFile(join(ui, "ui.json"), "utf8")).toBe(trackingBefore)
        expect(await readFile(join(workspace, "bun.lock"), "utf8")).toBe(
          lockBefore,
        )
      }
    }
  } finally {
    await writeFile(join(results, "shared-install.log"), logs.join("\n\n"))
    await server.stop(true)
    await rm(directory, { recursive: true, force: true })
  }
}, 600_000)

test("packed CLI installs authentication source from generated registry", async () => {
  const directory = await mkdtemp(join(tmpdir(), "yopem-editor-install-"))
  const logs: string[] = []
  await mkdir(results, { recursive: true })

  async function run(cwd: string, ...args: string[]) {
    const child = Bun.spawn(args, {
      cwd,
      stdout: "pipe",
      stderr: "pipe",
      timeout: 120_000,
    })

    const [status, stdout, stderr] = await Promise.all([
      child.exited,
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
    ])

    logs.push(`${cwd}\n${args.join(" ")}\nexit: ${status}\n${stdout}${stderr}`)
    expect(status, `${stdout}${stderr}`).toBe(0)

    return stdout
  }

  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    async fetch(request) {
      const name = new URL(request.url).pathname.match(
        /^\/r\/([a-z0-9-]+)\.json$/,
      )?.[1]

      if (!name) return new Response(null, { status: 404 })

      const file = Bun.file(
        join(root, "packages/registry/dist/r", `${name}.json`),
      )

      return (await file.exists())
        ? new Response(file)
        : new Response(null, { status: 404 })
    },
  })

  try {
    await run(
      join(root, "packages/cli"),
      "bun",
      "pm",
      "pack",
      "--destination",
      directory,
    )

    const archive = (await readdir(directory)).find((file) =>
      file.endsWith(".tgz"),
    )

    expect(archive).toBeDefined()

    if (!archive) throw new Error("Missing CLI archive")

    for (const layout of ["default", "custom"] as const) {
      const workspace = join(directory, layout)

      const project = workspace

      await mkdir(join(project, "src"), { recursive: true })

      await writeFile(
        join(project, "package.json"),
        JSON.stringify({
          name: `auth-${layout}`,
          type: "module",
          dependencies: { react: "^19.2.0", "react-dom": "^19.2.0" },
        }),
      )
      const components = layout === "default" ? "src/components" : "src/widgets"
      const ui = layout === "default" ? "src/components/ui" : "src/controls"
      const lib = layout === "default" ? "src/lib" : "src/services"
      const prefix = "@"
      await writeFile(
        join(project, "ui.json"),
        JSON.stringify({
          version: 1,
          files: {},
          sourceRoot: "src",
          importPrefix: prefix,
          paths: { components, ui, lib },
        }),
      )
      await run(
        project,
        "bun",
        "add",
        "-d",
        join(directory, archive),
        "typescript",
        "@types/react",
        "@types/react-dom",
      )
      await writeFile(
        join(project, "tsconfig.json"),
        JSON.stringify({
          compilerOptions: {
            target: "ES2022",
            module: "ESNext",
            moduleResolution: "Bundler",
            jsx: "react-jsx",
            strict: true,
            noUncheckedSideEffectImports: true,
            skipLibCheck: true,
            allowImportingTsExtensions: true,
            noEmit: true,
            paths: { [`${prefix}/*`]: ["./src/*"] },
          },
          include: ["src"],
        }),
      )
      await run(
        project,
        "bunx",
        "yopem-ui",
        "add",
        "editor-auth",
        "--registry",
        `${server.url}r`,
      )

      const authInventory: { files: { target: string }[] } = await Bun.file(
        join(root, "packages/registry/dist/r/editor-auth.json"),
      ).json()

      const authFiles = authInventory.files
        .map((file) => {
          expect(file.target.startsWith("@/lib/editor-auth/")).toBe(true)

          return file.target.slice("@/lib/editor-auth/".length)
        })
        .sort()

      expect(authFiles).not.toBeEmpty()
      expect((await readdir(join(project, lib, "editor-auth"))).sort()).toEqual(
        authFiles,
      )
      await writeFile(
        join(project, "src/check-auth.ts"),
        `import { createOpenAuthAuthentication, createBetterAuthAuthentication, authorizeEditorRequest } from "${prefix}/${lib.slice(4)}/editor-auth"\nexport const openauth = createOpenAuthAuthentication({ audience: "test-client" })\nexport const betterAuth = createBetterAuthAuthentication({ getSession: async () => null })\nexport const authorize = authorizeEditorRequest\n`,
      )
      await run(project, "bunx", "tsc", "--noEmit")
      await run(project, join(root, "node_modules/.bin/oxlint"), "src")
      await run(
        project,
        "bunx",
        "yopem-ui",
        "update",
        "editor-auth",
        "--registry",
        `${server.url}r`,
      )

      await run(project, "bunx", "--no-install", "tsc", "--noEmit")
      await run(project, join(root, "node_modules/.bin/oxlint"), "src")

      const manifest = JSON.parse(
        await readFile(join(project, "ui.json"), "utf8"),
      )

      expect(
        Object.keys(manifest.files).filter((file) =>
          file.startsWith(`${lib}/editor-auth/`),
        ).length,
      ).toBe(authFiles.length)
      const installed = await Bun.file(join(project, "package.json")).json()
      expect(installed.dependencies.jose).toBeDefined()
      expect(installed.dependencies.zod).toBeDefined()

      await mkdir(join(results, layout), { recursive: true })
      await writeFile(
        join(results, layout, "ui.json"),
        JSON.stringify(manifest, null, 2),
      )
    }
  } finally {
    await writeFile(join(results, "install.log"), logs.join("\n\n"))
    await server.stop(true)
    await rm(directory, { recursive: true, force: true })
  }
}, 360_000)

test("authentication guidance preserves user instructions and configured library imports", () => {
  const content = designGuidance("User instructions\n")
  expect(content).toContain("@/lib/editor-auth")
  expect(content).toContain("add editor-auth")
  expect(content.startsWith("User instructions\n")).toBe(true)
  expect(designGuidance(content)).toBe(content)

  const custom = designGuidance("", "@acme/ui/", {
    components: "@acme/ui/controls",
    editor: "@acme/ui/widgets/editor",
    tokens: "@acme/ui/styles/tokens.stylex",
    lib: "@acme/ui/services/stylex",
    css: "@acme/ui/styles/styles.css",
  })

  expect(custom).toContain("@acme/ui/services/editor-auth")
})
