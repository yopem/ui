import { mapImportPath } from "@cli/install"
import { registryItemSchema } from "@registry/schema"
import { rewriteImports } from "@registry/source-files"
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
import { z } from "zod"

const publicParts = [
  "EditorInlineCombobox",
  "EditorInlineComboboxInput",
  "EditorInlineComboboxContent",
  "EditorInlineComboboxList",
  "EditorInlineComboboxItem",
  "EditorInlineComboboxEmpty",
  "EditorInlineComboboxStatus",
  "EditorInlineComboboxGroup",
  "EditorInlineComboboxGroupLabel",
  "EditorInlineComboboxRow",
  "EditorTypeahead",
  "EditorEmojiPopover",
  "EditorEmojiToolbarButton",
  "EditorEmojiPopoverContent",
  "EditorEmojiPicker",
  "EditorEmojiSearch",
  "EditorEmojiCategory",
  "EditorEmojiList",
  "EditorEmojiItem",
  "EditorEmojiEmpty",
  "EditorEmojiPrevious",
  "EditorEmojiNext",
  "EditorEmojiClearHistory",
  "EditorEmojiMenu",
  "EditorEmojiClearSearch",
  "EditorEmojiPreview",
]

const root = resolve(import.meta.dirname, "../..")

const results = join(root, "test-results/cli/editor-typeahead")

