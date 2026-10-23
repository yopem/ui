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
      )
      await run(
        project,
        "bunx",
        "yopem-ui",
        "add",
        "editor",
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
      await run(project, "bunx", "tsc", "--noEmit")
      await run(
        project,
        "bunx",
        "yopem-ui",
        "update",
        "editor",
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
    }
  } finally {
    await writeFile(join(results, "install.log"), logs.join("\n\n"))
    await server.stop(true)
    await rm(directory, { recursive: true, force: true })
  }
}, 360_000)
