import { afterAll, beforeAll, expect, test } from "bun:test"
import { createHash } from "node:crypto"
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import * as ts from "typescript-api"

import { runCli } from "@/cli"
import { initProject } from "@/init"

import { snapshot } from "./files"

const begin = "<!-- BEGIN:yopem-ui-design -->"

const end = "<!-- END:yopem-ui-design -->"

const evidence: object[] = []

const results = resolve(import.meta.dirname, "../test-results")

const packageRoot = resolve(import.meta.dirname, "..")

const packedRoot = mkdtempSync(join(tmpdir(), "yopem-guidance-packed-"))

let packedCli = ""

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "yopem-guidance-"))
  const calls: { args: string[]; cwd: string }[] = []
  const requests: string[] = []
  const content = "@stylex;\n"

  const base = {
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
    files: [
      {
        path: "styles/styles.css",
        target: "@/styles/styles.css",
        type: "registry:lib",
        content,
        integrity: `sha256-${createHash("sha256").update(content).digest("base64")}`,
      },
    ],
  }

  function put(path: string, text: string) {
    mkdirSync(join(root, path, ".."), { recursive: true })
    writeFileSync(join(root, path), text)
  }

  put(
    "package.json",
    JSON.stringify({ dependencies: { vite: "*", react: "*" } }),
  )
  put("tsconfig.json", "{}")
  put("vite.config.ts", "export default { plugins: [] }\n")
  put("src/main.tsx", 'import React from "react"\n')

  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    fetch(request) {
      requests.push(new URL(request.url).pathname)

      return Response.json(base)
    },
  })

  const options = {
    cwd: root,
    registryUrl: `${server.url}r`,
    run(args: string[], cwd: string) {
      calls.push({ args, cwd })

      return Promise.resolve()
    },
  }

  async function dispose() {
    await server.stop(true)
    rmSync(root, { recursive: true, force: true })
  }

  return { root, calls, requests, put, options, dispose }
}

async function command(cwd: string, args: string[], input?: string) {
  const child = Bun.spawn(args, {
    cwd,
    stdin: input === undefined ? "ignore" : new Blob([input]),
    stdout: "pipe",
    stderr: "pipe",
    timeout: 60_000,
  })

  const [status, stdout, stderr] = await Promise.all([
    child.exited,
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
  ])

  evidence.push({ cwd, args, status, stdout, stderr })

  return { status, stdout, stderr }
}

beforeAll(async () => {
  const pack = await command(packageRoot, [
    "bun",
    "pm",
    "pack",
    "--destination",
    packedRoot,
  ])

  expect(pack.status, pack.stderr).toBe(0)
  const archive = readdirSync(packedRoot).find((name) => name.endsWith(".tgz"))

  if (!archive) throw new Error("Missing packed CLI archive")
  writeFileSync(join(packedRoot, "package.json"), '{"private":true}')

  const install = await command(packedRoot, [
    "bun",
    "add",
    join(packedRoot, archive),
  ])

  expect(install.status, install.stderr).toBe(0)
  packedCli = join(packedRoot, "node_modules/@yopem-ui/cli/dist/cli.js")
  expect(existsSync(packedCli)).toBe(true)
}, 120_000)

afterAll(() => {
  mkdirSync(results, { recursive: true })
  writeFileSync(
    join(results, "guidance.json"),
    `${JSON.stringify(evidence, null, 2)}\n`,
  )
  rmSync(packedRoot, { recursive: true, force: true })
})

function block(text: string) {
  expect(text.split(begin)).toHaveLength(2)
  expect(text.split(end)).toHaveLength(2)
  const start = text.indexOf(begin)
  const finish = text.indexOf(end) + end.length
  expect(finish).toBeGreaterThan(start)

  return text.slice(start, finish)
}