test("packed CLI installs optional editor typeahead source from generated registry", async () => {
  const directory = await mkdtemp(join(tmpdir(), "yopem-typeahead-install-"))
  expect(
    import.meta
      .resolve("@yopem-ui/editor/typeahead")
      .endsWith("/packages/editor/src/typeahead-index.ts"),
  ).toBe(true)
  const logs: string[] = []
  const requests: { url: string; status: number }[] = []
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

      const status = (await file.exists()) ? 200 : 404

      if (status === 200) {
        const item = registryItemSchema.parse(await file.json())
        expect(
          item.dependencies.some(
            (dependency) =>
              dependency.includes("catalog:") ||
              dependency.includes("workspace:"),
          ),
        ).toBe(false)
      }

      requests.push({ url: request.url, status })

      return new Response(status === 200 ? file : null, { status })
    },
  })

  expect(server.port).not.toBe(3100)

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
    const archiveBytes = await Bun.file(join(directory, archive)).arrayBuffer()
    await writeFile(
      join(results, "packed-cli.json"),
      JSON.stringify(
        {
          archive,
          sha256: new Bun.CryptoHasher("sha256")
            .update(archiveBytes)
            .digest("hex"),
          bytes: archiveBytes.byteLength,
        },
        null,
        2,
      ),
    )

    const packedManifest = await run(
      directory,
      "tar",
      "-xOf",
      archive,
      "package/package.json",
    )

    expect(packedManifest).not.toContain("catalog:")
    await writeFile(join(results, "packed-cli-package.json"), packedManifest)

    const catalog: { catalog: Record<string, string> } = await Bun.file(
      join(root, "package.json"),
    ).json()

    const inventory: { files: { target: string }[]; dependencies: string[] } =
      await Bun.file(
        join(root, "packages/registry/dist/r/editor-typeahead.json"),
      ).json()

    const documentation: { parts: { name: string; importPath: string }[] } =
      await Bun.file(
        join(root, "packages/registry/dist/r/docs/editor-typeahead.json"),
      ).json()

    for (const name of [
      ...publicParts,
      "createEditorTypeahead",
      "createEditorEmojiPicker",
      "MentionNode",
      "useEditorInlineCombobox",
      "useEditorEmojiPicker",
    ])
      expect(
        documentation.parts.find((part) => part.name === name)?.importPath,
      ).toBe("@/components/editor/typeahead-index")

    const canonical = inventory.files.map((file) => {
      expect(file.target.startsWith("@/components/editor/")).toBe(true)

      return file.target.slice("@/components/editor/".length)
    })

    expect(canonical).toContain("mention-codec.ts")
    expect(canonical).toContain("emoji-picker-store.ts")
    expect(inventory.dependencies).toContain("emojibase-data@^18.0.0")
    expect(inventory.dependencies).toContain("emojibase@^18.0.0")

    for (const layout of ["default", "custom", "shared"] as const) {
      const workspace = join(directory, layout)

      const project =
        layout === "shared" ? join(workspace, "packages/ui") : workspace

      await mkdir(join(project, "src"), { recursive: true })

      if (layout === "shared")
        await writeFile(
          join(workspace, "package.json"),
          JSON.stringify({
            private: true,
            workspaces: ["packages/*", "apps/*"],
            packageManager: "bun@1.3.10",
          }),
        )
      await writeFile(
        join(project, "package.json"),
        JSON.stringify({
          name: layout === "shared" ? "@acme/ui" : `editor-${layout}`,
          type: "module",
          exports: layout === "shared" ? { "./keep": "./keep.ts" } : undefined,
          sideEffects: ["./keep.css"],
          dependencies: {
            react: catalog.catalog.react,
            "react-dom": catalog.catalog["react-dom"],
          },
        }),
      )
      const components = layout === "default" ? "src/components" : "src/widgets"
      const ui = layout === "default" ? "src/components/ui" : "src/controls"
      const lib = layout === "default" ? "src/lib" : "src/services"

      const prefix =
        layout === "shared"
          ? "@acme/ui"
          : layout === "custom"
            ? "@host/app"
            : "@"

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
        "@types/node",
      )

      const beforePackage = await readFile(
        join(project, "package.json"),
        "utf8",
      )

      const beforeConfig = await readFile(join(project, "ui.json"), "utf8")
      await run(
        project,
        "bunx",
        "--no-install",
        "yopem-ui",
        "add",
        "editor-typeahead",
        "--dry-run",
        "--registry",
        `${server.url}r`,
      )
      expect(await readFile(join(project, "package.json"), "utf8")).toBe(
        beforePackage,
      )
      expect(await readFile(join(project, "ui.json"), "utf8")).toBe(
        beforeConfig,
      )
      expect(
        await Bun.file(
          join(project, components, "editor/typeahead-index.ts"),
        ).exists(),
      ).toBe(false)
      await run(
        project,
        "bunx",
        "--no-install",
        "yopem-ui",
        "add",
        "editor-typeahead",
        "--registry",
        `${server.url}r`,
      )

      for (const file of canonical)
        expect(
          await Bun.file(join(project, components, "editor", file)).exists(),
        ).toBe(true)
      expect(await Bun.file(join(project, ui, "button.tsx")).exists()).toBe(
        true,
      )
      await writeFile(
        join(project, "src/check.tsx"),
        `import { EditorRoot, EditorToolbar } from "${prefix}/${components.slice(4)}/editor"
import { createEditorTypeahead, EditorEmojiPopover, EditorEmojiPopoverContent, EditorEmojiToolbarButton, EditorEmojiPicker, EditorInlineCombobox, EditorInlineComboboxInput, EditorInlineComboboxContent, EditorInlineComboboxList, EditorInlineComboboxItem, useEditorInlineCombobox, decodeMention } from "${prefix}/${components.slice(4)}/editor/typeahead-index"
const controller = createEditorTypeahead({ mentions: { load(query, signal) { signal.throwIfAborted(); return Promise.resolve([{ id: "ada", label: query || "Ada" }]) } } })
const extensions = [controller.extension]
export function Suggestions() { const { state } = useEditorInlineCombobox(); return <EditorInlineComboboxContent aria-label="Suggestions"><EditorInlineComboboxList>{state.items.map(item => <EditorInlineComboboxItem key={item.id} item={item} />)}</EditorInlineComboboxList></EditorInlineComboboxContent> }
export function Consumer() { return <EditorRoot extensions={extensions}><EditorToolbar><EditorEmojiPopover><EditorEmojiToolbarButton /><EditorEmojiPopoverContent><EditorEmojiPicker /></EditorEmojiPopoverContent></EditorEmojiPopover></EditorToolbar><EditorInlineCombobox controller={controller}><EditorInlineComboboxInput /><Suggestions /></EditorInlineCombobox></EditorRoot> }
export const mention = decodeMention({ id: "ada", label: "Ada" })
`,
      )
      await writeFile(
        join(project, "tsconfig.json"),
        JSON.stringify({
          compilerOptions: {
            target: "ES2022",
            types: ["node", "react", "react-dom"],
            module: "ESNext",
            moduleResolution: "Bundler",
            jsx: "react-jsx",
            strict: true,
            resolveJsonModule: true,
            skipLibCheck: true,
            allowImportingTsExtensions: true,
            noEmit: true,
            paths: { [`${prefix}/*`]: ["./src/*"] },
          },
          include: ["src"],
        }),
      )

      const preview = await readFile(
        join(root, "apps/docs/src/catalog/previews/editor-typeahead.tsx"),
        "utf8",
      )

      const consumer = rewriteImports(preview).replaceAll(
        /(["'])@\/([^"']+)\1/g,
        (_, quote: string, path: string) =>
          `${quote}${mapImportPath(`@/${path}`, { components, ui, lib, hooks: "src/hooks", styles: "src/styles", theme: "src/themes" }, prefix)}${quote}`,
      )

      await writeFile(join(project, "src/preview.tsx"), consumer)

      const entry = `${prefix}/${components.slice(4)}/editor/typeahead-index`
      await writeFile(
        join(project, "src/public-contract.ts"),
        `import * as publicParts from "${entry}"
export { publicParts }
export const parts = [${publicParts.map((name) => `publicParts.${name}`).join(", ")}]
export const identity = publicParts.parseMentionMarkdown(publicParts.mentionMarkdown({ id: "ada", label: "Ada" }))
`,
      )
      await writeFile(
        join(project, "src/runtime.ts"),
        `import { strict as assert } from "node:assert"
import { decodeMention, mentionMarkdown, parseMentionMarkdown, safeMentionProfileURL } from "${prefix}/${components.slice(4)}/editor/mention-codec"
import { editorEmojiInventory, searchEditorEmoji } from "${prefix}/${components.slice(4)}/editor/typeahead-emoji"
assert.ok(editorEmojiInventory.length > 1000)
assert.ok(searchEditorEmoji("smile").length > 0)
assert.ok(searchEditorEmoji("").length <= 50)
assert.equal(Reflect.has(globalThis, "document"), false)
assert.deepEqual(parseMentionMarkdown(mentionMarkdown({ id: "ada", label: "Ada" })), { id: "ada", label: "Ada" })
assert.equal(decodeMention({ id: "", label: "Ada" }), null)
assert.equal(safeMentionProfileURL("javascript:alert(1)"), null)
console.info("mention codec runtime passed")
`,
      )
      await run(project, "bun", "run", "src/runtime.ts")
      await run(
        project,
        "bun",
        "build",
        "./src/runtime.ts",
        "--target=node",
        "--outfile=runtime.mjs",
      )
      await run(project, "node", "runtime.mjs")
      await run(
        project,
        "bun",
        "build",
        "./src/public-contract.ts",
        "--target=browser",
        "--outfile=browser.js",
        "--metafile=browser-meta.json",
      )

      const graph = z
        .object({
          inputs: z.record(
            z.string(),
            z.object({ bytes: z.number().int().nonnegative() }),
          ),
        })
        .parse(await Bun.file(join(project, "browser-meta.json")).json())

      expect(
        Object.keys(graph.inputs).some((name) =>
          /editor-auth|server\/|better-auth|openauth/.test(name),
        ),
      ).toBe(false)

      for (const data of [
        "emojibase-data/en/data.json",
        "emojibase-data/en/shortcodes/emojibase.json",
        "emojibase-data/meta/groups.json",
      ])
        expect(
          Object.keys(graph.inputs).some((name) => name.includes(data)),
        ).toBe(true)
      const proof: Record<string, { sha256: string; bytes: number }> = {}

      for (const file of [
        "runtime.mjs",
        "browser.js",
        ...canonical.map((name) => `${components}/editor/${name}`),
      ]) {
        const bytes = await Bun.file(join(project, file)).arrayBuffer()
        proof[file] = {
          sha256: new Bun.CryptoHasher("sha256").update(bytes).digest("hex"),
          bytes: bytes.byteLength,
        }
      }

      await mkdir(join(results, layout), { recursive: true })
      await writeFile(
        join(results, layout, "proof.json"),
        JSON.stringify(proof, null, 2),
      )

      const installedPackage = await readFile(
        join(project, "package.json"),
        "utf8",
      )

      expect(installedPackage).not.toContain("catalog:")
      expect(installedPackage).not.toContain("@registry/")
      await mkdir(join(results, layout), { recursive: true })

      for (const file of ["package.json", "browser-meta.json", "tsconfig.json"])
        await writeFile(
          join(results, layout, file),
          await readFile(join(project, file)),
        )
      await run(project, "bunx", "tsc", "--noEmit")
      await run(
        project,
        "bunx",
        "--no-install",
        "yopem-ui",
        "update",
        "editor-typeahead",
        "--registry",
        `${server.url}r`,
      )

      const updatePackage = await readFile(
        join(project, "package.json"),
        "utf8",
      )

      const updateConfig = await readFile(join(project, "ui.json"), "utf8")
      await run(
        project,
        "bunx",
        "--no-install",
        "yopem-ui",
        "update",
        "editor-typeahead",
        "--dry-run",
        "--registry",
        `${server.url}r`,
      )
      expect(await readFile(join(project, "package.json"), "utf8")).toBe(
        updatePackage,
      )
      expect(await readFile(join(project, "ui.json"), "utf8")).toBe(
        updateConfig,
      )
      await run(project, "bunx", "tsc", "--noEmit")

      if (layout === "shared") {
        const app = join(workspace, "apps/web")
        await mkdir(join(app, "src"), { recursive: true })
        await writeFile(
          join(app, "package.json"),
          JSON.stringify({
            name: "web",
            type: "module",
            devDependencies: {
              "@types/react": catalog.catalog["@types/react"],
              "@types/react-dom": catalog.catalog["@types/react-dom"],
              "@types/node": catalog.catalog["@types/node"],
            },
            dependencies: {
              "@acme/ui": "workspace:*",
              react: catalog.catalog.react,
              "react-dom": catalog.catalog["react-dom"],
            },
          }),
        )
        await writeFile(
          join(app, "src/check.tsx"),
          `import { createEditorTypeahead, EditorTypeahead, EditorEmojiMenu } from "@acme/ui/widgets/editor/typeahead-index"
import { EditorRoot, EditorToolbar } from "@acme/ui/widgets/editor"
const controller = createEditorTypeahead()
const extensions = [controller.extension]
export function External() { return <EditorRoot extensions={extensions}><EditorToolbar><EditorEmojiMenu history={controller.emojiHistory} /></EditorToolbar><EditorTypeahead controller={controller} /></EditorRoot> }
`,
        )
        await writeFile(
          join(app, "tsconfig.json"),
          JSON.stringify({
            compilerOptions: {
              target: "ES2022",
              types: ["node", "react", "react-dom"],
              module: "ESNext",
              moduleResolution: "Bundler",
              jsx: "react-jsx",
              strict: true,
              skipLibCheck: true,
              resolveJsonModule: true,
              noEmit: true,
            },
            include: ["src"],
          }),
        )
        await run(workspace, "bun", "install", "--ignore-scripts")
        await run(
          project,
          "bunx",
          "tsc",
          "--project",
          join(app, "tsconfig.json"),
        )

        await writeFile(
          join(app, "src/runtime.ts"),
          `import { strict as assert } from "node:assert"
import { decodeMention } from "@acme/ui/widgets/editor/mention-codec"
assert.ok(import.meta.resolve("@acme/ui/widgets/editor/typeahead-index").endsWith("/widgets/editor/typeahead-index.ts"))
assert.deepEqual(decodeMention({ id: "ada", label: "Ada" }), { id: "ada", label: "Ada" })
console.info("external package exports runtime passed")
`,
        )
        await run(app, "bun", "run", "src/runtime.ts")
        await run(
          app,
          "bun",
          "build",
          "./src/runtime.ts",
          "--target=node",
          "--outfile=runtime.mjs",
        )
        await run(app, "node", "runtime.mjs")
        await run(
          app,
          "bun",
          "build",
          "./src/check.tsx",
          "--target=browser",
          "--outfile=browser.js",
        )
        await mkdir(join(results, layout, "external"), { recursive: true })

        for (const file of [
          "package.json",
          "tsconfig.json",
          "src/runtime.ts",
          "src/check.tsx",
        ])
          await writeFile(
            join(results, layout, "external", file.replaceAll("/", "-")),
            await readFile(join(app, file)),
          )

        const installed: {
          exports: Record<string, string>
          sideEffects: string[]
        } = await Bun.file(join(project, "package.json")).json()

        expect(installed.exports["./keep"]).toBe("./keep.ts")
        expect(installed.sideEffects).toContain("./keep.css")
        await mkdir(join(results, layout), { recursive: true })
        await writeFile(
          join(results, layout, "package.json"),
          JSON.stringify(installed, null, 2),
        )
      }

      const manifest = JSON.parse(
        await readFile(join(project, "ui.json"), "utf8"),
      )

      for (const file of canonical)
        expect(Object.keys(manifest.files)).toContain(
          `${components}/editor/${file}`,
        )
      await mkdir(join(results, layout), { recursive: true })
      await writeFile(
        join(results, layout, "ui.json"),
        JSON.stringify(manifest, null, 2),
      )
    }
  } finally {
    await writeFile(join(results, "install.log"), logs.join("\n\n"))
    await writeFile(
      join(results, "http.json"),
      JSON.stringify(requests, null, 2),
    )
    await server.stop(true)
    await rm(directory, { recursive: true, force: true })
  }
}, 360_000)
