import { registryItemSchema } from "@registry/schema"
import { expect, test } from "bun:test"
import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { z } from "zod"

const root = resolve(import.meta.dirname, "../..")

test("packed Codeblock includes its keyboard scroll dependency", async () => {
  const directory = await mkdtemp(join(tmpdir(), "yopem-codeblock-"))
  const results = join(root, "test-results/cli/codeblock")
  const logs: string[] = []
  await mkdir(results, { recursive: true })
  await mkdir(join(directory, "src"), { recursive: true })

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

    logs.push(`${args.join(" ")}\nexit: ${status}\n${stdout}${stderr}`)
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
        name: "codeblock-consumer",
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
    )
    await run(
      directory,
      "bunx",
      "yopem-ui",
      "add",
      "codeblock",
      "--registry",
      `${server.url}r`,
    )

    const codeblock = registryItemSchema.parse(
      await Bun.file(
        join(root, "packages/registry/dist/r/codeblock.json"),
      ).json(),
    )

    const scrollArea = registryItemSchema.parse(
      await Bun.file(
        join(root, "packages/registry/dist/r/scroll-area.json"),
      ).json(),
    )

    expect(codeblock.registryDependencies).toContain("scroll-area")

    for (const file of [...codeblock.files, ...scrollArea.files])
      expect(
        await Bun.file(
          join(directory, file.target.replace("@/", "src/")),
        ).exists(),
      ).toBe(true)
    await writeFile(
      join(directory, "src/check.tsx"),
      `import { Codeblock } from "@/components/ui/codeblock"
export const preview = <Codeblock>{"const ready = true"}</Codeblock>
`,
    )
    await writeFile(
      join(directory, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          target: "ES2022",
          module: "ESNext",
          moduleResolution: "Bundler",
          jsx: "react-jsx",
          strict: true,
          skipLibCheck: true,
          noEmit: true,
          types: ["react", "react-dom"],
          paths: { "@/*": ["./src/*"] },
        },
        include: ["src"],
      }),
    )
    await run(directory, "bunx", "tsc", "--noEmit")
    await run(
      directory,
      "bunx",
      "yopem-ui",
      "update",
      "codeblock",
      "--registry",
      `${server.url}r`,
    )
    await run(directory, "bunx", "tsc", "--noEmit")
  } finally {
    await server.stop(true)
    await writeFile(join(results, "packed-consumer.log"), logs.join("\n\n"))
    await rm(directory, { recursive: true, force: true })
  }
}, 240000)
