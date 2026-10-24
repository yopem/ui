import { sourceItems } from "@registry/items/index"
import { registryItemSchema } from "@registry/schema"
import { rewriteImports } from "@registry/source-files"
import { resolveSourcePath } from "@registry/source-path"
import { expect, test } from "bun:test"
import { createHash } from "node:crypto"
import { mkdir, mkdtemp, readdir, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { z } from "zod"

const root = resolve(import.meta.dirname, "../..")

const results = join(root, "test-results/cli/editor-math")

for (const custom of [false, true])
  test(`packed CLI installs optional math with ${custom ? "custom" : "default"} paths`, async () => {
    const pending = [
      "editor-math",
      "base",
      "theme",
      "editor-code",
      "editor-auth",
      "editor-blocks",
    ]

    const visited = new Set<string>()

    while (pending.length) {
      const name = pending.pop()

      if (!name || visited.has(name)) continue
      visited.add(name)
      const source = sourceItems.find((item) => item.name === name)

      if (!source) throw new Error(`Missing ${name}`)
      pending.push(...source.registryDependencies)

      const files = await Promise.all(
        source.files.map(async (file) => {
          const content = rewriteImports(
            await Bun.file(resolveSourcePath(file.path)).text(),
            file.path,
          )

          return {
            ...file,
            content,
            integrity: `sha256-${createHash("sha256").update(content).digest("base64")}`,
          }
        }),
      )

      const item = registryItemSchema.parse({
        ...source,
        files,
        registryVersion: "0.1.0",
        schemaVersion: 1,
      })

      await mkdir(join(root, "packages/registry/dist/r"), { recursive: true })
      await writeFile(
        join(root, "packages/registry/dist/r", `${name}.json`),
        JSON.stringify(item),
      )
    }

    const directory = await mkdtemp(join(tmpdir(), "yopem-math-"))
    await mkdir(results, { recursive: true })
    await mkdir(join(directory, "src"), { recursive: true })
    const logs: string[] = []

    async function run(cwd: string, ...args: string[]) {
      const child = Bun.spawn(args, {
        cwd,
        stdout: "pipe",
        stderr: "pipe",
        timeout: 120000,
      })

      const [status, stdout, stderr] = await Promise.all([
        child.exited,
        new Response(child.stdout).text(),
        new Response(child.stderr).text(),
      ])

      logs.push(
        `${cwd}\n${args.join(" ")}\nexit: ${status}\n${stdout}${stderr}`,
      )
      expect(status, `${stdout}${stderr}`).toBe(0)
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

      if (!archive) throw new Error("Missing packed CLI")

      const manifest = z
        .object({
          catalog: z.object({ react: z.string(), "react-dom": z.string() }),
        })
        .parse(await Bun.file(join(root, "package.json")).json())

      await writeFile(
        join(directory, "package.json"),
        JSON.stringify({
          name: "math-consumer",
          private: true,
          type: "module",
          dependencies: {
            react: manifest.catalog.react,
            "react-dom": manifest.catalog["react-dom"],
          },
        }),
      )
      await writeFile(
        join(directory, "ui.json"),
        JSON.stringify({
          version: 1,
          files: {},
          sourceRoot: "src",
          importPrefix: "@",
          paths: custom
            ? { components: "src/custom/components", ui: "src/custom/ui" }
            : { components: "src/components", ui: "src/components/ui" },
        }),
      )
      await run(
        directory,
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
        directory,
        "bunx",
        "yopem-ui",
        "add",
        "editor-math",
        "--registry",
        `${server.url}r`,
      )

      const item = registryItemSchema.parse(
        await Bun.file(
          join(root, "packages/registry/dist/r/editor-math.json"),
        ).json(),
      )

      expect(item.registryDependencies).toContain("editor")

      for (const file of item.files)
        expect(
          await Bun.file(
            join(
              directory,
              file.target
                .replace(
                  "@/components/editor/",
                  custom
                    ? "src/custom/components/editor/"
                    : "src/components/editor/",
                )
                .replace("@/", "src/"),
            ),
          ).exists(),
        ).toBe(true)
      await writeFile(
        join(directory, "src/check.tsx"),
        `import { EditorRoot, EditorContent, EditorToolbar } from "@/components/editor"
import { EditorMathExtension, EditorMathControls, EditorMathControl } from "@/components/editor/math"
const extensions = [EditorMathExtension]
export const content = <EditorRoot extensions={extensions}><EditorToolbar><EditorMathControls /><EditorMathControl kind="inline" /></EditorToolbar><EditorContent /></EditorRoot>
`.replaceAll(
          "@/components/editor",
          custom ? "@/custom/components/editor" : "@/components/editor",
        ),
      )
      await writeFile(
        join(directory, "src/check-model.ts"),
        `import { parseEditorMath, editorMathToMarkdown, editorMathFromMarkdown } from "@/components/editor/math-model"
import { strict as assert } from "node:assert"
assert.equal(Reflect.has(globalThis, "document"), false)
const math = parseEditorMath({kind: "inline", tex: "x^2"})
assert.deepEqual(editorMathFromMarkdown(editorMathToMarkdown(math)), math)
`.replaceAll(
          "@/components/editor",
          custom ? "@/custom/components/editor" : "@/components/editor",
        ),
      )
      await writeFile(
        join(directory, "tsconfig.json"),
        JSON.stringify({
          compilerOptions: {
            target: "ES2022",
            types: ["node", "react", "react-dom"],
            module: "ESNext",
            moduleResolution: "Bundler",
            jsx: "react-jsx",
            strict: true,
            skipLibCheck: true,
            noEmit: true,
            paths: { "@/*": ["./src/*"] },
          },
          include: ["src"],
        }),
      )
      await run(directory, "bunx", "tsc", "--noEmit")
      await run(directory, "bun", "run", "src/check-model.ts")
      await run(
        directory,
        "bunx",
        "yopem-ui",
        "update",
        "editor-math",
        "--registry",
        `${server.url}r`,
      )
      await run(directory, "bunx", "tsc", "--noEmit")
    } finally {
      await writeFile(
        join(results, custom ? "custom-install.log" : "default-install.log"),
        logs.join("\n\n"),
      )
      await server.stop(true)
    }
  }, 360000)
