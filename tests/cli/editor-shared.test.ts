import type { JsonValue } from "@cli/install"

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

const results = join(root, "test-results/cli/editor-shared")

test("packed CLI exposes shared editor roots to external workspace consumers", async () => {
  const directory = await mkdtemp(join(tmpdir(), "yopem-editor-shared-"))
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
      const editorKey = `./${components.slice(4)}/editor`
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

      const initialized: {
        exports: Record<string, string>
        sideEffects: string[]
      } = await Bun.file(join(ui, "package.json")).json()

      expect(initialized.exports[editorKey]).toBe(
        `./${components}/editor/index.ts`,
      )
      expect(initialized.exports[authKey]).toBe(`./${lib}/editor-auth/index.ts`)
      expect(initialized.sideEffects).toEqual(["./keep.css", "**/*.css"])

      delete initialized.exports[editorKey]
      delete initialized.exports[authKey]
      await putJson(ui, "package.json", initialized)
      const before = await readFile(join(ui, "package.json"), "utf8")
      const manifestBefore = await readFile(join(ui, "ui.json"), "utf8")
      await run(ui, [
        ...command,
        "add",
        "editor",
        "--dry-run",
        "--registry",
        `${server.url}r`,
      ])
      expect(await readFile(join(ui, "package.json"), "utf8")).toBe(before)
      expect(await readFile(join(ui, "ui.json"), "utf8")).toBe(manifestBefore)
      expect(
        await Bun.file(join(ui, components, "editor/index.ts")).exists(),
      ).toBe(false)
      await run(ui, [
        ...command,
        "add",
        "editor",
        "--registry",
        `${server.url}r`,
      ])
      await run(ui, [
        ...command,
        "add",
        "editor-auth",
        "--registry",
        `${server.url}r`,
      ])
      await put(
        app,
        "src/check.tsx",
        `import { Editor, EditorRoot, EditorContent, EditorFormatButton } from "@acme/ui/${components.slice(4)}/editor"\nimport { createOpenAuthAuthentication, createBetterAuthAuthentication, authorizeEditorRequest } from "@acme/ui/${lib.slice(4)}/editor-auth"\nexport const parts = [Editor, EditorRoot, EditorContent, EditorFormatButton, createOpenAuthAuthentication, createBetterAuthAuthentication, authorizeEditorRequest]\n`,
      )
      await run(app, ["bunx", "--no-install", "tsc", "--noEmit"])

      const installed: typeof initialized = await Bun.file(
        join(ui, "package.json"),
      ).json()

      expect(installed.exports["./keep"]).toBe("./keep.ts")
      expect(installed.sideEffects).toEqual(initialized.sideEffects)
      delete installed.exports[editorKey]
      delete installed.exports[authKey]
      await putJson(ui, "package.json", installed)
      await run(ui, [
        ...command,
        "update",
        "editor",
        "--registry",
        `${server.url}r`,
      ])
      await run(ui, [
        ...command,
        "update",
        "editor-auth",
        "--registry",
        `${server.url}r`,
      ])
      await run(app, ["bunx", "--no-install", "tsc", "--noEmit"])

      const conflict: typeof initialized = await Bun.file(
        join(ui, "package.json"),
      ).json()

      await putJson(results, `${custom ? "custom" : "default"}.json`, conflict)
      conflict.exports[editorKey] = "./private.ts"
      await putJson(ui, "package.json", conflict)
      const conflictBefore = await readFile(join(ui, "package.json"), "utf8")

      const sourceBefore = await readFile(
        join(ui, components, "editor/index.ts"),
        "utf8",
      )

      const trackingBefore = await readFile(join(ui, "ui.json"), "utf8")
      const lockBefore = await readFile(join(workspace, "bun.lock"), "utf8")

      for (const mode of ["add", "update"]) {
        await run(
          ui,
          [...command, mode, "editor", "--registry", `${server.url}r`],
          false,
        )
        await run(
          ui,
          [
            ...command,
            mode,
            "editor",
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
          await readFile(join(ui, components, "editor/index.ts"), "utf8"),
        ).toBe(sourceBefore)
        expect(await readFile(join(ui, "ui.json"), "utf8")).toBe(trackingBefore)
        expect(await readFile(join(workspace, "bun.lock"), "utf8")).toBe(
          lockBefore,
        )
      }
    }
  } finally {
    await writeFile(join(results, "install.log"), logs.join("\n\n"))
    await server.stop(true)
    await rm(directory, { recursive: true, force: true })
  }
}, 600_000)
