import { runCli } from "@cli/cli"
import { afterAll, beforeAll, expect, test } from "bun:test"
import { createHash } from "node:crypto"
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"

import { snapshot } from "./files"

const evidence: object[] = []

const packed = mkdtempSync(join(tmpdir(), "yopem-path-prompts-pack-"))

const results = resolve(import.meta.dirname, "../../test-results/cli")

let cli = ""

async function command(cwd: string, args: string[]) {
  const child = Bun.spawn(args, {
    cwd,
    stdin: "ignore",
    stdout: "pipe",
    stderr: "pipe",
    timeout: 40_000,
  })

  const [status, stdout, stderr] = await Promise.all([
    child.exited,
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
  ])

  evidence.push({ args, status, stdout, stderr })

  return { status, stdout, stderr }
}

beforeAll(async () => {
  const build = await command(
    resolve(import.meta.dirname, "../../packages/cli"),
    ["bun", "pm", "pack", "--destination", packed],
  )

  expect(build.status, build.stderr).toBe(0)
  const archive = readdirSync(packed).find((file) => file.endsWith(".tgz"))

  if (!archive) throw new Error("Missing CLI archive")
  writeFileSync(join(packed, "package.json"), '{"private":true}')
  const install = await command(packed, ["bun", "add", join(packed, archive)])
  expect(install.status, install.stderr).toBe(0)
  cli = join(packed, "node_modules/@yopem-ui/cli/dist/cli.js")
}, 120_000)

afterAll(() => {
  mkdirSync(results, { recursive: true })
  writeFileSync(
    join(results, "path-prompts.json"),
    JSON.stringify(evidence, null, 2),
  )
  rmSync(packed, { recursive: true, force: true })
})

function fixture(src = true, shared = false) {
  const root = mkdtempSync(join(tmpdir(), "yopem-path-prompts-"))

  function put(path: string, text: string) {
    mkdirSync(join(root, path, ".."), { recursive: true })
    writeFileSync(join(root, path), text)
  }

  put(
    "package.json",
    JSON.stringify({
      dependencies: { [src ? "vite" : "next"]: "*", react: "*" },
      ...(!src && { scripts: { dev: "next dev", build: "next build" } }),
      ...(shared && { workspaces: ["packages/*"] }),
    }),
  )
  put("tsconfig.json", "{}")
  put("vite.config.ts", "export default { plugins: [] }\n")
  put(
    src ? "src/main.tsx" : "app/layout.tsx",
    src
      ? 'import React from "react"\n'
      : "export default function Layout() { return <html><body>Hi</body></html> }\n",
  )

  if (shared) put("packages/ui/package.json", '{"name":"@acme/ui"}')
  const requests: string[] = []

  const files = [
    "components/example.ts",
    "components/ui/example.ts",
    "hooks/example.ts",
    "lib/example.ts",
    "styles/styles.css",
    "theme/example.ts",
  ]

  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    fetch(request) {
      requests.push(request.url)

      return Response.json({
        schemaVersion: 1,
        registryVersion: "1.0.0",
        type: "registry:lib",
        name: "base",
        title: "Base",
        description: "Base styles",
        categories: [],
        dependencies: [],
        devDependencies: [],
        peerDependencies: [],
        registryDependencies: [],
        files: files.map((path) => {
          const content = path.endsWith(".css") ? "@stylex;\n" : "export {}\n"

          return {
            path,
            target: `@/${path}`,
            type: "registry:lib",
            content,
            integrity: `sha256-${createHash("sha256").update(content).digest("base64")}`,
          }
        }),
      })
    },
  })

  return {
    root,
    put,
    requests,
    url: `${server.url}r`,
    async dispose() {
      await server.stop(true)
      rmSync(root, { recursive: true, force: true })
    },
  }
}

const pty = `import errno, json, os, pty, select, signal, subprocess, sys, time
master, slave = pty.openpty()
child = subprocess.Popen(sys.argv[2:], stdin=slave, stdout=slave, stderr=slave)
os.close(slave)
steps = json.loads(sys.argv[1])
output = bytearray()
pending = bytearray()
deadline = time.monotonic() + 25
while time.monotonic() < deadline:
    ready, _, _ = select.select([master], [], [], 0.1)
    if ready:
        try:
            data = os.read(master, 65536)
        except OSError as error:
            if error.errno == errno.EIO: break
            raise
        if not data: break
        output.extend(data)
        pending.extend(data)
        if steps and steps[0][0].encode() in pending:
            _, answer = steps.pop(0)
            pending.clear()
            if answer == 'SIGINT': child.send_signal(signal.SIGINT)
            else: os.write(master, b'\\x04' if answer == 'EOF' else (answer + '\\n').encode())
    if child.poll() is not None and not ready: break
else:
    child.kill()
    child.wait()
    sys.stdout.buffer.write(output)
    sys.exit(124)
os.close(master)
sys.stdout.buffer.write(output)
sys.exit(child.wait())
`

function interactive(
  project: ReturnType<typeof fixture>,
  steps: string[][],
  extra: string[] = [],
) {
  return command(project.root, [
    "python3",
    "-c",
    pty,
    JSON.stringify(steps),
    "node",
    cli,
    "init",
    "--registry",
    project.url,
    ...extra,
  ])
}

