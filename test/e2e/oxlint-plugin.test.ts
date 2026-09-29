import { afterAll, expect, test } from "bun:test"
import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

const directory = resolve(import.meta.dir, "../../tmp/oxlint-plugin-e2e")

const plugin = resolve(
  import.meta.dir,
  "../../packages/oxlint-plugin/src/index.ts",
)

mkdirSync(directory, { recursive: true })

afterAll(() => rmSync(directory, { recursive: true, force: true }))

function lint(source: string, rules: Record<string, unknown>) {
  const config = resolve(directory, "config.json")
  const input = resolve(directory, "fixture.tsx")
  writeFileSync(
    config,
    JSON.stringify({
      jsPlugins: [{ name: "yopem-ui", specifier: plugin }],
      rules,
    }),
  )
  writeFileSync(input, source)

  const result = Bun.spawnSync(
    [
      resolve(import.meta.dir, "../../node_modules/.bin/oxlint"),
      "--config",
      config,
      input,
    ],
    { cwd: directory },
  )

  return {
    status: result.exitCode,
    output: `${result.stdout.toString()}${result.stderr.toString()}`,
  }
}

const imports = `import * as sx from "@stylexjs/stylex";
import { Button as Action, CardTitle } from "@registry/components/ui/button";`

test("styling methods allow supported props and reject CSS, inline, and StyleX spreads", () => {
  const valid = lint(
    `${imports}
const styles = sx.create({ button: { color: "red" } });
const view = <><Action className="custom" xstyle={styles.button} /><button style={{ color: "red" }} /></>;`,
    { "yopem-ui/enforce-styling-methods": "error" },
  )

  expect(valid.status).toBe(0)

  const invalid = lint(
    `${imports}
const styles = sx.create({ button: { color: "red" } });
const view = <><Action css={{ color: "red" }} style={{ color: "red" }} {...sx.props(styles.button)} /><Action style={sx.props(styles.button).style} /></>;`,
    { "yopem-ui/enforce-styling-methods": "error" },
  )

  expect(invalid.status).toBe(1)
  expect(invalid.output).toContain("css styling is disabled")
  expect(invalid.output).toContain("reactStyle styling is disabled")
  expect(invalid.output.match(/stylexStyle styling is disabled/g)).toHaveLength(
    2,
  )
})

test("styling methods honor import aliases, namespaces, and overrides", () => {
  const result = lint(
    `import { Button as Action } from "@acme/ui";
import * as UI from "@acme/ui";
const view = <><Action className="custom" /><UI.Button className="custom" /><button className="native" /></>;`,
    {
      "yopem-ui/enforce-styling-methods": [
        "error",
        {
          componentSources: ["@acme/ui"],
          styleComponents: ["Button"],
          methods: { className: false },
        },
      ],
    },
  )

  expect(result.status).toBe(1)
  expect(result.output.match(/className styling is disabled/g)).toHaveLength(2)
  expect(result.output).not.toContain("native")
})

test("polymorphic as validates Box tags and Heading levels", () => {
  const valid = lint(
    `import { Box as Layout, Heading } from "@/components/ui/layout";
const view = <><Layout as="main" /><Heading as="h2" /><button as="unknown" /></>;`,
    { "yopem-ui/valid-polymorphic-as": "error" },
  )

  expect(valid.status).toBe(0)

  const invalid = lint(
    `import * as UI from "@/components/ui/layout";
const tag = "main";
const view = <><UI.Box as="fake-tag" /><UI.Box as={tag} /><UI.Heading as="main" /><UI.Heading as={tag} /></>;`,
    { "yopem-ui/valid-polymorphic-as": "error" },
  )

  expect(invalid.status).toBe(1)
  expect(invalid.output.match(/Box as must be/g)).toHaveLength(2)
  expect(invalid.output.match(/Heading as must be/g)).toHaveLength(2)
})

