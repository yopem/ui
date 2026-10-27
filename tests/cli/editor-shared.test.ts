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
      const codeKey = `${editorKey}/code`
      const codeTarget = `./${components}/editor/code.ts`
      const authKey = `./${lib.slice(4)}/editor-auth`
      const helperKey = `${editorKey}/table-presentation-schema`
      const helperTarget = `./${components}/editor/table-presentation-schema.ts`
      await putJson(workspace, "package.json", {
        private: true,
        workspaces: ["apps/*", "packages/*"],
        packageManager: "bun@1.3.10",
      })
      await putJson(ui, "package.json", {
        name: "@acme/ui",
        type: "module",
        sideEffects: ["./keep.css"],
        exports: custom
          ? {
              "./keep": "./keep.ts",
              [`./${components.slice(4)}/*`]: {
                types: `./${components}/*.tsx`,
                default: `./${components}/*.tsx`,
              },
            }
          : { "./keep": "./keep.ts" },
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
        exports: Record<string, JsonValue>
        sideEffects: string[]
        dependencies: Record<string, string>
      } = await Bun.file(join(ui, "package.json")).json()

      expect(initialized.exports[editorKey]).toBe(
        `./${components}/editor/index.ts`,
      )
      expect(initialized.exports[authKey]).toBe(`./${lib}/editor-auth/index.ts`)
      expect(initialized.sideEffects).toEqual(["./keep.css", "**/*.css"])

      const componentWildcard = `./${components.slice(4)}/*`
      const wildcardBefore = initialized.exports[componentWildcard]
      const helperWildcard = `${editorKey}/*`
      const helperConditions = { types: helperTarget, default: helperTarget }
      initialized.exports["./keep-conditions"] = { default: "./keep.ts" }

      if (custom)
        initialized.exports[helperWildcard] = {
          types: `./${components}/editor/*.ts`,
          default: `./${components}/editor/*.ts`,
        }
      delete initialized.exports[editorKey]
      delete initialized.exports[authKey]
      await putJson(ui, "package.json", initialized)
      const before = await readFile(join(ui, "package.json"), "utf8")
      const manifestBefore = await readFile(join(ui, "ui.json"), "utf8")
      await run(ui, [
        ...command,
        "add",
        "editor-code",
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
        "editor-code",
        "--registry",
        `${server.url}r`,
      ])

      const helperInstalled: typeof initialized = await Bun.file(
        join(ui, "package.json"),
      ).json()

      expect(helperInstalled.dependencies.prettier).toBeUndefined()
      expect(
        await Bun.file(join(ui, components, "editor/code-format.ts")).exists(),
      ).toBe(false)

      const beforeFormat = await readFile(join(ui, "package.json"), "utf8")

      await run(ui, [
        ...command,
        "add",
        "editor-code-format",
        "--dry-run",
        "--registry",
        `${server.url}r`,
      ])
      expect(await readFile(join(ui, "package.json"), "utf8")).toBe(
        beforeFormat,
      )
      expect(
        await Bun.file(join(ui, components, "editor/code-format.ts")).exists(),
      ).toBe(false)
      await run(ui, [
        ...command,
        "add",
        "editor-code-format",
        "--registry",
        `${server.url}r`,
      ])

      const withFormat: typeof initialized = await Bun.file(
        join(ui, "package.json"),
      ).json()

      expect(withFormat.dependencies.prettier).toMatch(/^\^/)
      expect(
        await Bun.file(join(ui, components, "editor/code-format.ts")).exists(),
      ).toBe(true)
      expect(helperInstalled.exports[componentWildcard]).toEqual(wildcardBefore)
      expect(helperInstalled.exports["./keep-conditions"]).toEqual({
        default: "./keep.ts",
      })

      if (custom) {
        expect(helperInstalled.exports[codeKey]).toBeUndefined()
        expect(helperInstalled.exports[helperKey]).toBeUndefined()
        expect(helperInstalled.exports[helperWildcard]).toEqual(
          initialized.exports[helperWildcard],
        )
      } else {
        expect(helperInstalled.exports[helperKey]).toBe(helperTarget)
        expect(helperInstalled.exports[codeKey]).toBe(codeTarget)
      }

      await run(ui, [
        ...command,
        "add",
        "editor-auth",
        "--registry",
        `${server.url}r`,
      ])
      await run(ui, [
        ...command,
        "add",
        "editor-blocks",
        "--registry",
        `${server.url}r`,
      ])

      await run(ui, [
        ...command,
        "add",
        "editor-document",
        "--registry",
        `${server.url}r`,
      ])
      expect(
        await Bun.file(
          join(ui, components, "editor/document/insertion.ts"),
        ).exists(),
      ).toBe(true)
      expect(() => Bun.resolveSync("@lexical/headless", ui)).toThrow()

      await run(ui, [
        ...command,
        "add",
        "editor-drawing",
        "--registry",
        `${server.url}r`,
      ])
      expect(
        await Bun.file(join(ui, components, "editor/drawing-sdk.ts")).exists(),
      ).toBe(true)
      await put(
        app,
        "src/drawing-boundary.ts",
        `import { normalizeEditorDrawingSdkElements } from "@acme/ui/${components.slice(4)}/editor/drawing-sdk"\nimport { parseEditorDrawingScene } from "@acme/ui/${components.slice(4)}/editor/drawing-model"\nconst elements = normalizeEditorDrawingSdkElements([])\nif (parseEditorDrawingScene({ elements }).elements.length !== 0) throw new Error("Invalid empty native drawing scene")\nif (Reflect.has(globalThis, "document")) throw new Error("Drawing boundary requires no DOM")\n`,
      )
      await put(
        app,
        "src/drawing-components.tsx",
        `import { EditorDrawingExtension } from "@acme/ui/${components.slice(4)}/editor/drawing"\nimport { EditorDrawingInsertButton, registerEditorDrawingRuntime } from "@acme/ui/${components.slice(4)}/editor/drawing-browser"\nexport const drawingParts = [EditorDrawingExtension, EditorDrawingInsertButton, registerEditorDrawingRuntime]\n`,
      )

      await run(ui, [
        ...command,
        "add",
        "editor-ai-menu",
        "--registry",
        `${server.url}r`,
      ])

      await run(ui, [
        ...command,
        "add",
        "editor-collaboration-native",
        "--registry",
        `${server.url}r`,
      ])

      await put(
        app,
        "src/native-collaboration.ts",
        `import { createEditorNativeCollaboration, type EditorNativeCollaborationOptions } from "@acme/ui/${components.slice(4)}/editor/collaboration-native"\nimport { editorNativeRoomGrantSchema, validateEditorNativeRoomGrant } from "@acme/ui/${components.slice(4)}/editor/collaboration-native-model"\nexport function createNativeController(options: EditorNativeCollaborationOptions, createController: typeof import("@acme/ui/${components.slice(4)}/editor/collaboration").createEditorCollaborationWithProvider) {\n  return createController(createEditorNativeCollaboration(options), options.roomId)\n}\nconst now = Date.now()\nconst grant = editorNativeRoomGrantSchema.parse({ roomId: "workspace:fixture", generation: "a".repeat(64), seeded: true, permission: "read", credentialExpiresAt: now + 60000, hocuspocusToken: "fixture-token", displayName: "Reader", cursorColor: "#3466aa", peer: null })\nif (validateEditorNativeRoomGrant(grant, "workspace:fixture", now).permission !== "read" || typeof createEditorNativeCollaboration !== "function") throw new Error("Invalid native collaboration entry")\n`,
      )

      const blockExports: typeof initialized = await Bun.file(
        join(ui, "package.json"),
      ).json()

      expect(blockExports.exports[`${editorKey}/document`]).toBe(
        `./${components}/editor/document/index.ts`,
      )

      if (custom)
        expect(blockExports.exports[`${editorKey}/document/static`]).toBe(
          `./${components}/editor/document/static.tsx`,
        )
      else
        expect(
          blockExports.exports[`${editorKey}/document/static`],
        ).toBeUndefined()

      const blocksKey = `${editorKey}/blocks`
      const blockControlsKey = `${editorKey}/blocks-controls`

      if (custom) {
        expect(blockExports.exports[blocksKey]).toBeUndefined()
        expect(blockExports.exports[blockControlsKey]).toBe(
          `./${components}/editor/blocks-controls.tsx`,
        )
      } else {
        expect(blockExports.exports[blocksKey]).toBe(
          `./${components}/editor/blocks.ts`,
        )
        expect(blockExports.exports[blockControlsKey]).toBeUndefined()
      }

      await put(
        app,
        "src/check.tsx",
        `import { DocumentStatic } from "@acme/ui/${components.slice(4)}/editor/document/static"\nimport { parseDocument } from "@acme/ui/${components.slice(4)}/editor/document"\nexport const portableDocument = parseDocument("<p>Document</p>", "html")\nexport const staticDocument = DocumentStatic\nimport { Editor, EditorRoot, EditorContent, EditorFormatButton } from "@acme/ui/${components.slice(4)}/editor"\nimport { EditorCodeExtension, EditorCodeToolbar, EditorCodeLanguage, EditorCodeCopyButton, EditorCodeToggle, EditorCodeStatus } from "@acme/ui/${components.slice(4)}/editor/code"\nimport { EditorBlocksExtension, EditorBlocksControls, EditorBlockTypeButton } from "@acme/ui/${components.slice(4)}/editor/blocks"\nimport { EditorCalloutIconControl } from "@acme/ui/${components.slice(4)}/editor/blocks-controls"\nimport { createOpenAuthAuthentication, createBetterAuthAuthentication, authorizeEditorRequest } from "@acme/ui/${lib.slice(4)}/editor-auth"\nimport { EditorAiMenuRoot, EditorAiMenuTrigger, EditorAiMenuContent, EditorAiMenuPanel } from "@acme/ui/${components.slice(4)}/editor/ai-menu"\nimport { EditorAiInlinePreview } from "@acme/ui/${components.slice(4)}/editor/ai-menu-preview"\nexport const parts = [EditorAiInlinePreview, EditorAiMenuRoot, EditorAiMenuTrigger, EditorAiMenuContent, EditorAiMenuPanel, Editor, EditorRoot, EditorContent, EditorFormatButton, EditorCodeExtension, EditorCodeToolbar, EditorCodeLanguage, EditorCodeCopyButton, EditorCodeToggle, EditorCodeStatus, EditorBlocksExtension, EditorBlocksControls, EditorBlockTypeButton, EditorCalloutIconControl, createOpenAuthAuthentication, createBetterAuthAuthentication, authorizeEditorRequest]\n`,
      )
      await put(
        app,
        "src/geometry.ts",
        `import { prettierEditorCodeFormatter, formatEditorCode } from "@acme/ui/${components.slice(4)}/editor/code-format"\nconst formattedCode = await formatEditorCode('{"value":1}', "json")\nif (!formattedCode.includes('"value": 1') || !prettierEditorCodeFormatter.supports("javascript") || prettierEditorCodeFormatter.supports("python")) throw new Error("Invalid optional formatter")\nimport { parseDocument } from "@acme/ui/${components.slice(4)}/editor/document"\nconst document = parseDocument('<details data-editor-toggle=""><summary>Summary</summary><div data-editor-toggle-body=""><p>Body</p></div></details>', "html")\nif (document.root.children[0]?.type !== "editor-toggle") throw new Error("Missing native toggle")\nimport { validateTableGeometry } from "@acme/ui/${components.slice(4)}/editor/table-presentation-schema"\nimport { CalloutNode, ToggleNode, validateEditorBlocksJSON } from "@acme/ui/${components.slice(4)}/editor/blocks-model"\nif (Reflect.has(globalThis, "document") || CalloutNode.getType() !== "editor-callout" || ToggleNode.getType() !== "editor-toggle") throw new Error("Invalid headless block model")\nvalidateEditorBlocksJSON({ root: { type: "root", children: [] } })\nimport { parseMedia } from "@acme/ui/${components.slice(4)}/editor/media/schema"\nimport { serializeMediaHtml } from "@acme/ui/${components.slice(4)}/editor/media/html"\nconst mediaDocument = parseDocument(serializeMediaHtml(parseMedia({ kind: "file", url: "https://example.com/file.pdf", name: "File.pdf" })), "html")\nif (mediaDocument.root.children[0]?.type !== "yopem-media") throw new Error("Missing native media")\nconst geometry = validateTableGeometry([[{ colSpan: 2 }], [{}, {}]])\nif (geometry.columns !== 2 || geometry.rows !== 2 || geometry.cells !== 4) throw new Error("Invalid geometry")\nlet rejected = false\ntry { validateTableGeometry([[{ colSpan: 51 }]]) } catch { rejected = true }\nif (!rejected) throw new Error("Missing geometry bound")\n`,
      )
      await run(app, ["bunx", "--no-install", "tsc", "--noEmit"])
      await run(app, ["bun", "src/geometry.ts"])

      const external = join(
        directory,
        custom ? "external-custom" : "external-default",
      )

      await putJson(external, "package.json", {
        name: "external-app",
        type: "module",
        dependencies: {
          "@acme/ui": `file:${ui}`,
          react: "^19.3.0",
          "react-dom": "^19.3.0",
        },
        devDependencies: {
          "@types/react": "^19.3.0",
          "@types/react-dom": "^19.3.0",
        },
      })
      await putJson(external, "tsconfig.json", {
        compilerOptions: {
          target: "ES2022",
          module: "ESNext",
          moduleResolution: "Bundler",
          jsx: "react-jsx",
          strict: true,
          skipLibCheck: true,
          noEmit: true,
        },
        include: [
          "geometry.ts",
          "check.ts",
          "native-collaboration.ts",
          "drawing-boundary.ts",
          "drawing-components.tsx",
        ],
      })
      await put(
        external,
        "geometry.ts",
        await readFile(join(app, "src/geometry.ts"), "utf8"),
      )
      await put(
        external,
        "check.ts",
        await readFile(join(app, "src/check.tsx"), "utf8"),
      )
      await put(
        external,
        "native-collaboration.ts",
        await readFile(join(app, "src/native-collaboration.ts"), "utf8"),
      )

      for (const file of ["drawing-boundary.ts", "drawing-components.tsx"])
        await put(
          external,
          file,
          await readFile(join(app, "src", file), "utf8"),
        )

      await run(external, ["bun", "install"])
      await run(external, [
        "bun",
        join(workspace, "node_modules/typescript/bin/tsc"),
        "--noEmit",
      ])
      await run(external, ["bun", "geometry.ts"])
      await run(external, [
        "bun",
        "build",
        "./geometry.ts",
        "--target=node",
        "--outfile=geometry.mjs",
      ])
      await run(external, ["node", "geometry.mjs"])
      await run(external, ["bun", "drawing-boundary.ts"])
      await run(external, [
        "bun",
        "build",
        "./drawing-boundary.ts",
        "--target=node",
        "--outfile=drawing-boundary.mjs",
      ])
      await run(external, ["node", "drawing-boundary.mjs"])
      await run(external, ["bun", "native-collaboration.ts"])
      await run(external, [
        "bun",
        "build",
        "./native-collaboration.ts",
        "--target=node",
        "--outfile=native-collaboration.mjs",
      ])
      await run(external, ["node", "native-collaboration.mjs"])

      const nativeUpdateBefore = await readFile(
        join(ui, "package.json"),
        "utf8",
      )

      await run(ui, [
        ...command,
        "update",
        "editor-collaboration-native",
        "--dry-run",
        "--registry",
        `${server.url}r`,
      ])
      expect(await readFile(join(ui, "package.json"), "utf8")).toBe(
        nativeUpdateBefore,
      )
      await run(ui, [
        ...command,
        "update",
        "editor-collaboration-native",
        "--registry",
        `${server.url}r`,
      ])

      const installed: typeof initialized = await Bun.file(
        join(ui, "package.json"),
      ).json()

      expect(installed.exports["./keep"]).toBe("./keep.ts")
      expect(installed.sideEffects).toEqual(initialized.sideEffects)
      delete installed.exports[editorKey]
      delete installed.exports[codeKey]
      delete installed.exports[authKey]
      delete installed.exports[helperKey]
      await putJson(ui, "package.json", installed)
      const updateBefore = await readFile(join(ui, "package.json"), "utf8")
      await run(ui, [
        ...command,
        "update",
        "editor-code",
        "--dry-run",
        "--registry",
        `${server.url}r`,
      ])
      expect(await readFile(join(ui, "package.json"), "utf8")).toBe(
        updateBefore,
      )
      await putJson(ui, "package.json", installed)
      await run(ui, [
        ...command,
        "update",
        "editor-code",
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

      await run(app, ["bun", "src/geometry.ts"])

      const preserved: typeof initialized = await Bun.file(
        join(ui, "package.json"),
      ).json()

      preserved.exports[helperKey] = helperConditions
      await putJson(ui, "package.json", preserved)
      await run(ui, [
        ...command,
        "update",
        "editor",
        "--registry",
        `${server.url}r`,
      ])

      const conflict: typeof initialized = await Bun.file(
        join(ui, "package.json"),
      ).json()

      expect(conflict.exports[helperKey]).toEqual(helperConditions)

      await putJson(results, `${custom ? "custom" : "default"}.json`, conflict)

      for (const conflictKey of [editorKey, helperKey]) {
        const conflicting = {
          ...conflict,
          dependencies: { ...conflict.dependencies },
          exports: {
            ...conflict.exports,
            [conflictKey]:
              conflictKey === editorKey
                ? "./private.ts"
                : { types: helperTarget, default: "./private.ts" },
          },
        }

        delete conflicting.dependencies.zod
        await putJson(ui, "package.json", conflicting)
        const conflictBefore = await readFile(join(ui, "package.json"), "utf8")

        const sourceBefore = await readFile(
          join(ui, components, "editor/index.ts"),
          "utf8",
        )

        const helperBefore = await readFile(
          join(ui, components, "editor/table-presentation-schema.ts"),
          "utf8",
        )

        const trackingBefore = await readFile(join(ui, "ui.json"), "utf8")
        const lockBefore = await readFile(join(workspace, "bun.lock"), "utf8")

        for (const mode of ["add", "update"]) {
          expect(
            await run(
              ui,
              [...command, mode, "editor", "--registry", `${server.url}r`],
              false,
            ),
          ).toContain(`Conflicting UI package export: ${conflictKey}`)
          expect(
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
            ),
          ).toContain(`Conflicting UI package export: ${conflictKey}`)
          expect(await readFile(join(ui, "package.json"), "utf8")).toBe(
            conflictBefore,
          )
          expect(
            await readFile(join(ui, components, "editor/index.ts"), "utf8"),
          ).toBe(sourceBefore)
          expect(
            await readFile(
              join(ui, components, "editor/table-presentation-schema.ts"),
              "utf8",
            ),
          ).toBe(helperBefore)
          expect(await readFile(join(ui, "ui.json"), "utf8")).toBe(
            trackingBefore,
          )
          expect(await readFile(join(workspace, "bun.lock"), "utf8")).toBe(
            lockBefore,
          )
        }
      }
    }
  } finally {
    await writeFile(join(results, "install.log"), logs.join("\n\n"))
    await server.stop(true)
    await rm(directory, { recursive: true, force: true })
  }
}, 600_000)
