import { styleComponentNames } from "@yopem/oxlint-plugin"
import { afterAll, beforeAll, expect, test } from "bun:test"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"

interface GeneratedDocs {
  items: {
    parts: { kind: string; name: string; props: number[] }[]
  }[]
  properties: { name: string }[]
}

function isGeneratedDocs(value: unknown): value is GeneratedDocs {
  if (typeof value !== "object" || value === null) return false
  if (!("items" in value) || !("properties" in value)) return false
  return Array.isArray(value.items) && Array.isArray(value.properties)
}

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
  rules: Record<string, unknown> = {
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

test("style component fixtures match generated public props", async () => {
  const source = await readFile(
    resolve(projectRoot, "packages/registry/src/docs.generated.json"),
    "utf8",
  )
  const docs: unknown = JSON.parse(source)
  expect(isGeneratedDocs(docs)).toBe(true)
  if (!isGeneratedDocs(docs)) throw new TypeError("Invalid generated docs")
  const styled = docs.items.flatMap(({ parts }) =>
    parts
      .filter(
        (part) =>
          part.kind === "component" &&
          part.props.some((id) => docs.properties[id]?.name === "xstyle"),
      )
      .map(({ name }) => name),
  )

  expect(styleComponentNames.toSorted()).toEqual(styled.toSorted())
})

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

test("styling methods prefer shorthand props and preserve expressions", async () => {
  const configPath = await writeConfig("styling-methods.json", {
    "yopem-ui/enforce-styling-methods": "error",
  })
  const fixturePath = await writeFixture(
    "styling-methods.tsx",
    `import a from "@stylexjs/atoms"
import * as sx from "@stylexjs/stylex"
import { Box as Surface } from "@/components/ui/stylex/box"

const token = "var(--foreground)"
const styles = sx.create({ root: { padding: 2, color: token } })

export function Example({ active }: { active: boolean }) {
  return (
    <>
      <Surface style={{ marginTop: active ? 2 : 1 }} />
      <Surface xstyle={styles.root} />
      <Surface xstyle={{ padding: [1, null, 3] }} />
      <Surface
        {...sx.props(
          a.padding._16px,
          a.width["100%"],
          a.display.grid,
          a.flexGrow(1),
          a.gridTemplateColumns["1fr"],
          a.color(token),
          a.fontSize._1rem,
          a.borderWidth(1),
          a.opacity["0.8"],
          a.position.relative,
        )}
      />
    </>
  )
}
`,
  )

  const result = lint(configPath, fixturePath)
  expect(result.exitCode, result.output).toBe(1)
  expect(result.output).toContain("Prefer built-in style props (mt)")
  expect(result.output).toContain("Prefer built-in style props (p, color)")
  expect(result.output).toContain("Prefer built-in style props (p)")
  expect(result.output).toContain(
    "Prefer built-in style props (p, w, display, flexGrow, gridTemplateColumns, color, fontSize, borderWidth, opacity, pos)",
  )

  const fixed = lint(configPath, fixturePath, ["--fix"])
  expect(fixed.exitCode, fixed.output).toBe(1)
  expect(await readFile(fixturePath, "utf8")).toContain(
    "<Surface mt={active ? 2 : 1} />",
  )

  const suggested = lint(configPath, fixturePath, ["--fix-suggestions"])
  expect(suggested.exitCode, suggested.output).toBe(0)
  const source = await readFile(fixturePath, "utf8")
  expect(source).toContain("<Surface p={2} color={token} />")
  expect(source).toContain("p={[1, null, 3]}")
  expect(source).toContain('p={"16px"}')
  expect(source).toContain('w={"100%"}')
  expect(source).toContain('display={"grid"}')
  expect(source).toContain("flexGrow={1}")
  expect(source).toContain('gridTemplateColumns={"1fr"}')
  expect(source).toContain("color={token}")
  expect(source).toContain('fontSize={"1rem"}')
  expect(source).toContain("borderWidth={1}")
  expect(source).toContain('opacity={"0.8"}')
  expect(source).toContain('pos={"relative"}')
})

test("styling methods can be independently banned", async () => {
  const configPath = await writeConfig("banned-methods.json", {
    "yopem-ui/enforce-styling-methods": [
      "error",
      {
        methods: {
          atoms: false,
          className: false,
          reactStyle: false,
          stylexStyle: false,
          xstyle: false,
        },
      },
    ],
  })
  const fixturePath = await writeFixture(
    "banned-methods.tsx",
    `import a from "@stylexjs/atoms"
import * as styles from "@stylexjs/stylex"
import { Box as Surface } from "@/components/ui/stylex/box"
const sheet = styles.create({ root: { color: "red" } })
export function Example() {
  return <>
    <Surface xstyle={sheet.root} />
    <Surface {...styles.props(sheet.root)} />
    <Surface {...styles.props(a.color.red)} />
    <Surface className="external" />
    <Surface style={{ color: "red" }} />
  </>
}
`,
  )

  const result = lint(configPath, fixturePath)
  expect(result.exitCode, result.output).toBe(1)
  for (const method of [
    "xstyle",
    "stylexStyle",
    "atoms",
    "className",
    "reactStyle",
  ]) {
    expect(result.output).toContain(`${method} styling is disabled`)
  }
})

test("styling methods ignore unrelated components and unresolved styles", async () => {
  const configPath = await writeConfig("styling-false-positives.json", {
    "yopem-ui/enforce-styling-methods": "error",
  })
  const fixturePath = await writeFixture(
    "styling-false-positives.tsx",
    `import { Box } from "other-library"
import { Box as Surface } from "@/components/ui/stylex/box"
import { TooltipProvider } from "@/components/ui/stylex/tooltip"
import recipe from "other-atoms"
export function Example({ styles }: { styles: object }) {
  return <>
    <Box style={{ padding: 2 }} />
    <Surface xstyle={styles} />
    <Surface xstyle={recipe({ padding: 2 })} />
    <TooltipProvider style={{ padding: 2 }} />
  </>
}
export function Shadowed({ Surface }: { Surface: typeof Box }) {
  return <Surface style={{ padding: 2 }} />
}
`,
  )

  const result = lint(configPath, fixturePath)
  expect(result.exitCode, result.output).toBe(0)
})

test("style prop contract rules fix aliases and reject DOM leaks", async () => {
  const configPath = await writeConfig("style-prop-contracts.json", {
    "yopem-ui/no-leaked-dom-style-props": "error",
    "yopem-ui/no-unsupported-style-props": "error",
  })
  const fixturePath = await writeFixture(
    "style-prop-contracts.tsx",
    `import { Box as Surface } from "@/components/ui/stylex/box"
export function Example() {
  return <><Surface paddingHorizontal={2} /><div p={2} {...{ mt: 1 }} /></>
}
`,
  )

  const result = lint(configPath, fixturePath)
  expect(result.exitCode, result.output).toBe(1)
  expect(result.output).toContain("Use px instead")
  expect(result.output).toContain("not a native <div> attribute")

  lint(configPath, fixturePath, ["--fix"])
  expect(await readFile(fixturePath, "utf8")).toContain("<Surface px={2} />")
})

test("polymorphic rule follows aliases and namespace imports", async () => {
  const configPath = await writeConfig("polymorphic.json", {
    "yopem-ui/valid-polymorphic-as": "error",
  })
  const fixturePath = await writeFixture(
    "polymorphic.tsx",
    `import { Box as Surface, Heading } from "@/components/ui/stylex/box"
import * as UI from "@/components/ui/stylex/layout"
export function Valid() { return <><Surface as="section" /><Heading as="h3" /></> }
export function Invalid({ tag }: { tag: string }) {
  return <><Surface as={tag} /><Heading as="section" /><UI.Box as="not-real" /></>
}
`,
  )

  const result = lint(configPath, fixturePath)
  expect(result.exitCode, result.output).toBe(1)
  expect(result.output).toContain("Box as must be a native JSX element string")
  expect(result.output).toContain("Heading as must be one of")
})

test("static StyleX rule detects renamed imports without unrelated calls", async () => {
  const configPath = await writeConfig("static-stylex.json", {
    "yopem-ui/static-stylex": "error",
  })
  const fixturePath = await writeFixture(
    "static-stylex.tsx",
    `import { create as makeStyles, when as condition } from "@stylexjs/stylex"
const key = "root"
const valid = makeStyles({
  root: {
    color: { default: "red", [condition.ancestor(":hover")]: "blue" },
  },
})
const computed = makeStyles({ [key]: { color: "red" } })
const spread = makeStyles({ ...valid })
const unrelated = { create: (value: unknown) => value }
unrelated.create(computed)
`,
  )

  const result = lint(configPath, fixturePath)
  expect(result.exitCode, result.output).toBe(1)
  expect(result.output.match(/static object shapes and keys/g)?.length).toBe(2)
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