for (const answer of ["", "n", "no"]) {
  test(`TTY directory opt-in decline ${JSON.stringify(answer)} keeps defaults`, async () => {
    const project = fixture()
    const before = snapshot(project.root)

    try {
      const result = await interactive(
        project,
        [["Customize directories", answer]],
        ["--guidance", "none", "--dry-run"],
      )

      expect(result.status, result.stdout + result.stderr).toBe(0)
      expect(result.stdout).toContain(
        join(project.root, "src/styles/styles.css"),
      )
      expect(result.stdout).not.toContain("components [")
      expect(snapshot(project.root)).toEqual(before)
    } finally {
      await project.dispose()
    }
  })
}

for (const src of [true, false]) {
  test(`TTY accepts six detected defaults, src=${src}`, async () => {
    const project = fixture(src)
    const before = snapshot(project.root)
    const prefix = src ? "src/" : ""

    try {
      const result = await interactive(
        project,
        [
          ["Customize directories", "yes"],
          ...["components", "ui", "hooks", "lib", "styles", "theme"].map(
            (key) => [`${key} [`, ""],
          ),
        ],
        ["--guidance", "none", "--dry-run"],
      )

      expect(result.status, result.stdout + result.stderr).toBe(0)

      for (const path of [
        "components",
        "components/ui",
        "hooks",
        "lib",
        "styles",
        "themes",
      ])
        expect(result.stdout).toContain(`[${prefix}${path}]`)
      expect(result.stdout).toContain(
        join(project.root, `${prefix}styles/styles.css`),
      )
      expect(snapshot(project.root)).toEqual(before)
    } finally {
      await project.dispose()
    }
  })
}

test("TTY validates custom paths then accepts six replacements", async () => {
  const project = fixture()
  const before = snapshot(project.root)

  try {
    const result = await interactive(
      project,
      [
        ["Customize directories", "y"],
        ["components [", "../outside"],
        ["components [", "custom/components"],
        ...["ui", "hooks", "lib", "styles", "theme"].map((key) => [
          `${key} [`,
          `custom/${key}`,
        ]),
      ],
      ["--guidance", "none", "--dry-run"],
    )

    expect(result.status, result.stdout + result.stderr).toBe(0)

    for (const key of ["components", "ui", "hooks", "lib", "styles", "theme"])
      expect(result.stdout).toContain(join(project.root, `custom/${key}/`))
    expect(snapshot(project.root)).toEqual(before)
  } finally {
    await project.dispose()
  }
})

test("TTY uses existing path overrides as defaults", async () => {
  const project = fixture()
  project.put(
    "ui.json",
    JSON.stringify({
      version: 1,
      paths: { styles: "design/styles", ui: "design/ui" },
      files: {},
    }),
  )
  const before = snapshot(project.root)

  try {
    const result = await interactive(
      project,
      [
        ["Customize directories", "yes"],
        ...["components", "ui", "hooks", "lib", "styles", "theme"].map(
          (key) => [`${key} [`, ""],
        ),
      ],
      ["--guidance", "none", "--dry-run"],
    )

    expect(result.status, result.stdout + result.stderr).toBe(0)
    expect(result.stdout).toContain("ui [design/ui]")
    expect(result.stdout).toContain("styles [design/styles]")
    expect(result.stdout).toContain(
      join(project.root, "design/styles/styles.css"),
    )
    expect(snapshot(project.root)).toEqual(before)
  } finally {
    await project.dispose()
  }
})

test("TTY detects defaults at shared UI target, not app", async () => {
  const project = fixture(true, true)
  const before = snapshot(project.root)

  try {
    const result = await interactive(
      project,
      [
        ["Customize directories", "yes"],
        ...["components", "ui", "hooks", "lib", "styles", "theme"].map(
          (key) => [`${key} [`, ""],
        ),
      ],
      ["--ui", "packages/ui", "--guidance", "none", "--dry-run"],
    )

    expect(result.status, result.stdout + result.stderr).toBe(0)
    expect(result.stdout).toContain("ui [components/ui]")
    expect(result.stdout).toContain(
      join(project.root, "packages/ui/styles/styles.css"),
    )
    expect(snapshot(project.root)).toEqual(before)
  } finally {
    await project.dispose()
  }
})

for (const stop of ["EOF", "SIGINT"]) {
  for (const stage of ["opt-in", "paths"]) {
    test(`TTY ${stop} cancels ${stage} without requests or writes`, async () => {
      const project = fixture()
      const before = snapshot(project.root)

      try {
        const steps =
          stage === "opt-in"
            ? [["Customize directories", stop]]
            : [
                ["Customize directories", "yes"],
                ["components [", "custom/components"],
                ["ui [", stop],
              ]

        const result = await interactive(project, steps, ["--guidance", "none"])
        expect(result.status, result.stdout + result.stderr).toBe(1)
        expect(project.requests).toEqual([])
        expect(snapshot(project.root)).toEqual(before)
      } finally {
        await project.dispose()
      }
    })
  }
}

test("noninteractive and programmatic init preserve supplied paths without prompts", async () => {
  const project = fixture()
  const before = snapshot(project.root)

  try {
    const result = await command(project.root, [
      "node",
      cli,
      "init",
      "--dry-run",
      "--registry",
      project.url,
    ])

    expect(result.status, result.stderr).toBe(0)
    expect(result.stdout).not.toContain("Customize directories")

    const direct = await runCli(["init", "--dry-run"], {
      cwd: project.root,
      registryUrl: project.url,
      paths: { styles: "custom/styles" },
    })

    expect(
      direct?.preview?.files.some(
        (file) => file.path === join(project.root, "custom/styles/styles.css"),
      ),
    ).toBe(true)
    expect(snapshot(project.root)).toEqual(before)
  } finally {
    await project.dispose()
  }
})
