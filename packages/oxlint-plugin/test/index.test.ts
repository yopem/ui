import { recommendedRules } from "@yopem-ui/oxlint-plugin"
import { afterAll, expect, test } from "bun:test"
import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

type JsonValue = boolean | null | number | string | JsonObject | JsonValue[]

interface JsonObject {
  [key: string]: JsonValue
}

const directory = resolve(import.meta.dir, "../tmp/oxlint-plugin-e2e")

const plugin = resolve(import.meta.dir, "../src/index.ts")

mkdirSync(directory, { recursive: true })

afterAll(() => rmSync(directory, { recursive: true, force: true }))

function lint(source: string, rules: JsonObject) {
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
      resolve(import.meta.dir, "../../../node_modules/.bin/oxlint"),
      "--config",
      config,
      "--format=json",
      input,
    ],
    { cwd: directory },
  )

  const report: { diagnostics: { code?: string; message: string }[] } =
    JSON.parse(result.stdout.toString())

  return {
    status: result.exitCode,
    output: [
      ...report.diagnostics.map(
        (diagnostic) => `${diagnostic.code ?? "lint"}: ${diagnostic.message}`,
      ),
      result.stderr.toString(),
    ].join("\n"),
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
  expect(result.output).toContain('Box as="section"')
})

test("design-system-first covers semantic wrappers and typography without guessing layout", () => {
  const tags = [
    "div",
    "span",
    "main",
    "section",
    "article",
    "aside",
    "header",
    "footer",
    "nav",
    "address",
    "figure",
    "figcaption",
    "search",
    "hgroup",
    "ul",
    "ol",
    "li",
    "dl",
    "dt",
    "dd",
    "p",
    "blockquote",
    "em",
    "mark",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "pre",
  ]

  const typography = lint(
    `const view = <>{condition ? <Box>${tags
      .map((tag) => `<${tag} ref={ref} {...props} />`)
      .join("")}</Box> : items.map(item => <Heading>{item}</Heading>)}</>;`,
    { "yopem-ui/prefer-layout-primitives": "error" },
  )

  expect(typography.status).toBe(1)
  expect(
    typography.output.match(/Preserve native props and refs/g),
  ).toHaveLength(tags.length)

  for (const tag of tags) expect(typography.output).toContain(`<${tag}>`)

  for (const component of [
    "Text",
    "Blockquote",
    "Em",
    "Mark",
    'Heading as="h1"',
    'Heading as="h6"',
    'Box as="pre"',
  ])
    expect(typography.output).toContain(component)
  expect(typography.output).not.toContain("Codeblock")
}, 30_000)

test("native boundaries, framework links, aliases, namespaces, and polymorphic primitives pass", () => {
  const result = lint(
    `import { Box as Layout } from "@/components/ui/box";
import * as UI from "@/components/ui/heading";
import { Link } from "@tanstack/react-router";
const view = <><Layout as="section" /><UI.Heading as="h1" /><Link to="/" /><a href="/" /><button /><input /><form /><label /><table><tbody><tr><td /></tr></tbody></table><code /><strong /><br /><img /><svg><text /><g /></svg><custom-widget /><Section /><foreignObject><div /></foreignObject></>;`,
    { "yopem-ui/prefer-layout-primitives": "error" },
  )

  expect(result.status).toBe(1)
  expect(result.output.match(/Use /g)).toHaveLength(1)
  expect(result.output).toContain("<div>")
})

test("registry and router Link are excluded from default styling contracts", () => {
  const result = lint(
    `import { Link as NativeLink } from "@/components/ui/link";
import { Link } from "@tanstack/react-router";
import * as UI from "@/components/ui/link";
import * as sx from "@stylexjs/stylex";
const styles = sx.create({ link: { color: "red" } });
const view = <><NativeLink style={{ color: "red" }} xstyle={styles.link} /><UI.Link css={{ color: "red" }} /><Link {...sx.props(styles.link)} /></>;`,
    {
      "yopem-ui/no-restyle": "error",
      "yopem-ui/enforce-styling-methods": "error",
    },
  )

  expect(result.status).toBe(0)
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

test("unused StyleX styles report only unreferenced top-level keys", () => {
  const result = lint(
    `import { create as make } from "@stylexjs/stylex";
const styles = make({ used: { color: "red" }, unused: { color: "blue" }, dynamic: (size) => ({ width: size }) });
const view = <div {...styles.used} />;
styles.dynamic(4);`,
    { "yopem-ui/no-unused-stylex-styles": "error" },
  )

  expect(result.status).toBe(1)
  expect(result.output).toContain('StyleX style "unused" is unused')
  expect(result.output.match(/is unused/g)).toHaveLength(1)
})

test("unused StyleX styles resolve scopes, quoted keys, and forward references", () => {
  const result = lint(
    `import * as sx from "@stylexjs/stylex";
const view = <div xstyle={styles["used"]} />;
const styles = sx.create({ "used": {}, unused: {} });
function nested() {
  const styles = sx.create({ used: {}, unused: {} });
  return styles.unused;
}
function shadow(sx) {
  const styles = sx.create({ ignored: {} });
}`,
    { "yopem-ui/no-unused-stylex-styles": "error" },
  )

  expect(result.status).toBe(1)
  expect(result.output).toContain('StyleX style "unused" is unused')
  expect(result.output).toContain('StyleX style "used" is unused')
  expect(result.output.match(/is unused/g)).toHaveLength(2)
  expect(result.output).not.toContain('StyleX style "ignored"')
})

test("unused StyleX styles skip exports, escaping objects, and dynamic access", () => {
  const result = lint(
    `import stylex from "@stylexjs/stylex";
export const exported = stylex.create({ root: {} });
const named = stylex.create({ root: {} });
export { named };
const passed = stylex.create({ root: {} });
consume(passed);
const dynamic = stylex.create({ root: {} });
consume(dynamic[key]);
const destructured = stylex.create({ root: {} });
const { root } = destructured;
const computed = stylex.create({ [key]: {}, root: {} });
const spread = stylex.create({ ...external, root: {} });`,
    { "yopem-ui/no-unused-stylex-styles": "error" },
  )

  expect(result.status).toBe(0)
})

test("unused StyleX styles detect entirely unused declarations and ignore unrelated create calls", () => {
  const result = lint(
    `import * as stylex from "@stylexjs/stylex";
const styles = stylex.create({ first: {}, second: {} });
const unrelated = other.create({ ignored: {} });
const create = "otherMethod";
const computed = stylex[create]({ ignored: {} });`,
    { "yopem-ui/no-unused-stylex-styles": "error" },
  )

  expect(result.status).toBe(1)
  expect(result.output.match(/is unused/g)).toHaveLength(2)
  expect(result.output).not.toContain('StyleX style "ignored"')
})

test("unused StyleX styles remain outside recommended rules", () => {
  expect(Object.keys(recommendedRules)).not.toContain(
    "yopem-ui/no-unused-stylex-styles",
  )
})

test("new rules remain opt-in", () => {
  const result = lint(
    `${imports}
const styles = sx.create({ button: { color: "#fff" }, unused: {} });
const a = <Action xstyle={styles.button} />;`,
    {},
  )

  expect(result.status).toBe(0)
})