function sourceValue(file: string, root: string, ...keys: string[]) {
  const source = ts.createSourceFile(
    file,
    readFileSync(resolve(packageRoot, "../registry/src", file), "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )

  const declaration = source.statements
    .flatMap((statement) =>
      ts.isVariableStatement(statement)
        ? [...statement.declarationList.declarations]
        : [],
    )
    .find((item) => ts.isIdentifier(item.name) && item.name.text === root)

  let value = declaration?.initializer

  if (value && ts.isCallExpression(value)) value = value.arguments[0]

  for (const key of keys) {
    if (!value || !ts.isObjectLiteralExpression(value))
      throw new Error(`Expected object at ${file}: ${root}.${key}`)

    const property = value.properties.find(
      (item) =>
        ts.isPropertyAssignment(item) &&
        (ts.isIdentifier(item.name) || ts.isStringLiteral(item.name)) &&
        item.name.text === key,
    )

    if (!property) return undefined

    if (!ts.isPropertyAssignment(property))
      throw new Error(`Expected property at ${file}: ${root}.${key}`)
    value = property.initializer
  }

  if (value && ts.isStringLiteral(value)) return value.text

  if (value && ts.isNumericLiteral(value)) return Number(value.text)

  throw new Error(`Expected literal at ${file}: ${root}.${keys.join(".")}`)
}

function checkGuidance(text: string, shared = false) {
  const managed = block(text)

  for (const name of [
    "Box",
    "Flex",
    "Stack",
    "VStack",
    "HStack",
    "Grid",
    "Center",
    "Container",
    "AbsoluteCenter",
    "Bleed",
    "Float",
    "Wrap",
    "Text",
    "Heading",
    "Blockquote",
    "Em",
    "Mark",
    "Highlight",
    "Prose",
    "Codeblock",
    "stylex.create",
    "stylex.props",
    "stylexProps",
    "xstyle",
    "controlXstyle",
    "className",
    "data-slot",
    "ThemeScript",
    'data-cfasync="false"',
    "Tailwind",
    "cva",
  ])
    expect(managed).toContain(name)
  expect(managed).toContain(
    shared ? "@acme/ui/components/ui/" : "@/components/ui/",
  )
  expect(managed).toContain(
    shared ? "@acme/ui/styles/tokens.stylex" : "@/styles/tokens.stylex",
  )
  expect(managed).toContain(shared ? "@acme/ui/lib/stylex" : "@/lib/stylex")
  expect(managed).not.toContain("@registry/")
  expect(managed).toContain("Use Inter for body text and headings.")
  expect(managed).toContain("Use IBM Plex Mono for code and mono text.")
  expect(managed).toMatch(/semantic.*tokens/i)
  expect(managed).toMatch(/keyboard/i)
  expect(managed).toMatch(/focus/i)
  expect(managed).toMatch(/reduced.motion/i)
  expect(managed).toMatch(/accessible|accessibility/i)
  expect(managed).toMatch(/logical/i)
  expect(managed).toMatch(/render=|render prop/i)

  const repositoryGuidance = readFileSync(
    resolve(packageRoot, "../../AGENTS.md"),
    "utf8",
  )

  const tokenFile = "styles/tokens.stylex.ts"

  const tokenSource = readFileSync(
    resolve(packageRoot, "../registry/src", tokenFile),
    "utf8",
  )

  const colorNames = [
    ...new Set(
      [...tokenSource.matchAll(/"(--[\w-]+)":/g)].map((match) => match[1]),
    ),
  ].filter(
    (name) => name !== "--spacing" && !/^--(?:font|radius|button)/.test(name),
  )

  for (const name of colorNames) {
    const light = sourceValue(tokenFile, "lightValues", name)
    const dark = sourceValue(tokenFile, "darkValues", name) ?? light
    expect(light).toBeString()
    expect(dark).toBeString()
    const row = `| \`${name}\` | \`${light}\` | \`${dark}\` |`
    expect(managed).toContain(row)
    expect(repositoryGuidance).toContain(row)
  }

  expect(sourceValue(tokenFile, "lightValues", "--spacing")).toBe("0.25rem")
  expect(sourceValue(tokenFile, "lightValues", "--radius-sm")).toBe("0.375rem")
  expect(sourceValue(tokenFile, "lightValues", "--radius-md")).toBe("0.5rem")
  expect(sourceValue(tokenFile, "lightValues", "--radius-lg")).toBe("0.625rem")
  expect(sourceValue(tokenFile, "lightValues", "--radius-xl")).toBe("0.875rem")

  for (const units of [
    0, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32,
  ]) {
    const row = `| ${units} | \`${units * 0.25}rem\` | ${units * 4}px |`
    expect(managed).toContain(row)
    expect(repositoryGuidance).toContain(row)
  }

  const sizeRows = [
    "| Text | `1rem` (16px) | `1.5` | 400 |",
    "| Heading h1 | `2.25rem` (36px) | `1.25` | 600 |",
    "| Heading h2 | `1.5rem` (24px) | `1.25` | 600 |",
    "| Heading h3 | `1.25rem` (20px) | `1.25` | 600 |",
    "| Heading h4 | `1.125rem` (18px) | `1.25` | 600 |",
    "| Heading h5 | `1rem` (16px) | `1.25` | 600 |",
    "| Heading h6 | `0.875rem` (14px) | `1.25` | 600 |",
    "| Button xs / icon-xs | `1.75rem` (28px) | `1.5rem` (24px) |",
    "| Button sm / icon-sm | `2rem` (32px) | `1.75rem` (28px) |",
    "| Button default / icon | `2.25rem` (36px) | `2rem` (32px) |",
    "| Button lg / icon-lg | `2.5rem` (40px) | `2.25rem` (36px) |",
    "| Button xl / icon-xl | `2.75rem` (44px) | `2.5rem` (40px) |",
    "| Input sm | `1.875rem` (30px) | `1.625rem` (26px) |",
    "| Input default | `2.125rem` (34px) | `1.875rem` (30px) |",
    "| Input lg | `2.375rem` (38px) | `2.125rem` (34px) |",
    "| Container maximum width | `90rem` | 1440px |",
    "| Container inline padding | `1rem` (4 spacing units) | 16px |",
    "| Button coarse-pointer target minimum | `2.75rem` | 44px |",
  ]

  for (const row of sizeRows) {
    expect(managed).toContain(row)
    expect(repositoryGuidance).toContain(row)
  }

  expect(
    sourceValue("components/ui/text.tsx", "styles", "root", "fontSize"),
  ).toBe("1rem")
  expect(
    sourceValue("components/ui/text.tsx", "styles", "root", "lineHeight"),
  ).toBe(1.5)
  expect(
    sourceValue("components/ui/text.tsx", "styles", "root", "fontWeight"),
  ).toBe(400)
  expect(
    sourceValue("components/ui/heading.tsx", "styles", "root", "lineHeight"),
  ).toBe(1.25)
  expect(
    sourceValue("components/ui/heading.tsx", "styles", "root", "fontWeight"),
  ).toBe(600)

  for (const [level, size] of [
    [1, "2.25rem"],
    [2, "1.5rem"],
    [3, "1.25rem"],
    [4, "1.125rem"],
    [5, "1rem"],
    [6, "0.875rem"],
  ] as const)
    expect(
      sourceValue(
        "components/ui/heading.tsx",
        "styles",
        "root",
        "fontSize",
        level === 2 ? "default" : `:is(h${level})`,
      ),
    ).toBe(size)

  for (const [file, variant, small, large] of [
    ["button", "sizeXSmall", "1.75rem", "1.5rem"],
    ["button", "sizeIconXSmall", "1.75rem", "1.5rem"],
    ["button", "sizeSmall", "2rem", "1.75rem"],
    ["button", "sizeIconSmall", "2rem", "1.75rem"],
    ["button", "sizeDefault", "2.25rem", "2rem"],
    ["button", "sizeIcon", "2.25rem", "2rem"],
    ["button", "sizeLarge", "2.5rem", "2.25rem"],
    ["button", "sizeIconLarge", "2.5rem", "2.25rem"],
    ["button", "sizeXLarge", "2.75rem", "2.5rem"],
    ["button", "sizeIconXLarge", "2.75rem", "2.5rem"],
    ["input", "small", "1.875rem", "1.625rem"],
    ["input", "input", "2.125rem", "1.875rem"],
    ["input", "large", "2.375rem", "2.125rem"],
  ]) {
    expect(
      sourceValue(
        `components/ui/${file}.tsx`,
        "styles",
        variant,
        "blockSize",
        "default",
      ),
    ).toBe(small)
    expect(
      sourceValue(
        `components/ui/${file}.tsx`,
        "styles",
        variant,
        "blockSize",
        "@media (min-width: 640px)",
      ),
    ).toBe(large)
  }

  expect(
    sourceValue(
      "components/ui/container.tsx",
      "styles",
      "root",
      "maxInlineSize",
    ),
  ).toBe("90rem")
  expect(
    sourceValue(
      "components/ui/button.tsx",
      "styles",
      "root",
      "::after",
      "minBlockSize",
      "@media (pointer: coarse)",
    ),
  ).toBe("2.75rem")
  expect(
    sourceValue(
      "components/ui/button.tsx",
      "styles",
      "root",
      "::after",
      "minInlineSize",
      "@media (pointer: coarse)",
    ),
  ).toBe("2.75rem")

  for (const [file, variant, small, large] of [
    ["button", "root", "1rem", "0.875rem"],
    ["button", "sizeXSmall", "0.875rem", "0.75rem"],
    ["button", "sizeXLarge", "1.125rem", "1rem"],
    ["input", "control", "1rem", "0.875rem"],
  ]) {
    expect(
      sourceValue(
        `components/ui/${file}.tsx`,
        "styles",
        variant,
        "fontSize",
        "default",
      ),
    ).toBe(small)
    expect(
      sourceValue(
        `components/ui/${file}.tsx`,
        "styles",
        variant,
        "fontSize",
        "@media (min-width: 640px)",
      ),
    ).toBe(large)
  }

  expect(
    sourceValue(
      "components/ui/container.tsx",
      "styles",
      "fluid",
      "maxInlineSize",
    ),
  ).toBe("none")
  expect(managed).toContain("Pixel equivalents assume a 16px root font size.")
  expect(managed).toContain("Input heights exclude the wrapper's 1px borders.")
  expect(managed).toContain(
    "These rows are spacing multipliers, not separate tokens.",
  )

  return managed
}

for (const guidance of ["design", "agents"] as const) {
  const target = guidance === "design" ? "DESIGN.md" : "AGENTS.md"
  const other = guidance === "design" ? "AGENTS.md" : "DESIGN.md"

  test(`init ${guidance}: append, preserve bytes, replace and repeat`, async () => {
    const project = fixture()

    const prefix =
      "\ufeff# Existing\r\nKeep trailing spaces.  \r\nNo final newline"

    const untouched = "Other guidance stays unchanged\r\n"
    project.put(target, prefix)
    project.put(other, untouched)

    try {
      await initProject({ ...project.options, guidance })
      const first = readFileSync(join(project.root, target), "utf8")
      expect(first.startsWith(prefix)).toBe(true)
      const managed = checkGuidance(first)
      expect(readFileSync(join(project.root, other), "utf8")).toBe(untouched)
      await initProject({ ...project.options, guidance })
      expect(readFileSync(join(project.root, target), "utf8")).toBe(first)
      const before = "# Keep before\r\n\r\n"
      const after = "\r\n\r\nKeep after.  \r\n"
      project.put(target, `${before}${begin}\nOld rules\n${end}${after}`)
      await initProject({ ...project.options, guidance })
      expect(readFileSync(join(project.root, target), "utf8")).toBe(
        `${before}${managed}${after}`,
      )
      expect(readFileSync(join(project.root, other), "utf8")).toBe(untouched)
      evidence.push({
        scenario: `managed block ${guidance}`,
        managed,
        preserved: true,
        calls: project.calls,
      })
    } finally {
      await project.dispose()
    }
  })

  test(`init ${guidance}: dry run plans cwd target without mutation`, async () => {
    const project = fixture()
    project.put(other, "Do not touch\n")
    const before = snapshot(project.root)

    try {
      const result = await initProject({
        ...project.options,
        guidance,
        dryRun: true,
      })

      expect(
        result.preview?.files.some(
          (file) =>
            file.path === join(project.root, target) && file.action === "write",
        ),
      ).toBe(true)
      expect(
        result.preview?.files.some(
          (file) => file.path === join(project.root, other),
        ),
      ).toBe(false)
      expect(snapshot(project.root)).toEqual(before)
      expect(project.calls).toEqual([])
      evidence.push({
        scenario: `dry run ${guidance}`,
        result,
        unchanged: true,
      })
    } finally {
      await project.dispose()
    }
  })

  for (const malformed of [
    begin,
    end,
    `${end}\n${begin}`,
    `${begin}\n${begin}\n${end}`,
    `${begin}\n${end}\n${end}`,
    `${begin}\n${end}\n${begin}\n${end}`,
  ]) {
    for (const dryRun of [false, true]) {
      test(`${guidance} rejects malformed markers before effects: ${JSON.stringify(malformed)}, dry=${dryRun}`, async () => {
        const project = fixture()
        project.put(target, malformed)
        const before = snapshot(project.root)

        try {
          const failure = await initProject({
            ...project.options,
            guidance,
            dryRun,
          }).catch((cause: unknown) => cause)

          expect(failure).toBeInstanceOf(Error)

          if (!(failure instanceof Error))
            throw new Error("Expected init failure")
          expect(failure.message).toMatch(/guidance|marker|managed|block/i)
          expect(snapshot(project.root)).toEqual(before)
          expect(project.calls).toEqual([])
          evidence.push({
            scenario: "invalid markers",
            guidance,
            malformed,
            dryRun,
            unchanged: true,
          })
        } finally {
          await project.dispose()
        }
      })
    }
  }

  for (const dryRun of [false, true]) {
    test(`${guidance} rejects symlink without writes, dry=${dryRun}`, async () => {
      const project = fixture()
      project.put("outside.txt", "Do not change this file\n")
      symlinkSync(join(project.root, "outside.txt"), join(project.root, target))
      const before = snapshot(project.root)

      try {
        const failure = await initProject({
          ...project.options,
          guidance,
          dryRun,
        }).catch((cause: unknown) => cause)

        expect(failure).toBeInstanceOf(Error)

        if (!(failure instanceof Error))
          throw new Error("Expected init failure")
        expect(failure.message).toContain(`Unsafe existing path: ${target}`)
        expect(snapshot(project.root)).toEqual(before)
        expect(project.calls).toEqual([])
      } finally {
        await project.dispose()
      }
    })
  }
}

for (const api of ["initProject", "runCli"] as const) {
  for (const guidance of [undefined, "none"] as const) {
    test(`${api} noninteractive default ${guidance ?? "omitted"} leaves both targets unchanged`, async () => {
      const project = fixture()
      project.put("DESIGN.md", begin)
      project.put("AGENTS.md", end)

      try {
        const options = { ...project.options, ...(guidance && { guidance }) }

        if (api === "initProject") await initProject(options)
        else await runCli(["init"], options)
        expect(readFileSync(join(project.root, "DESIGN.md"), "utf8")).toBe(
          begin,
        )
        expect(readFileSync(join(project.root, "AGENTS.md"), "utf8")).toBe(end)
      } finally {
        await project.dispose()
      }
    })
  }
}

test("design and agents receive identical guidance content", async () => {
  const project = fixture()

  try {
    await initProject({ ...project.options, guidance: "design" })
    await initProject({ ...project.options, guidance: "agents" })
    expect(block(readFileSync(join(project.root, "DESIGN.md"), "utf8"))).toBe(
      block(readFileSync(join(project.root, "AGENTS.md"), "utf8")),
    )
  } finally {
    await project.dispose()
  }
})

for (const guidance of ["design", "agents"] as const) {
  test(`shared UI ${guidance} uses app cwd and package exports`, async () => {
    const project = fixture()
    project.put("package.json", '{"workspaces":["apps/*","packages/*"]}')
    project.put(
      "apps/web/package.json",
      '{"dependencies":{"vite":"*","react":"*"}}',
    )
    project.put("apps/web/tsconfig.json", "{}")
    project.put("apps/web/vite.config.ts", "export default { plugins: [] }\n")
    project.put("apps/web/src/main.tsx", 'import React from "react"\n')
    project.put("packages/ui/package.json", '{"name":"@acme/ui"}')

    for (const path of [
      "DESIGN.md",
      "AGENTS.md",
      "packages/ui/DESIGN.md",
      "packages/ui/AGENTS.md",
    ])
      project.put(path, "Keep UI and workspace guidance\n")
    const cwd = join(project.root, "apps/web")
    const target = guidance === "design" ? "DESIGN.md" : "AGENTS.md"
    const before = snapshot(project.root)

    try {
      const options = {
        ...project.options,
        cwd,
        ui: "../../packages/ui",
        guidance,
      }

      const dry = await initProject({ ...options, dryRun: true })
      expect(
        dry.preview?.files.some((file) => file.path === join(cwd, target)),
      ).toBe(true)
      expect(snapshot(project.root)).toEqual(before)
      await initProject(options)

      const managed = checkGuidance(
        readFileSync(join(cwd, target), "utf8"),
        true,
      )

      expect(
        existsSync(
          join(cwd, target === "DESIGN.md" ? "AGENTS.md" : "DESIGN.md"),
        ),
      ).toBe(false)

      for (const path of [
        "DESIGN.md",
        "AGENTS.md",
        "packages/ui/DESIGN.md",
        "packages/ui/AGENTS.md",
      ])
        expect(readFileSync(join(project.root, path), "utf8")).toBe(
          "Keep UI and workspace guidance\n",
        )
      evidence.push({
        scenario: `shared ${guidance}`,
        managed,
        dry,
        calls: project.calls,
      })
    } finally {
      await project.dispose()
    }
  })
}

for (const guidance of ["design", "agents", "none", undefined] as const) {
  test(`packed CLI accepts guidance ${guidance ?? "noninteractive default"}`, async () => {
    const project = fixture()
    const before = snapshot(project.root)

    try {
      const args = [
        "node",
        packedCli,
        "init",
        "--dry-run",
        "--registry",
        project.options.registryUrl,
        ...(guidance ? ["--guidance", guidance] : []),
      ]

      const result = await command(project.root, args, "1\n")
      expect(result.status, result.stderr).toBe(0)
      expect(result.stdout).not.toContain("Do nothing")

      for (const [choice, target] of [
        ["design", "DESIGN.md"],
        ["agents", "AGENTS.md"],
      ])
        expect(result.stdout.includes(join(project.root, target))).toBe(
          guidance === choice,
        )
      expect(snapshot(project.root)).toEqual(before)
      expect(project.calls).toEqual([])
    } finally {
      await project.dispose()
    }
  })
}

const ptyScript = `import errno, os, pty, select, signal, subprocess, sys, time
master, slave = pty.openpty()
child = subprocess.Popen(sys.argv[2:], stdin=slave, stdout=slave, stderr=slave)
os.close(slave)
output = bytearray()
sent = False
deadline = time.monotonic() + 25
while time.monotonic() < deadline:
    ready, _, _ = select.select([master], [], [], 0.1)
    if ready:
        try:
            data = os.read(master, 65536)
        except OSError as error:
            if error.errno == errno.EIO:
                break
            raise
        if not data:
            break
        output.extend(data)
        if not sent and b'Do nothing' in output:
            if sys.argv[1] == 'SIGINT':
                child.send_signal(signal.SIGINT)
            else:
                os.write(master, b'\\x04' if sys.argv[1] == 'EOF' else (sys.argv[1] + '\\n').encode())
            sent = True
    if child.poll() is not None and not ready:
        break
else:
    child.kill()
    child.wait()
    sys.stdout.buffer.write(output)
    sys.exit(124)
os.close(master)
sys.stdout.buffer.write(output)
sys.exit(child.wait())
`

for (const [input, guidance] of [
  ["1", "design"],
  ["2", "agents"],
  ["3", "none"],
  ["", "none"],
] as const) {
  test(`packed real TTY numbered selection ${input || "Enter default"}`, async () => {
    const project = fixture()
    const before = snapshot(project.root)

    try {
      const result = await command(project.root, [
        "python3",
        "-c",
        ptyScript,
        input,
        "node",
        packedCli,
        "init",
        "--dry-run",
        "--registry",
        project.options.registryUrl,
      ])

      expect(result.status, result.stdout + result.stderr).toBe(0)
      expect(result.stdout).toMatch(/1[^\n]*DESIGN\.md/)
      expect(result.stdout).toMatch(/2[^\n]*AGENTS\.md/)
      expect(result.stdout).toMatch(/3[^\n]*Do nothing/)

      for (const [choice, target] of [
        ["design", "DESIGN.md"],
        ["agents", "AGENTS.md"],
      ])
        expect(result.stdout.includes(join(project.root, target))).toBe(
          guidance === choice,
        )
      expect(snapshot(project.root)).toEqual(before)
    } finally {
      await project.dispose()
    }
  })
}

test("packed explicit guidance bypasses TTY prompt", async () => {
  const project = fixture()

  try {
    const result = await command(project.root, [
      "python3",
      "-c",
      ptyScript,
      "",
      "node",
      packedCli,
      "init",
      "--guidance",
      "design",
      "--dry-run",
      "--registry",
      project.options.registryUrl,
    ])

    expect(result.status, result.stdout + result.stderr).toBe(0)
    expect(result.stdout).not.toContain("Do nothing")
    expect(result.stdout).toContain(join(project.root, "DESIGN.md"))
  } finally {
    await project.dispose()
  }
})

for (const args of [
  ["init", "--guidance"],
  ["init", "--guidance", "invalid"],
  ["init", "--guidance", "DESIGN.md"],
  ["init", "--guidance", "design", "--guidance", "agents"],
  ["add", "button", "--guidance", "design"],
  ["update", "button", "--guidance", "none"],
]) {
  test(`packed invalid guidance flags reject before mutation: ${args.join(" ")}`, async () => {
    const project = fixture()
    const before = snapshot(project.root)

    try {
      const result = await command(project.root, [
        "node",
        packedCli,
        ...args,
        "--registry",
        project.options.registryUrl,
      ])

      expect(result.status).toBe(1)
      expect(result.stdout).toBe("")
      expect(result.stderr).toContain("Usage:")
      expect(project.requests).toEqual([])
      expect(snapshot(project.root)).toEqual(before)
    } finally {
      await project.dispose()
    }
  })
}

for (const mode of ["stdin-only", "stdout-only"] as const) {
  test(`packed CLI requires both TTY streams: ${mode}`, async () => {
    const project = fixture()
    const before = snapshot(project.root)

    const script = `import errno, os, pty, subprocess, sys
master, slave = pty.openpty()
if sys.argv[1] == 'stdin-only':
    child = subprocess.Popen(sys.argv[2:], stdin=slave, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    os.close(slave)
    output, errors = child.communicate(timeout=25)
    sys.stdout.buffer.write(output)
    sys.stderr.buffer.write(errors)
else:
    child = subprocess.Popen(sys.argv[2:], stdin=subprocess.DEVNULL, stdout=slave, stderr=slave)
    os.close(slave)
    while True:
        try:
            data = os.read(master, 65536)
        except OSError as error:
            if error.errno == errno.EIO:
                break
            raise
        if not data:
            break
        sys.stdout.buffer.write(data)
os.close(master)
sys.exit(child.wait())
`

    try {
      const result = await command(project.root, [
        "python3",
        "-c",
        script,
        mode,
        "node",
        packedCli,
        "init",
        "--dry-run",
        "--registry",
        project.options.registryUrl,
      ])

      expect(result.status, result.stdout + result.stderr).toBe(0)
      expect(result.stdout).not.toContain("Do nothing")
      expect(result.stdout).not.toContain(join(project.root, "DESIGN.md"))
      expect(result.stdout).not.toContain(join(project.root, "AGENTS.md"))
      expect(snapshot(project.root)).toEqual(before)
    } finally {
      await project.dispose()
    }
  })
}

test("programmatic runCli does not prompt even with real TTY streams", async () => {
  const project = fixture()
  const before = snapshot(project.root)
  const source = resolve(packageRoot, "src/cli.ts")
  const script = `import { runCli } from ${JSON.stringify(source)}; await runCli(["init", "--dry-run", "--registry", ${JSON.stringify(project.options.registryUrl)}]);`

  try {
    const result = await command(project.root, [
      "python3",
      "-c",
      ptyScript,
      "",
      "bun",
      "-e",
      script,
    ])

    expect(result.status, result.stdout + result.stderr).toBe(0)
    expect(result.stdout).not.toContain("Do nothing")
    expect(result.stdout).not.toContain(join(project.root, "DESIGN.md"))
    expect(result.stdout).not.toContain(join(project.root, "AGENTS.md"))
    expect(snapshot(project.root)).toEqual(before)
  } finally {
    await project.dispose()
  }
})

test("TTY EOF cancels init before registry requests or mutation", async () => {
  const project = fixture()
  const before = snapshot(project.root)

  try {
    const result = await command(project.root, [
      "python3",
      "-c",
      ptyScript,
      "EOF",
      "node",
      packedCli,
      "init",
      "--registry",
      project.options.registryUrl,
    ])

    expect(result.status, result.stdout + result.stderr).toBe(1)
    expect(result.stdout).toContain("Do nothing")
    expect(project.requests).toEqual([])
    expect(snapshot(project.root)).toEqual(before)
  } finally {
    await project.dispose()
  }
})

test("TTY Ctrl+C cancels init before registry requests or mutation", async () => {
  const project = fixture()
  const before = snapshot(project.root)

  try {
    const result = await command(project.root, [
      "python3",
      "-c",
      ptyScript,
      "SIGINT",
      "node",
      packedCli,
      "init",
      "--registry",
      project.options.registryUrl,
    ])

    expect(result.status, result.stdout + result.stderr).toBe(1)
    expect(result.stdout).toContain("Do nothing")
    expect(project.requests).toEqual([])
    expect(snapshot(project.root)).toEqual(before)
  } finally {
    await project.dispose()
  }
})
