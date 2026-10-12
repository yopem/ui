import { expect, test } from "bun:test"
import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import {
  chmodSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"

import type { JsonValue } from "@/install"

import { isRecord, isString } from "@/install"

const cliRoot = resolve(import.meta.dirname, "..")

function command(
  command: string,
  args: string[],
  cwd: string,
  env = process.env,
) {
  const result = spawnSync(command, args, {
    cwd,
    env,
    encoding: "utf8",
    timeout: 120_000,
  })

  expect(
    result.status,
    `${command} ${args.join(" ")}\ncwd: ${cwd}\nPATH: ${env.PATH ?? ""}\nstatus: ${result.status}\nsignal: ${result.signal}\nerror: ${result.error?.message ?? "none"}\n${result.stdout ?? ""}${result.stderr ?? ""}`,
  ).toBe(0)

  return result.stdout
}

test("command reports real process failures", () => {
  expect(
    command(process.execPath, ["-e", 'process.stdout.write("ok")'], cliRoot),
  ).toBe("ok")
  expect(() =>
    command(
      process.execPath,
      ["-e", 'process.stderr.write("failed"); process.exit(7)'],
      cliRoot,
    ),
  ).toThrow(/status: 7[\s\S]*failed/)
  expect(() =>
    command("yopem-missing-executable", [], cliRoot, { PATH: "" }),
  ).toThrow(/yopem-missing-executable[\s\S]*(ENOENT|Executable not found)/)
  expect(() =>
    command(
      process.execPath,
      ["-e", 'process.kill(process.pid, "SIGTERM")'],
      cliRoot,
    ),
  ).toThrow(/signal: SIGTERM/)
})

test("packed CLI runs on Node without Bun and installs through every manager", async () => {
  const root = mkdtempSync(join(tmpdir(), "yopem node &-"))
  const logs: string[] = []

  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    fetch() {
      const content = "export const sample = 1\n"

      return Response.json({
        schemaVersion: 1,
        title: "Sample",
        description: "Sample",
        categories: [],
        peerDependencies: [],
        name: "sample",
        type: "registry:ui",
        registryVersion: "1",
        files: [
          {
            path: "lib/sample.ts",
            target: "@/lib/sample.ts",
            type: "registry:lib",
            content,
            integrity: `sha256-${createHash("sha256").update(content).digest("base64")}`,
          },
        ],
        dependencies: ["is-number@^7.0.0"],
        devDependencies: ["is-odd@^3.0.1"],
        registryDependencies: [],
      })
    },
  })

  try {
    logs.push(command("bun", ["pm", "pack", "--destination", root], cliRoot))
    command(
      "tar",
      ["-xzf", join(root, "yopem-ui-cli-0.1.3.tgz"), "-C", root],
      root,
    )

    const manifest: JsonValue = JSON.parse(
      readFileSync(join(root, "package/package.json"), "utf8"),
    )

    if (
      !isRecord(manifest) ||
      !isRecord(manifest.bin) ||
      !isRecord(manifest.engines) ||
      !isString(manifest.version)
    )
      throw new Error("Invalid packed package manifest")

    expect(manifest.bin["yopem-ui"]).toBe("./dist/cli.js")
    expect(manifest.engines.bun).toBeUndefined()
    command(
      "npm",
      ["install", "--ignore-scripts", "--no-audit", "--no-fund"],
      join(root, "package"),
    )
    const consumer = join(root, "consumer")
    mkdirSync(join(consumer, "node_modules/@yopem-ui"), { recursive: true })
    symlinkSync(
      join(root, "package"),
      join(consumer, "node_modules/@yopem-ui/cli"),
    )
    writeFileSync(
      join(consumer, "package.json"),
      JSON.stringify({ type: "module" }),
    )
    writeFileSync(
      join(consumer, "index.ts"),
      `import { installItem, type InstallOptions } from "@yopem-ui/cli/install"
import { initProject } from "@yopem-ui/cli/init"
import { packageRunner } from "@yopem-ui/cli/project"
import { runCli } from "@yopem-ui/cli/cli"
const options: InstallOptions = { dryRun: true }
void installItem("sample", options)
void initProject(options)
void packageRunner(".")
void runCli(["--help"], options)
`,
    )
    logs.push(
      command(
        resolve(cliRoot, "../../node_modules/.bin/tsc"),
        [
          "--noEmit",
          "--strict",
          "--module",
          "nodenext",
          "--target",
          "esnext",
          "index.ts",
        ],
        consumer,
      ),
    )

    const bin = join(root, "bin")
    mkdirSync(bin)
    const node = command("which", ["node"], root).trim()

    const importSource = `import { runCli } from ${JSON.stringify(pathToFileURL(join(root, "package/dist/cli.js")).href)}
if (typeof runCli !== "function") throw new Error("Missing runCli export")
`

    expect(
      command(
        node,
        [
          "--input-type=module",
          "--eval",
          importSource,
          "--",
          "unrelated-argument",
        ],
        root,
      ),
    ).toBe("")
    symlinkSync(node, join(bin, "node"))

    for (const manager of ["bun", "npm", "pnpm", "yarn"]) {
      const project = join(root, manager)
      mkdirSync(project)
      writeFileSync(
        join(project, "package.json"),
        JSON.stringify({
          name: `test-${manager}`,
          private: true,
          packageManager: `${manager}@1.0.0`,
        }),
      )
      writeFileSync(
        join(bin, manager),
        '#!/bin/sh\nprintf "%s\\n" "$PWD" "$@" >> "$CLI_COMMAND_LOG"\nexit "${CLI_COMMAND_EXIT:-0}"\n',
      )
      chmodSync(join(bin, manager), 0o755)
      const output = join(project, "commands.log")

      const env: NodeJS.ProcessEnv = {
        ...process.env,
        PATH: bin,
        CLI_COMMAND_LOG: output,
      }

      const entry = join(root, "package/dist/cli.js")
      expect(
        command(process.execPath, [entry, "--version"], project, {
          ...env,
          PATH: "",
        }).trim(),
      ).toBe(manifest.version)

      const help = command(node, [entry, "--help"], project, env)
      expect(help).toContain("Usage:")
      expect(command(node, [entry, "--version"], project, env).trim()).toBe(
        manifest.version,
      )

      async function invoke(...args: string[]) {
        const child = Bun.spawn(
          [
            node,
            entry,
            ...args,
            "--registry",
            `http://127.0.0.1:${server.port}/r`,
          ],
          { cwd: project, env, stdout: "pipe", stderr: "pipe" },
        )

        const [status, stdout, stderr] = await Promise.all([
          child.exited,
          new Response(child.stdout).text(),
          new Response(child.stderr).text(),
        ])

        logs.push(
          `${manager}: ${args.join(" ")}\nexit: ${status}\n${stdout}${stderr}`,
        )
        expect(status, stderr).toBe(0)

        return stdout
      }

      expect(await invoke("add", "sample", "--dry-run")).toContain(
        "No files written",
      )
      expect(() => readFileSync(output)).toThrow()
      await invoke("add", "sample")
      expect(readFileSync(output, "utf8").trim().split("\n")).toEqual([
        project,
        manager === "npm" ? "install" : "add",
        "is-number@^7.0.0",
        project,
        manager === "npm" ? "install" : "add",
        manager === "bun" ? "-d" : "-D",
        "is-odd@^3.0.1",
      ])
      logs.push(readFileSync(output, "utf8"))
      const argument = 'space & "quote"'

      const runner = pathToFileURL(join(root, "package/dist/project.js")).href

      const script = `import { packageRunner } from ${JSON.stringify(runner)}; const run = await packageRunner(${JSON.stringify(project)}); await run(["add", ${JSON.stringify(argument)}], ${JSON.stringify(project)});`
      command(node, ["--input-type=module", "-e", script], project, env)
      expect(readFileSync(output, "utf8").trim().split("\n").at(-1)).toBe(
        argument,
      )

      writeFileSync(
        join(project, "package.json"),
        JSON.stringify({
          name: `test-${manager}`,
          private: true,
          dependencies: { "is-number": "^7.0.0" },
          devDependencies: { "is-odd": "^3.0.1" },
        }),
      )
      const before = readFileSync(output, "utf8")
      await invoke("update", "sample")
      expect(readFileSync(output, "utf8")).toBe(before)
      rmSync(output)

      if (manager !== "bun") {
        env.npm_config_user_agent = `${manager}/1.0.0 node/v24.2.0`
        writeFileSync(
          join(project, "package.json"),
          JSON.stringify({ name: `test-${manager}`, private: true }),
        )
        await invoke("add", "sample")
        expect(readFileSync(output, "utf8")).toContain(
          manager === "npm" ? "install" : "add",
        )
      }
    }

    const realBin = join(root, "real-bin")
    mkdirSync(realBin)

    for (const tool of ["node", "npm", "pnpm", "yarn"]) {
      const executable = Bun.which(tool)

      if (!executable) throw new Error(`Required executable not found: ${tool}`)
      symlinkSync(realpathSync(executable), join(realBin, tool))
    }

    const realEnv = {
      ...process.env,
      PATH: `${realBin}:/usr/bin:/bin`,
      COREPACK_ENABLE_PROJECT_SPEC: "0",
      YARN_CACHE_FOLDER: join(root, "yarn-cache"),
    }

    expect(Bun.which("bun", { PATH: realEnv.PATH })).toBeNull()

    for (const tool of ["node", "npm", "pnpm", "yarn"]) {
      logs.push(
        `${tool}: ${command(tool, ["--version"], root, realEnv).trim()}`,
      )
    }

    for (const manager of ["npm", "pnpm", "yarn"]) {
      const project = join(root, `real-${manager}`)
      mkdirSync(project)
      writeFileSync(
        join(project, "package.json"),
        JSON.stringify({ name: `real-${manager}`, private: true }),
      )

      const env = realEnv

      const archive = join(root, "yopem-ui-cli-0.1.3.tgz")
      logs.push(
        command(
          manager,
          [manager === "npm" ? "install" : "add", "--ignore-scripts", archive],
          project,
          env,
        ),
      )
      const entry = join(project, "node_modules/.bin/yopem-ui")
      expect(command(entry, ["--help"], project, env)).toContain("Usage:")

      const child = Bun.spawn(
        [
          entry,
          "add",
          "sample",
          "--registry",
          `http://127.0.0.1:${server.port}/r`,
        ],
        { cwd: project, env, stdout: "pipe", stderr: "pipe" },
      )

      const [status, stdout, stderr] = await Promise.all([
        child.exited,
        new Response(child.stdout).text(),
        new Response(child.stderr).text(),
      ])

      logs.push(`real ${manager}: exit ${status}\n${stdout}${stderr}`)
      expect(status, stderr).toBe(0)

      const installed = JSON.parse(
        readFileSync(join(project, "package.json"), "utf8"),
      )

      expect(installed.dependencies["is-number"]).toBe("^7.0.0")
      expect(installed.devDependencies["is-odd"]).toBe("^3.0.1")
      expect(readFileSync(join(project, "src/lib/sample.ts"), "utf8")).toBe(
        "export const sample = 1\n",
      )
    }
  } finally {
    await server.stop(true)
    mkdirSync(join(cliRoot, "test-results"), { recursive: true })
    writeFileSync(
      join(cliRoot, "test-results/node-packed.log"),
      logs.join("\n\n"),
    )
    rmSync(root, { recursive: true, force: true })
  }
}, 240_000)
