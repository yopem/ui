import { afterAll, beforeAll, expect, test } from "bun:test"
import { spawnSync } from "node:child_process"
import {
  appendFileSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"

const root = resolve(import.meta.dirname, "../../..")

let registryServer: Bun.Server<undefined> | undefined

beforeAll(async () => {
  const active = await fetch("http://localhost:3100/r/base.json").then(
    (response) => response.ok,
    () => false,
  )

  if (active) return

  registryServer = Bun.serve({
    hostname: "localhost",
    port: 3100,
    async fetch(request) {
      const name = new URL(request.url).pathname.match(
        /^\/r\/([a-z0-9-]+)\.json$/,
      )?.[1]

      if (!name) return new Response("Not found", { status: 404 })

      const file = Bun.file(
        join(root, "packages/registry/dist/r", `${name}.json`),
      )

      return (await file.exists())
        ? new Response(file)
        : new Response("Not found", { status: 404 })
    },
  })
})

afterAll(() => {
  registryServer?.stop(true)
})

test("packed CLI installs from local registry and runs published lint plugin", async () => {
  const response = await fetch("http://localhost:3100/r/base.json")
  expect(response.ok).toBe(true)
  const directory = mkdtempSync(join(tmpdir(), "yopem-public-cli-"))
  const project = join(directory, "project")
  const logs: string[] = []

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

    const output = `${stdout}${stderr}`
    logs.push(`${args.join(" ")}\n${output}`)
    expect(status, output).toBe(0)
  }

  try {
    for (const name of ["cli", "oxlint-plugin"]) {
      await run(
        join(root, "packages", name),
        "bun",
        "pm",
        "pack",
        "--destination",
        directory,
      )
    }

    for (const archive of readdirSync(directory).filter((name) =>
      name.endsWith(".tgz"),
    )) {
      const manifest = spawnSync(
        "tar",
        ["-xOf", join(directory, archive), "package/package.json"],
        { encoding: "utf8" },
      )

      expect(manifest.status, `${archive}: ${manifest.stderr}`).toBe(0)
      expect(manifest.stdout).not.toContain("catalog:")
    }

    mkdirSync(join(project, "src"), { recursive: true })
    writeFileSync(
      join(project, "package.json"),
      JSON.stringify({
        name: "yopem-public-cli-test",
        private: true,
        type: "module",
        dependencies: {
          vite: "^8.3.1",
          react: "^19.3.0",
          "react-dom": "^19.3.0",
        },
        scripts: { lint: "oxlint lint src" },
      }),
    )
    writeFileSync(join(project, "tsconfig.json"), "{}")
    writeFileSync(
      join(project, "vite.config.ts"),
      'export default { plugins: [], resolve: { alias: { "@": "./src" } } }',
    )
    writeFileSync(join(project, "src/main.tsx"), 'import React from "react"')
    await run(
      project,
      "bun",
      "add",
      "-d",
      ...readdirSync(directory)
        .filter((name) => name.endsWith(".tgz"))
        .map((name) => join(directory, name)),
    )
    await run(project, "bunx", "yopem-ui", "init", "--framework", "vite")
    await run(project, "bunx", "yopem-ui", "add", "button")
    const tokens = join(project, "src/styles/tokens.stylex.ts")
    appendFileSync(tokens, "\n")
    const edited = readFileSync(tokens, "utf8")
    await run(project, "bunx", "yopem-ui", "add", "box")
    await run(project, "bunx", "yopem-ui", "add", "container")

    for (const name of [
      "highlight",
      "rating",
      "native-select",
      "clipboard",
      "link",
      "wrap",
      "text",
    ]) {
      await run(project, "bunx", "yopem-ui", "add", name)
      expect(
        readFileSync(join(project, `src/components/ui/${name}.tsx`), "utf8"),
      ).toContain("data-slot")
    }

    expect(
      readFileSync(join(project, "src/components/ui/container.tsx"), "utf8"),
    ).toContain("export function Container")
    await run(project, "bunx", "yopem-ui", "init", "--framework", "vite")
    expect(readFileSync(tokens, "utf8")).toBe(edited)
    await run(project, "bun", "run", "lint")
    writeFileSync(
      join(project, "src/invalid.tsx"),
      'import { Box } from "@/components/ui/box"\nexport const Invalid = <Box as="fake-tag" />',
    )

    const invalid = spawnSync("bun", ["run", "lint"], {
      cwd: project,
      encoding: "utf8",
    })

    logs.push(`invalid lint\n${invalid.stdout}${invalid.stderr}`)
    expect(invalid.status).toBe(1)
    expect(`${invalid.stdout}${invalid.stderr}`).toContain(
      "yopem-ui(valid-polymorphic-as)",
    )
    writeFileSync(
      join(project, "src/invalid.tsx"),
      'import { Text } from "@/components/ui/text"\nimport { tokens } from "@/styles/tokens.stylex"\nimport * as stylex from "@stylexjs/stylex"\nconst styles = stylex.create({ root: { color: tokens["--foreground"] } })\nexport const Invalid = <Text xstyle={styles.root}>Text</Text>',
    )

    const invalidText = spawnSync("bun", ["run", "lint"], {
      cwd: project,
      encoding: "utf8",
    })

    logs.push(`invalid Text lint\n${invalidText.stdout}${invalidText.stderr}`)
    expect(invalidText.status).toBe(1)
    expect(`${invalidText.stdout}${invalidText.stderr}`).toContain(
      "color cannot restyle Text",
    )
  } finally {
    mkdirSync(resolve(import.meta.dirname, "../test-results"), {
      recursive: true,
    })
    writeFileSync(
      resolve(import.meta.dirname, "../test-results/packaged-cli.log"),
      logs.join("\n\n"),
    )
    rmSync(directory, { recursive: true, force: true })
  }
}, 120_000)
