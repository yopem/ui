import { sourceItems } from "@registry/items/index"
import { registryItemSchema } from "@registry/schema"
import { rewriteImports } from "@registry/source-files"
import { resolveSourcePath } from "@registry/source-path"
import { expect, test } from "bun:test"
import { createHash } from "node:crypto"
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  symlink,
  writeFile,
} from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"

const root = resolve(import.meta.dirname, "../..")

const results = join(root, "test-results/cli/editor-review-current")

test("packed HTTP review add and update preserve external consumer closure", async () => {
  const directory = await mkdtemp(join(tmpdir(), "yopem-review-current-"))
  await mkdir(results, { recursive: true })
  const logs: string[] = []

  async function run(cwd: string, ...args: string[]) {
    const child = Bun.spawn(args, { cwd, stdout: "pipe", stderr: "pipe" })

    const [status, stdout, stderr] = await Promise.all([
      child.exited,
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
    ])

    logs.push(`${cwd}\n${args.join(" ")}\nexit: ${status}\n${stdout}${stderr}`)
    await writeFile(join(results, "commands.log"), logs.join("\n\n"))
    expect(status, `${stdout}${stderr}`).toBe(0)

    return stdout
  }

  const names = new Set<string>()

  function visit(name: string) {
    if (names.has(name)) return
    const item = sourceItems.find((candidate) => candidate.name === name)

    if (!item) throw new Error(`Missing registry item ${name}`)
    names.add(name)

    for (const dependency of item.registryDependencies) visit(dependency)
  }

  visit("editor-review")

  const items = await Promise.all(
    sourceItems
      .filter((item) => names.has(item.name))
      .map(async (item) =>
        registryItemSchema.parse({
          ...item,
          $schema: "https://ui.yopem.com/schema/registry-item.json",
          registryVersion: "0.1.0",
          schemaVersion: 1,
          files: await Promise.all(
            item.files.map(async (file) => {
              const content = rewriteImports(
                await readFile(resolveSourcePath(file.path), "utf8"),
                file.path,
              )

              return {
                ...file,
                content,
                integrity: `sha256-${createHash("sha256").update(content).digest("base64")}`,
              }
            }),
          ),
        }),
      ),
  )

  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    fetch(request) {
      const name = new URL(request.url).pathname.match(
        /^\/r\/([a-z0-9-]+)\.json$/,
      )?.[1]

      const item = items.find((candidate) => candidate.name === name)

      return item ? Response.json(item) : new Response(null, { status: 404 })
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

    if (!archive) throw new Error("Missing packed CLI archive")
    await run(directory, "tar", "-xzf", join(directory, archive))
    const cli = join(directory, "package/dist/cli.js")
    await symlink(
      join(root, "node_modules"),
      join(directory, "package/node_modules"),
    )

    for (const layout of ["default", "custom", "shared"]) {
      const workspace = join(directory, layout)

      const project =
        layout === "shared" ? join(workspace, "packages/ui") : workspace

      await mkdir(join(project, "src"), { recursive: true })

      if (layout === "shared")
        await writeFile(
          join(workspace, "package.json"),
          JSON.stringify({ private: true, workspaces: ["packages/*"] }),
        )
      const dependencies: Record<string, string> = {}

      for (const item of items)
        for (const specifier of [
          ...item.dependencies,
          ...item.devDependencies,
        ]) {
          const split = specifier.lastIndexOf("@")
          dependencies[specifier.slice(0, split)] = specifier.slice(split + 1)
        }

      await writeFile(
        join(project, "package.json"),
        JSON.stringify({
          name: layout === "shared" ? "@acme/ui" : `review-${layout}`,
          type: "module",
          packageManager: "bun@1.4.4",
          dependencies,
        }),
      )
      const components = layout === "default" ? "src/components" : "src/widgets"
      const prefix = layout === "shared" ? "@acme/ui" : "@"
      await writeFile(
        join(project, "ui.json"),
        JSON.stringify({
          version: 1,
          files: {},
          sourceRoot: "src",
          importPrefix: prefix,
          paths: { components, ui: "src/controls", lib: "src/services" },
        }),
      )
      await symlink(join(root, "node_modules"), join(project, "node_modules"))
      const before = await readFile(join(project, "ui.json"), "utf8")
      await run(
        project,
        "node",
        cli,
        "add",
        "editor-review",
        "--registry",
        `${server.url}r`,
        "--dry-run",
      )
      expect(await readFile(join(project, "ui.json"), "utf8")).toBe(before)
      await run(
        project,
        "node",
        cli,
        "add",
        "editor-review",
        "--registry",
        `${server.url}r`,
      )

      for (const file of items.flatMap((item) => item.files)) {
        if (!file.path.startsWith("components/editor/")) continue
        expect(
          await Bun.file(
            join(
              project,
              components,
              "editor",
              file.path.slice("components/editor/".length),
            ),
          ).exists(),
        ).toBe(true)
      }

      await writeFile(
        join(project, "src/review.tsx"),
        `import { EditorReviewPreset, type EditorReviewHost } from "${prefix}/${components.slice(4)}/editor/review"\nimport { parseReviewDocument } from "${prefix}/${components.slice(4)}/editor/review-codecs"\nconst host: EditorReviewHost = { viewer: null, visible: true, replyWhileReadonly: false, can: () => false }\nexport const view = <EditorReviewPreset host={host} ariaLabel="Review" />\nexport const document = parseReviewDocument({ root: { type: "root", children: [] } }, false)\n`,
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
            noEmit: true,
            paths: { [`${prefix}/*`]: ["./src/*"] },
          },
          include: ["src"],
        }),
      )
      await run(project, join(root, "node_modules/.bin/tsc"), "--noEmit")
      const installed = await readFile(join(project, "ui.json"), "utf8")
      await run(
        project,
        "node",
        cli,
        "update",
        "editor-review",
        "--registry",
        `${server.url}r`,
        "--dry-run",
      )
      expect(await readFile(join(project, "ui.json"), "utf8")).toBe(installed)
      await run(
        project,
        "node",
        cli,
        "update",
        "editor-review",
        "--registry",
        `${server.url}r`,
      )
      await run(project, join(root, "node_modules/.bin/tsc"), "--noEmit")
      await writeFile(
        join(results, `${layout}-ui.json`),
        await readFile(join(project, "ui.json")),
      )
    }
  } finally {
    await server.stop(true)
    await writeFile(join(results, "consumer-directory.txt"), `${directory}\n`)
  }
}, 240000)
