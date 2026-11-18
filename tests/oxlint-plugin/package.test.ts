import { expect, test } from "bun:test"
import { spawnSync } from "node:child_process"
import {
  mkdtempSync,
  mkdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"

const root = resolve(import.meta.dirname, "../..")

const packageRoot = join(root, "packages/oxlint-plugin")

test("packed plugin runs through its public Node export in a consumer", () => {
  const directory = mkdtempSync(join(tmpdir(), "yopem-oxlint-package-"))
  const archive = join(directory, "plugin.tgz")
  const consumer = join(directory, "consumer")
  const logs: string[] = []

  function run(command: string, args: string[], cwd: string) {
    const result = spawnSync(command, args, {
      cwd,
      encoding: "utf8",
      timeout: 120_000,
    })

    logs.push(
      `$ ${command} ${args.join(" ")}\ncwd: ${cwd}\nstatus: ${result.status}\nsignal: ${result.signal}\nerror: ${result.error?.message ?? "none"}\n${result.stdout ?? ""}${result.stderr ?? ""}`,
    )

    return result
  }

  try {
    const pack = run("bun", ["pm", "pack", "--filename", archive], packageRoot)
    expect(pack.status, logs.at(-1)).toBe(0)

    mkdirSync(consumer)
    writeFileSync(
      join(consumer, "package.json"),
      JSON.stringify({
        name: "oxlint-package-smoke",
        private: true,
        type: "module",
      }),
    )

    const install = run(
      "npm",
      [
        "install",
        "--offline",
        "--ignore-scripts",
        "--legacy-peer-deps",
        "--no-audit",
        "--no-fund",
        archive,
      ],
      consumer,
    )

    expect(install.status, logs.at(-1)).toBe(0)

    symlinkSync(
      join(root, "node_modules/oxlint"),
      join(consumer, "node_modules/oxlint"),
      "dir",
    )

    const nodeCheck = run(
      "node",
      [
        "--input-type=module",
        "--eval",
        'import plugin from "@yopem-ui/oxlint-plugin"; const path = import.meta.resolve("@yopem-ui/oxlint-plugin"); if (!path.endsWith("/dist/index.js") || !plugin.rules["enforce-styling-methods"]) process.exit(1); process.stdout.write(path)',
      ],
      consumer,
    )

    expect(nodeCheck.status, logs.at(-1)).toBe(0)
    expect(nodeCheck.stdout).toContain(
      "/node_modules/@yopem-ui/oxlint-plugin/dist/index.js",
    )

    const config = JSON.stringify({
      jsPlugins: [{ name: "yopem-ui", specifier: "@yopem-ui/oxlint-plugin" }],
      categories: { correctness: "off" },
      rules: { "yopem-ui/enforce-styling-methods": "error" },
    })

    writeFileSync(join(consumer, "oxlint.json"), config)
    logs.push(`config: ${config}`)

    const fixtures = [
      {
        name: "clean.tsx",
        source:
          'import { Button } from "@/components/ui/button"; export const view = <Button className="custom" />;',
        status: 0,
      },
      {
        name: "rejected.tsx",
        source:
          'import { Button } from "@/components/ui/button"; export const view = <Button css={{ color: "red" }} />;',
        status: 1,
      },
    ]

    for (const fixture of fixtures) {
      writeFileSync(join(consumer, fixture.name), fixture.source)
      logs.push(`${fixture.name}: ${fixture.source}`)

      const result = run(
        "node",
        [
          "node_modules/oxlint/bin/oxlint",
          "--config",
          "oxlint.json",
          fixture.name,
        ],
        consumer,
      )

      expect(result.status, logs.at(-1)).toBe(fixture.status)

      if (fixture.status === 1) {
        expect(result.stdout + result.stderr).toContain(
          "enforce-styling-methods",
        )
      }
    }
  } finally {
    const artifact = join(root, "docs/validation/oxlint-plugin-package.log")
    mkdirSync(join(root, "docs/validation"), { recursive: true })
    writeFileSync(artifact, logs.join("\n\n") + "\n")
    rmSync(directory, { recursive: true, force: true })
  }
}, 180_000)