test("static StyleX accepts fixed keys and rejects dynamic shapes", () => {
  const valid = lint(
    `import { create as make, when } from "@stylexjs/stylex";
const styles = make({ root: { color: "red", ":hover": { opacity: 1 }, [when.ancestor(":hover")]: { opacity: 0 } } });`,
    { "yopem-ui/static-stylex": "error" },
  )

  expect(valid.status).toBe(0)

  const invalid = lint(
    `import * as sx from "@stylexjs/stylex";
const key = "color";
const values = {};
const one = sx.create(values);
const two = sx.create({ [key]: { color: "red" }, root: { [key]: "red", ...values } });`,
    { "yopem-ui/static-stylex": "error" },
  )

  expect(invalid.status).toBe(1)
  expect(
    invalid.output.match(/must use static object shapes and keys/g),
  ).toHaveLength(4)
})

test("Box as accepts native SVG elements", () => {
  const result = lint(
    `import { Box } from "@/components/ui/box";
const view = <><Box as="svg" /><Box as="circle" /><Box as="linearGradient" /><Box as="param" /><Box as="webview" /></>;`,
    { "yopem-ui/valid-polymorphic-as": "error" },
  )

  expect(result.status).toBe(0)
})

const policy = [
  "error",
  {
    allow: ["margin*", "inlineSize"],
    deny: ["marginBlockStart"],
    contracts: [
      {
        pattern: "^CardTitle$",
        allow: ["fontSize"],
        deny: [],
        message: "Use {{component}} token for {{property}}",
      },
    ],
    exclude: ["^Skip"],
  },
]

test("StyleX contracts inspect local declarations, aliases, nested conditions, and inherited policy", () => {
  const result = lint(
    `${imports}
const styles = sx.create({
  button: { marginInline: 4, backgroundColor: "red", ':hover': { color: "blue" } },
  title: { fontSize: 14, marginBlockStart: 5 },
});
const a = <Action xstyle={styles.button} />;
const b = <CardTitle xstyle={styles.title} />;`,
    { "yopem-ui/no-restyle": policy },
  )

  expect(result.status).toBe(1)
  expect(result.output).toContain("backgroundColor")
  expect(result.output).toContain("color")
  expect(result.output).toContain("Use CardTitle token for marginBlockStart")
  expect(result.output).not.toContain("marginInline")
  expect(result.output).not.toContain("fontSize")
})

test("StyleX declarations after JSX are still checked", () => {
  const result = lint(
    `${imports}
const a = <Action xstyle={styles.button} />;
const styles = sx.create({ button: { backgroundColor: "red" } });`,
    { "yopem-ui/no-restyle": "error" },
  )

  expect(result.status).toBe(1)
  expect(result.output).toContain("variant")
})

test("default policy recommends existing variant and size props before restyling", () => {
  const result = lint(
    `${imports}
const styles = sx.create({ button: { backgroundColor: "red", paddingInline: 8, marginInline: 4 } });
const a = <Action xstyle={styles.button} />;`,
    { "yopem-ui/no-restyle": "error" },
  )

  expect(result.status).toBe(1)
  expect(result.output).toContain("variant")
  expect(result.output).toContain("size")
  expect(result.output).not.toContain("marginInline")
})

test("StyleX patterns exclude components and ignore styles outside the local graph", () => {
  const result = lint(
    `${imports}
import { external } from "./external";
const styles = sx.create({ button: { padding: 4 } });
const a = <Action xstyle={[styles.button, external]} />;
const b = <CardTitle xstyle={external} />;`,
    {
      "yopem-ui/no-restyle": [
        "error",
        { allow: ["padding"], exclude: ["^CardTitle$"] },
      ],
    },
  )

  expect(result.status).toBe(0)
})

test("conditional StyleX values keep their property name and policy", () => {
  const result = lint(
    `${imports}
const styles = sx.create({ button: { color: { default: "#fff", ':hover': "#000" } } });
const a = <Action xstyle={styles.button} />;`,
    {
      "yopem-ui/no-restyle": "error",
      "yopem-ui/no-raw-stylex-colors": "error",
    },
  )

  expect(result.status).toBe(1)
  expect(result.output).toContain("variant")
  expect(result.output).toContain("raw color")
})

