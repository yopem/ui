import { expect, test } from "@playwright/test"
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

const root = resolve(import.meta.dirname, "../..")

test("packed CLI installs from local registry and runs published lint plugin", async ({
  request,
}) => {
  const response = await request.get("http://localhost:3100/r/base.json")
  expect(response.ok()).toBe(true)
  const directory = mkdtempSync(join(tmpdir(), "yopem-public-cli-"))
  const project = join(directory, "project")
  const logs: string[] = []

  function run(cwd: string, ...args: string[]) {
    const result = spawnSync(args[0]!, args.slice(1), {
      cwd,
      encoding: "utf8",
      timeout: 120_000,
    })
    const output = `${result.stdout}${result.stderr}`
    logs.push(`${args.join(" ")}\n${output}`)
    expect(result.status, output).toBe(0)
  }

  try {
    for (const name of ["cli", "oxlint-plugin"]) {
      run(
        join(root, "packages", name),
        "bun",
        "pm",
        "pack",
        "--destination",
        directory,
      )
    }
    const license = readFileSync(join(root, "LICENSE"), "utf8")
    for (const archive of readdirSync(directory).filter((name) =>
      name.endsWith(".tgz"),
    )) {
      const contents = spawnSync(
        "tar",
        ["-xOf", join(directory, archive), "package/LICENSE"],
        {
          encoding: "utf8",
        },
      )
      expect(contents.status, `${archive}: ${contents.stderr}`).toBe(0)
      expect(contents.stdout).toBe(license)
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
    run(
      project,
      "bun",
      "add",
      "-d",
      ...readdirSync(directory)
        .filter((name) => name.endsWith(".tgz"))
        .map((name) => join(directory, name)),
    )
    run(project, "bunx", "yopem-ui", "init", "--framework", "vite")
    run(project, "bunx", "yopem-ui", "add", "button")
    const tokens = join(project, "src/styles/tokens.stylex.ts")
    appendFileSync(tokens, "\n")
    const edited = readFileSync(tokens, "utf8")
    run(project, "bunx", "yopem-ui", "add", "box")
    run(project, "bunx", "yopem-ui", "add", "container")
    expect(
      readFileSync(join(project, "src/components/ui/container.tsx"), "utf8"),
    ).toContain("export function Container")
    run(project, "bunx", "yopem-ui", "init", "--framework", "vite")
    expect(readFileSync(tokens, "utf8")).toBe(edited)
    run(project, "bun", "run", "lint")
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
  } finally {
    writeFileSync(
      join(root, "test-results/packaged-cli.log"),
      logs.join("\n\n"),
    )
    await test.info().attach("packaged-cli.log", {
      body: logs.join("\n\n"),
      contentType: "text/plain",
    })
    rmSync(directory, { recursive: true, force: true })
  }
})
