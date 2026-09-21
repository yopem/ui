import { afterAll, beforeAll, expect, test } from "bun:test"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"

const packageRoot = resolve(import.meta.dir, "..")
const projectRoot = resolve(packageRoot, "../..")
const pluginPath = resolve(packageRoot, "src/index.ts")
const oxlintPath = resolve(projectRoot, "node_modules/oxlint/bin/oxlint")
const rootConfigPath = resolve(projectRoot, ".oxlintrc.json")

let tempRoot = ""

beforeAll(async () => {
  tempRoot = await mkdtemp(join(tmpdir(), "yopem-ui-oxlint-"))
})

afterAll(async () => {
  await rm(tempRoot, { force: true, recursive: true })
})

function runOxlint(args: string[], cwd = projectRoot) {
  const result = Bun.spawnSync(["node", oxlintPath, ...args], {
    cwd,
    stderr: "pipe",
    stdout: "pipe",
  })
  const stdout = result.stdout.toString()
  const stderr = result.stderr.toString()

  return {
    exitCode: result.exitCode,
    output: `${stdout}\n${stderr}`,
    stderr,
    stdout,
  }
}

async function writeFixture(name: string, source: string) {
  const path = join(tempRoot, name)
  await writeFile(path, source)
  return path
}

async function writeConfig(
  name: string,
  rules: Record<string, string> = {
    "yopem-ui/prefer-ui-primitives": "error",
  },
) {
  const path = join(tempRoot, name)
  await writeFile(
    path,
    JSON.stringify(
      {
        jsPlugins: [
          {
            name: "yopem-ui",
            specifier: pluginPath,
          },
        ],
        rules,
      },
      null,
      2,
    ),
  )
  return path
}

function lint(
  configPath: string,
  filePath: string,
  options: string[] = [],
  cwd = projectRoot,
) {
  return runOxlint(
    ["--config", configPath, "--threads=1", ...options, filePath],
    cwd,
  )
}

test("CLI loads plugin and flags native HTML without autofix", async () => {
  const configPath = await writeConfig("invalid.json")
  const fixturePath = await writeFixture(
    "invalid.tsx",
    `export function Example() {
  return (
    <>
      <div />
      <span />
      <form />
      <head />
      <script />
      <style />
      <svg>
        <title />
        <foreignObject>
          <div />
        </foreignObject>
      </svg>
    </>
  )
}
`,
  )
  const sourceBeforeFix = await readFile(fixturePath, "utf8")

  const result = lint(configPath, fixturePath)

  expect(result.exitCode, result.output).toBe(1)
  expect(result.output).toContain("prefer-ui-primitives")
  expect(result.output).toContain("Box, Flex, Grid, or Stack")
  for (const tag of ["div", "span", "form", "head", "script", "style"]) {
    expect(result.output).toContain(`<${tag}>`)
  }

  const fixed = lint(configPath, fixturePath, ["--fix"])
  expect(fixed.exitCode, fixed.output).toBe(1)
  expect(await readFile(fixturePath, "utf8")).toBe(sourceBeforeFix)
})

test("CLI accepts UI primitives, custom elements, SVG, and MathML", async () => {
  const configPath = await writeConfig("valid.json")
  const fixturePath = await writeFixture(
    "valid.tsx",
    `export function Example() {
  return (
    <>
      <Box />
      <Flex />
      <Link />
      <Paragraph />
      <Heading />
      <UI.Panel />
      <Card />
      <my-card />
      <customthing />
      <svg>
        <path />
        <title />
      </svg>
      <math>
        <mrow>
          <mi>x</mi>
        </mrow>
      </math>
      <svg:path />
    </>
  )
}
`,
  )

  const result = lint(configPath, fixturePath)

  expect(result.exitCode, result.output).toBe(0)
  expect(result.output).not.toContain("prefer-ui-primitives")
})

test("root config scopes native HTML exceptions", async () => {
  const virtualRoot = await mkdtemp(join(tempRoot, "config-"))
  const rootConfig = await readFile(rootConfigPath, "utf8")
  const configPath = join(virtualRoot, ".oxlintrc.json")

  await writeFile(
    configPath,
    rootConfig.replace(
      '"specifier": "./packages/oxlint-plugin/src/index.ts"',
      `"specifier": ${JSON.stringify(pluginPath)}`,
    ),
  )

  const cases = [
    {
      expectedExitCode: 1,
      file: "apps/docs/src/components/examples/stylex/bad.tsx",
      source: "export function Bad() { return <div /> }\n",
    },
    {
      expectedExitCode: 0,
      file: "apps/docs/src/components/examples/stylex/box.tsx",
      source:
        "function Box() { return null }\nexport function BoxExample() { return <Box /> }\n",
    },
    {
      expectedExitCode: 0,
      file: "packages/registry/src/components/ui/raw.tsx",
      source: "export function Raw() { return <div /> }\n",
    },
    {
      expectedExitCode: 0,
      file: "apps/docs/src/routes/__root.tsx",
      source: "export function Root() { return <head><title /></head> }\n",
    },
    {
      expectedExitCode: 1,
      file: "apps/docs/src/routes/__root.tsx",
      source: "export function Root() { return <div /> }\n",
    },
    {
      expectedExitCode: 0,
      file: "apps/docs/src/lib/og.tsx",
      source: "export function Og() { return <div><span /></div> }\n",
    },
  ]

  for (const testCase of cases) {
    const filePath = join(virtualRoot, testCase.file)
    await mkdir(dirname(filePath), { recursive: true })
    await writeFile(filePath, testCase.source)

    const result = lint(
      configPath,
      testCase.file,
      ["--format=json"],
      virtualRoot,
    )

    expect(result.exitCode, `${testCase.file}\n${result.output}`).toBe(
      testCase.expectedExitCode,
    )
  }
})

test("CLI recommends dedicated typography and does not infer SVG from expressions", async () => {
  const configPath = await writeConfig("semantics.json")
  const fixturePath = await writeFixture(
    "semantics.tsx",
    "export function Example() { return <><a /><p /><h3 />{<svg /> && <title>HTML title</title>}</> }",
  )
  const result = lint(configPath, fixturePath)
  expect(result.exitCode, result.output).toBe(1)
  expect(result.output).toContain("Prefer Link over native <a>")
  expect(result.output).toContain("Prefer Paragraph over native <p>")
  expect(result.output).toContain('Prefer Heading as="h3" over native <h3>')
  expect(result.output).toContain('Prefer Box as="title" over native <title>')
})

test("CLI rejects unknown rules from a loaded plugin config", async () => {
  const configPath = await writeConfig("invalid-rule.json", {
    "yopem-ui/not-a-real-rule": "error",
  })
  const fixturePath = await writeFixture(
    "config-error.tsx",
    "export const value = 1\n",
  )

  const result = lint(configPath, fixturePath)

  expect(result.exitCode).not.toBe(0)
  expect(result.output).toMatch(/not-a-real-rule|unknown rule/i)
})
