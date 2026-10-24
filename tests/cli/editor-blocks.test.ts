import { registryItemSchema } from "@registry/schema"
import { expect, test } from "bun:test"
import { mkdir, mkdtemp, readdir, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { z } from "zod"

const root = resolve(import.meta.dirname, "../..")

const results = join(root, "test-results/cli/editor-blocks")

test("packed CLI installs optional blocks with typed and server-safe consumer entries", async () => {
  const directory = await mkdtemp(join(tmpdir(), "yopem-blocks-"))
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

    logs.push(`${cwd}\n${args.join(" ")}\nexit: ${status}\n${stdout}${stderr}`)
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
        name: "blocks-consumer",
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
      "editor-blocks",
      "--registry",
      `${server.url}r`,
    )

    const item = registryItemSchema.parse(
      await Bun.file(
        join(root, "packages/registry/dist/r/editor-blocks.json"),
      ).json(),
    )

    expect(item.registryDependencies).toContain("editor")

    for (const file of item.files)
      expect(
        await Bun.file(
          join(directory, file.target.replace("@/", "src/")),
        ).exists(),
      ).toBe(true)
    await writeFile(
      join(directory, "src/check.tsx"),
      `import { EditorRoot, EditorContent, EditorToolbar } from "@/components/editor"
import { EditorBlocksExtension, EditorBlocksControls, EditorBlockTypeButton } from "@/components/editor/blocks"
const extensions = [EditorBlocksExtension]
export const content = <EditorRoot extensions={extensions}><EditorToolbar><EditorBlocksControls /><EditorBlockTypeButton kind="toggle" /></EditorToolbar><EditorContent /></EditorRoot>
`,
    )
    await writeFile(
      join(directory, "src/check-model.ts"),
      `import { CalloutNode, ToggleNode, validateEditorBlocksJSON } from "@/components/editor/blocks-model"
import { strict as assert } from "node:assert"
assert.equal(Reflect.has(globalThis, "document"), false)
assert.equal(CalloutNode.getType(), "editor-callout")
assert.equal(ToggleNode.getType(), "editor-toggle")
validateEditorBlocksJSON({ root: { type: "root", children: [] } })
`,
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
      "editor-blocks",
      "--registry",
      `${server.url}r`,
    )
    await run(directory, "bunx", "tsc", "--noEmit")
  } finally {
    await writeFile(join(results, "install.log"), logs.join("\n\n"))
    await server.stop(true)
  }
}, 360000)
