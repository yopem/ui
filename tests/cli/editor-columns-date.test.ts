import { installItem } from "@cli/install"
import { expect, test } from "bun:test"
import { mkdir, mkdtemp, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { z } from "zod"

const root = resolve(import.meta.dirname, "../..")

for (const shared of [false, true])
  for (const custom of [false, true])
    test(`columns/date install: shared=${shared}, custom=${custom}`, async () => {
      const directory = await mkdtemp(join(tmpdir(), "yopem-columns-date-"))
      const components = custom ? "src/widgets" : "src/components"
      const prefix = shared ? "@acme/ui" : "@"
      const logs: string[] = []
      await mkdir(join(directory, "src"), { recursive: true })
      await writeFile(
        join(directory, "package.json"),
        JSON.stringify({
          name: shared ? prefix : "consumer",
          private: true,
          type: "module",
        }),
      )
      await writeFile(
        join(directory, "ui.json"),
        JSON.stringify({
          version: 1,
          files: {},
          sourceRoot: "src",
          importPrefix: prefix,
          paths: {
            components,
            ui: custom ? "src/controls" : "src/components/ui",
          },
        }),
      )

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
        for (const feature of ["columns", "date"]) {
          await installItem(`editor-${feature}`, {
            cwd: directory,
            registryUrl: `${server.url}r`,
            async run(args) {
              const child = Bun.spawn(args, {
                cwd: directory,
                stdout: "pipe",
                stderr: "pipe",
              })

              const [status, stdout, stderr] = await Promise.all([
                child.exited,
                new Response(child.stdout).text(),
                new Response(child.stderr).text(),
              ])

              logs.push(`${args.join(" ")}\n${stdout}${stderr}`)
              expect(status, stderr).toBe(0)
            },
          })

          expect(
            await Bun.file(
              join(directory, components, "editor/dom.ts"),
            ).exists(),
          ).toBe(true)

          for (const suffix of [
            ".ts",
            "-model.ts",
            "-extension.ts",
            "-controls.tsx",
            feature === "date" ? "-node.tsx" : "-node.ts",
          ])
            expect(
              await Bun.file(
                join(directory, components, `editor/${feature}${suffix}`),
              ).exists(),
            ).toBe(true)
        }

        if (shared) {
          const manifest = z
            .object({ exports: z.record(z.string(), z.string()) })
            .parse(await Bun.file(join(directory, "package.json")).json())

          for (const feature of ["columns", "date"])
            for (const suffix of [
              "",
              "-model",
              "-extension",
              "-controls",
              "-node",
            ])
              expect(
                manifest.exports[
                  `./${components.slice(4)}/editor/${feature}${suffix}`
                ],
              ).toBeDefined()
        }
      } finally {
        const results = join(root, "test-results/cli/editor-columns-date")
        await mkdir(results, { recursive: true })
        await writeFile(
          join(results, `${shared}-${custom}.log`),
          `${directory}\n${logs.join("\n")}`,
        )
        await server.stop(true)
      }
    }, 360000)