test("StyleX styles resolve within the JSX lexical scope", () => {
  const result = lint(
    `${imports}
const styles = sx.create({ button: { marginInline: 4 } });
function Shadow() {
  const styles = sx.create({ button: { backgroundColor: "red" } });
  return <Action xstyle={styles.button} />;
}
const view = <Action xstyle={styles.button} />;`,
    { "yopem-ui/no-restyle": "error" },
  )

  expect(result.status).toBe(1)
  expect(result.output.match(/Use its variant prop first/g)).toHaveLength(1)
})

test("StyleX raw colors only report literal color properties, not token references", () => {
  const result = lint(
    `import { create as make } from "@stylexjs/stylex";
import { tokens } from "@registry/styles/tokens.stylex";
const styles = make({ root: { color: "#fff", backgroundColor: tokens.background, ':hover': { borderColor: "rgb(0 0 0)" }, boxShadow: "0 1px #000" } });`,
    { "yopem-ui/no-raw-stylex-colors": "error" },
  )

  expect(result.status).toBe(1)
  expect(result.output).toContain("color")
  expect(result.output).toContain("borderColor")
  expect(result.output).not.toContain("boxShadow")
})

test("atoms policy supports allow, disallow, and enforce", () => {
  const source = `import x from "@stylexjs/atoms";
import * as stylex from "@stylexjs/stylex";
const styles = stylex.create({ root: { padding: 4 } });
const a = <div sx={[x.color.blue, styles.root]} />;
const b = <div xstyle={styles.root} />;`

  expect(
    lint(source, { "yopem-ui/atoms": ["error", { mode: "allow" }] }).status,
  ).toBe(0)

  const denied = lint(source, {
    "yopem-ui/atoms": ["error", { mode: "disallow" }],
  })

  expect(denied.output).toContain("StyleX atoms are disallowed")

  const enforced = lint(source, {
    "yopem-ui/atoms": ["error", { mode: "enforce" }],
  })

  expect(enforced.output).toContain("stylex.create")
  expect(enforced.output).toContain("xstyle")

  const custom = lint(
    `import atomic from "@apps/stylexjs/atoms";
const a = <div xstyle={atomic.color.blue} />;`,
    {
      "yopem-ui/atoms": [
        "error",
        { mode: "enforce", source: "@apps/stylexjs/atoms" },
      ],
    },
  )

  expect(custom.status).toBe(0)
}, 30_000)

test("atoms policy finds references on either side of logical expressions", () => {
  const result = lint(
    `import x from "@stylexjs/atoms";
const fallback = {};
const view = <div xstyle={x.color.blue || fallback} />;`,
    { "yopem-ui/atoms": ["error", { mode: "enforce" }] },
  )

  expect(result.status).toBe(0)
})

test("layout primitives replace presentational div and span by default", () => {
  const result = lint(
    `import { Box as Container, Stack } from "@/components/ui/layout";
const view = <><div><span>Text</span></div><Container /><Stack /><section /><svg><g /></svg><custom-widget /></>;`,
    { "yopem-ui/prefer-layout-primitives": "error" },
  )

  expect(result.status).toBe(1)
  expect(result.output).toContain("Box")
  expect(result.output).toContain("div")
  expect(result.output).toContain("span")
  expect(result.output).not.toContain("section")
})

test("layout primitive rule supports opt-out and additional tags", () => {
  const source = `const view = <><div /><span /><main /></>;`
  expect(
    lint(source, { "yopem-ui/prefer-layout-primitives": "off" }).status,
  ).toBe(0)

  const result = lint(source, {
    "yopem-ui/prefer-layout-primitives": ["error", { elements: ["main"] }],
  })

  expect(result.status).toBe(1)
  expect(result.output).toContain("main")
  expect(result.output).not.toContain("<div>")
  expect(result.output).not.toContain("<span>")
})

test("new rules remain opt-in", () => {
  const result = lint(
    `${imports}
const styles = sx.create({ button: { color: "#fff" } });
const a = <Action xstyle={styles.button} />;`,
    {},
  )

  expect(result.status).toBe(0)
})
