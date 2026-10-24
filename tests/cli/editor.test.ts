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

const results = join(root, "test-results/cli/editor")

test("editor guidance keeps editor separate from generic UI", () => {
  const content = designGuidance("User instructions\n")
  expect(content).toContain("@/components/editor")
  expect(content).toContain("add editor")
  expect(content.startsWith("User instructions\n")).toBe(true)
  expect(designGuidance(content)).toBe(content)
})

test("editor guidance follows the configured component path", () => {
  const content = designGuidance("", "@acme/ui/", {
    components: "@acme/ui/controls",
    editor: "@acme/ui/widgets/editor",
    tokens: "@acme/ui/styles/tokens.stylex",
    lib: "@acme/ui/services/stylex",
    css: "@acme/ui/styles/styles.css",
  })

  expect(content).toContain("@acme/ui/widgets/editor")
})

test("packed CLI installs complete editor source from generated registry", async () => {
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

    const inventory: { files: { target: string }[]; dependencies: string[] } =
      await Bun.file(join(root, "packages/registry/dist/r/editor.json")).json()

    const optional: {
      files: { target: string }[]
      dependencies: string[]
      registryDependencies: string[]
    } = await Bun.file(
      join(root, "packages/registry/dist/r/editor-document.json"),
    ).json()

    expect(optional.registryDependencies).toEqual(
      expect.arrayContaining(["editor", "editor-blocks"]),
    )
    expect(
      inventory.files.some((file) => file.target.includes("/document/")),
    ).toBe(false)

    const blocks: { files: { target: string }[] } = await Bun.file(
      join(root, "packages/registry/dist/r/editor-blocks.json"),
    ).json()

    inventory.files.push(...optional.files, ...blocks.files)
    inventory.dependencies.push(...optional.dependencies)

    const documentation: { parts: { name: string; importPath: string }[] } =
      await Bun.file(
        join(root, "packages/registry/dist/r/docs/editor.json"),
      ).json()

    for (const name of [
      "Editor",
      "EditorProps",
      "EditorAlignmentButton",
      "EditorFontColorControl",
      "EditorBackgroundColorControl",
      "EditorFontFamilyControl",
      "EditorFontSizeControl",
      "EditorFontWeightControl",
      "EditorLineHeightControl",
      "EditorFirstLineIndentControl",
      "EditorClearFormattingButton",
      "EditorAlignmentButtonProps",
      "EditorStyleControlProps",
      "EditorBlockPresentation",
      "parseEditorBlockPresentation",
      "$getEditorBlockPresentation",
      "editorBlockPresentationState",
      "EditorBlockPresentationExtension",
      "createEditorBlockPresentationHTMLConfig",
    ])
      expect(
        documentation.parts.find((part) => part.name === name)?.importPath,
      ).toBe("@/components/editor")

    const canonical = inventory.files.map((file) => {
      expect(file.target.startsWith("@/components/editor/")).toBe(true)

      return file.target.slice("@/components/editor/".length)
    })

    expect(canonical).toEqual(
      expect.arrayContaining([
        "style-controls.tsx",
        "block-presentation.ts",
        "block-presentation-extension.ts",
        "document/index.ts",
        "document/boundary.ts",
        "document/convert.ts",
        "document/state.ts",
        "document/static.tsx",
      ]),
    )
    expect(
      inventory.dependencies.some((dependency) =>
        dependency.startsWith("zod@^"),
      ),
    ).toBe(true)
    expect(
      inventory.dependencies.filter(
        (dependency) =>
          dependency.startsWith("lexical@") ||
          dependency.startsWith("@lexical/"),
      ),
    ).not.toBeEmpty()

    for (const dependency of inventory.dependencies.filter(
      (value) => value.startsWith("lexical@") || value.startsWith("@lexical/"),
    ))
      expect(dependency.endsWith("@^0.52.0")).toBe(true)

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
            workspaces: ["packages/*"],
            packageManager: "bun@1.3.10",
          }),
        )
      await writeFile(
        join(project, "package.json"),
        JSON.stringify({
          name: layout === "shared" ? "@acme/ui" : `editor-${layout}`,
          type: "module",
          dependencies: { react: "^19.2.0", "react-dom": "^19.2.0" },
        }),
      )
      const components = layout === "default" ? "src/components" : "src/widgets"
      const ui = layout === "default" ? "src/components/ui" : "src/controls"
      const lib = layout === "default" ? "src/lib" : "src/services"
      const prefix = layout === "shared" ? "@acme/ui" : "@"
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
      await run(
        project,
        "bunx",
        "yopem-ui",
        "add",
        "editor-document",
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
        `import { Editor, EditorRoot, EditorContent, EditorToolbar, EditorLineHeightControl, EditorFirstLineIndentControl, EditorBlockPresentationExtension, parseEditorBlockPresentation } from "${prefix}/${components.slice(4)}/editor"\nconst extensions = [EditorBlockPresentationExtension]\nexport const editor = <Editor ariaLabel="Content" id="content" className={["custom", "editor"].join("-")} xstyle={[]} ref={null} />\nexport const styled = <EditorRoot extensions={extensions}><EditorToolbar><EditorLineHeightControl /><EditorFirstLineIndentControl /></EditorToolbar><EditorContent /></EditorRoot>\nexport const presentation = parseEditorBlockPresentation({ lineHeight: "2", textIndent: "24px" })\n`,
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
            skipLibCheck: true,
            allowImportingTsExtensions: true,
            noEmit: true,
            paths: { [`${prefix}/*`]: ["./src/*"] },
          },
          include: ["src"],
        }),
      )
      await writeFile(
        join(project, "src/portable.ts"),
        `import { createHeadlessEditor } from "@lexical/headless"
import { documentNodes, importDocument, exportDocument, parseDocument, htmlDocument } from "${prefix}/${components.slice(4)}/editor/document"
import { strict as assert } from "node:assert"
assert.equal(typeof globalThis.window, "undefined")
assert.equal(typeof globalThis.document, "undefined")
const editor = createHeadlessEditor({ namespace: "consumer", nodes: documentNodes, onError(error) { throw error } })
importDocument(editor, "# Consumer", "markdown")
assert.deepEqual(parseDocument(exportDocument(editor, "html"), "html"), editor.getEditorState().toJSON())
assert.ok(htmlDocument(editor).startsWith("<!doctype html>"))
`,
      )
      await writeFile(
        join(project, "src/static.tsx"),
        `import { DocumentStatic } from "${prefix}/${components.slice(4)}/editor/document/static"
import { renderToStaticMarkup } from "react-dom/server"
import { strict as assert } from "node:assert"
const blocks = '<details data-editor-toggle="" open><summary>Summary</summary><div data-editor-toggle-body=""><p>Body</p></div></details>'
assert.ok(renderToStaticMarkup(<DocumentStatic html={blocks} />).includes("<summary"))
const emptySummary = '<details data-editor-toggle=""><summary></summary><div data-editor-toggle-body=""><p>Body</p></div></details>'
assert.ok(renderToStaticMarkup(<DocumentStatic html={emptySummary} />).includes('aria-label="Toggle content"'))
const safeLink = renderToStaticMarkup(<DocumentStatic html={'<p><a href="https://example.com" target="_blank">Link</a></p>'} />)
const relations = /rel="([^"]*)"/.exec(safeLink)?.[1]?.split(" ")
assert.ok(relations?.includes("noopener") && relations.includes("noreferrer"))
assert.throws(() => renderToStaticMarkup(<DocumentStatic html={'<details data-editor-toggle=""><summary>Missing body</summary></details>'} />), { name: "DocumentError" })
const output = renderToStaticMarkup(<DocumentStatic html={'<table><tr data-editor-row-height="41.125" data-editor-state="{&quot;foreign&quot;:3}"><td data-editor-border="hidden">Consumer</td></tr></table>'} />)
assert.ok(output.includes("Consumer"))
assert.ok(output.includes('data-editor-row-height="41.125"'))
assert.ok(output.includes('data-editor-border="hidden"'))
assert.ok(output.includes('data-editor-state='))
assert.ok(!output.includes("contenteditable"))
for (const html of [
  '<p><a href="https://example.com" target="_blank" rel="opener">Link</a></p>',
  '<p><a href="https://example.com" target="_blank" rel="noopener OPENER">Link</a></p>',
  '<p><a href="https://example.com" target="named-window">Link</a></p>',
]) assert.throws(() => renderToStaticMarkup(<DocumentStatic html={html} />), { name: "DocumentError" })
`,
      )
      await run(project, "bun", "src/portable.ts")
      await run(project, "bun", "src/static.tsx")

      if (layout === "shared") {
        const consumer = join(workspace, "packages/consumer")
        await mkdir(consumer, { recursive: true })
        await writeFile(
          join(consumer, "package.json"),
          JSON.stringify({
            name: "editor-consumer",
            type: "module",
            dependencies: {
              "@acme/ui": "workspace:*",
              "@lexical/headless": "^0.52.0",
              react: "^19.3.0",
              "react-dom": "^19.3.0",
            },
          }),
        )
        await run(workspace, "bun", "install")
        await writeFile(
          join(consumer, "portable.ts"),
          await readFile(join(project, "src/portable.ts"), "utf8"),
        )
        await writeFile(
          join(consumer, "static.tsx"),
          await readFile(join(project, "src/static.tsx"), "utf8"),
        )
        await run(consumer, "bun", "portable.ts")
        await run(consumer, "bun", "static.tsx")
      }

      await run(project, "bunx", "tsc", "--noEmit")
      await run(
        project,
        "bunx",
        "yopem-ui",
        "update",
        "editor-document",
        "--registry",
        `${server.url}r`,
      )

      await run(project, "bunx", "tsc", "--noEmit")

      const manifest = JSON.parse(
        await readFile(join(project, "ui.json"), "utf8"),
      )

      expect(
        Object.keys(manifest.files).filter((file) =>
          file.startsWith(`${components}/editor/`),
        ).length,
      ).toBe(canonical.length)
      const installed = await Bun.file(join(project, "package.json")).json()

      for (const dependency of inventory.dependencies.filter(
        (value) =>
          value.startsWith("lexical@") || value.startsWith("@lexical/"),
      ))
        expect(
          installed.dependencies[
            dependency.slice(0, dependency.lastIndexOf("@"))
          ],
        ).toBe("^0.52.0")
      await mkdir(join(results, layout), { recursive: true })
      await writeFile(
        join(results, layout, "ui.json"),
        JSON.stringify(manifest, null, 2),
      )
      await writeFile(
        join(results, layout, "package.json"),
        JSON.stringify(installed, null, 2),
      )
      await writeFile(
        join(results, layout, "portable.ts"),
        await readFile(join(project, "src/portable.ts"), "utf8"),
      )
      await writeFile(
        join(results, layout, "static.tsx"),
        await readFile(join(project, "src/static.tsx"), "utf8"),
      )
    }
  } finally {
    await writeFile(join(results, "install.log"), logs.join("\n\n"))
    await server.stop(true)
    await rm(directory, { recursive: true, force: true })
  }
}, 360_000)
