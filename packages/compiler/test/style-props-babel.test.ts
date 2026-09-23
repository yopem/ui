import type { PluginItem, TransformOptions } from "@babel/core"

import { transformSync } from "@babel/core"
import plugin from "@yopem-ui/compiler/babel"
import { describe, expect, test } from "bun:test"
import { createRequire } from "node:module"
import { resolve } from "node:path"

const require = createRequire(
  resolve(import.meta.dirname, "../../../apps/docs/package.json"),
)
const compilerRequire = createRequire(require.resolve("@stylexjs/unplugin"))
const stylexPlugin = compilerRequire("@stylexjs/babel-plugin") as PluginItem
const root = resolve(import.meta.dirname, "../../..")

function compile(source: string) {
  const result = transformSync(source, {
    filename: resolve(root, "apps/docs/src/style-props-probe.jsx"),
    parserOpts: { plugins: ["jsx"] },
    plugins: [
      plugin,
      [
        stylexPlugin,
        {
          dev: false,
          runtimeInjection: false,
          unstable_moduleResolution: { type: "commonJS", rootDir: root },
        },
      ],
    ],
  } satisfies TransformOptions)
  const stylex =
    result?.metadata && "stylex" in result.metadata
      ? result.metadata.stylex
      : undefined
  if (!result?.code || !Array.isArray(stylex))
    throw new Error("StyleX compilation returned no CSS")
  const rules: unknown[] = stylex
  if (
    !rules.every(
      (rule: unknown): rule is [string, { ltr: string }] =>
        Array.isArray(rule) &&
        typeof rule[0] === "string" &&
        typeof rule[1] === "object" &&
        rule[1] !== null &&
        "ltr" in rule[1] &&
        typeof rule[1].ltr === "string",
    )
  )
    throw new Error("StyleX compilation returned no CSS")
  return { code: result.code, stylex: rules }
}

describe("static style props compiler", () => {
  test("emits StyleX CSS without runtime value variables, preserving composition", () => {
    const result = compile(
      `import { Box } from "@registry/components/ui/box"; const view = <Box id="demo" css={{ color: "red" }} p={2} mx={-1} color={{ base: "blue", md: "green", _hover: "orange" }} _before={{ content: '"x"' }} xstyle={override} />`,
    )
    expect(result.code).not.toContain("--ysp-")
    expect(result.code).not.toContain(" p=")
    expect(result.code).toContain("xstyle={[")
    const css = result.stylex.map((rule) => rule[1].ltr).join(" ")
    expect(css).toContain("padding-block:calc(var(--spacing) * 2)")
    expect(css).toContain("padding-inline:calc(var(--spacing) * 2)")
    expect(css).toContain("color:green")
    expect(css).toContain("::before")
    expect(css).not.toContain("--ysp-")
    expect(result.code).toMatch(/xstyle=\{\[\w+\.s0, \w+\.s1, override\]\}/)
  })

  test("expands single-value padding expressions to matching logical properties", () => {
    const result = compile(
      `import { Button } from "@registry/components/ui/button"; <Button p="calc(1rem + 2px)" />`,
    )
    const css = result.stylex.map((rule) => rule[1].ltr).join(" ")
    expect(css).toContain("padding-block:calc(1rem + 2px)")
    expect(css).toContain("padding-inline:calc(1rem + 2px)")
  })

  test("supports responsive arrays, nested media and pseudo conditions, aliases and custom properties", () => {
    const result = compile(
      `import { Box } from "@registry/components/ui/box"; <Box boxSize={[1, null, 3]} p={[2, undefined, 4]} _hover={{ md: { bgColor: "teal" } }} css={{ "--brand": "red", _osDark: { color: "white" } }} />`,
    )
    const css = result.stylex.map((rule) => rule[1].ltr).join(" ")
    expect(css).toContain("width:calc(var(--spacing) * 3)")
    expect(css).toContain("height:calc(var(--spacing) * 3)")
    expect(css).toContain("background-color:teal")
    expect(css).toMatch(
      /@media \(min-width: 768px\)\{[^}]*:is\(:hover[^}]*\{background-color:teal\}/,
    )
    expect(css).toContain("prefers-color-scheme: dark")
    expect(css).toContain("--brand:red")
  })

  test("compiles scopes, child spacing, and compounded conditions", () => {
    const result = compile(
      `import { Box } from "@registry/components/ui/box"; <Box spaceX={2} spaceY={1} _before={{ md: { color: "red" } }} _focus={{ _hover: { color: "blue" } }} _dark={{ bgColor: "black" }} _motionReduce={{ _print: { opacity: 0 } }} css={null} />`,
    )
    const css = result.stylex.map((rule) => rule[1].ltr).join(" ")
    expect(css).toContain("margin-inline-start:calc(var(--spacing) * 2)")
    expect(css).toContain("margin-top:calc(var(--spacing) * 1)")
    expect(css).toContain("data-theme=dark")
    expect(css).toContain("::before")
    expect(css).toContain("color:blue")
    const scoped = compile(
      `import { Box } from "@registry/components/ui/box"; <Box _hover={{ _before: { color: "red" } }} />`,
    )
      .stylex.map((rule) => rule[1].ltr)
      .join(" ")
    expect(scoped).toMatch(/:hover[^}]*::before\{color:red\}/)
    expect(css).toContain("prefers-reduced-motion: reduce")
    expect(css).toContain(
      "@media print{@media (prefers-reduced-motion: reduce)",
    )
  })

  test("rejects dynamic and unknown styles rather than emitting runtime variables", () => {
    for (const input of [
      "<Box p={size} />",
      "<Box css={{ color: theme }} />",
      "<Box p={{ typo: 2 }} />",
      "<Box _unknown={{ color: 'red' }} />",
      "<Box mdToSm={{ color: 'red' }} />",
      "<Box p={-1} />",
      "<Box {...props} p={1} />",
    ])
      expect(() =>
        compile(`import { Box } from "@registry/components/ui/box"; ${input}`),
      ).toThrow()
  })

  test("leaves native JSX and unrelated components unchanged", () => {
    const source = `import { Box as LocalBox } from "./box";
      const view = <><img width={320} height={240} /><input size={4} /><meta content="description" /><div color="red" p={2} css={{ color: "red" }} /><LocalBox p={2} /><Box p={2} /></>`
    const result = compile(source)
    expect(result.code).toContain("<img width={320} height={240} />")
    expect(result.code).toContain("<input size={4} />")
    expect(result.code).toContain('<meta content="description" />')
    expect(result.code).toContain('<div color="red" p={2} css={{')
    expect(result.code).toContain("<LocalBox p={2} />")
    expect(result.code).toContain("<Box p={2} />")
    expect(result.code).not.toContain("stylex.create")
  })

  test("preserves Box native image, input and meta attributes", () => {
    const result = compile(`import { Box } from "@registry/components/ui/box";
      const view = <><Box as="img" width={320} height={240} p={2} /><Box as="input" size={4} color="red" /><Box as="meta" content="description" /></>`)
    expect(result.code).toContain('as="img" width={320} height={240}')
    expect(result.code).toContain('as="input" size={4}')
    expect(result.code).toContain('as="meta" content="description"')
    expect(result.code).not.toContain("content:")
    expect(result.stylex.map((rule) => rule[1].ltr).join(" ")).toContain(
      "color:red",
    )
  })

  test("preserves semantic props that share CSS property names", () => {
    const result =
      compile(`import { Autocomplete } from "@registry/components/ui/autocomplete";
      import { Command } from "@registry/components/ui/command";
      import { ScrollArea } from "@registry/components/ui/scroll-area";
      const view = <><Autocomplete filter={predicate} /><Command filter={predicate} /><ScrollArea fill scrollbarGutter overscrollContain /></>`)
    expect(result.code).toContain("filter={predicate}")
    expect(result.code).toContain("fill")
    expect(result.code).toContain("scrollbarGutter")
    expect(result.code).toContain("overscrollContain")
    expect(result.code).not.toContain("stylex.create")
  })

  test("compiles imported token references and existing StyleX css", () => {
    const result = compile(`import * as stylex from "@stylexjs/stylex";
      import { tokens } from "../../../packages/registry/src/styles/tokens.stylex";
      import { Box as Panel } from "@registry/components/ui/box";
      const styles = stylex.create({ root: { color: "blue" } });
      const view = <Panel css={styles.root} color={tokens['--muted-foreground']} _hover={{ backgroundColor: tokens["--background"] }} />`)
    expect(result.code).not.toContain("css={")
    expect(result.code).not.toContain("color={tokens")
    expect(result.code).toContain("xstyle={[")
    const css = result.stylex.map((rule) => rule[1].ltr).join(" ")
    expect(css).toContain("color:blue")
    expect(css).toContain("--muted-foreground")
    const composed = compile(`import * as stylex from "@stylexjs/stylex";
      import { Box } from "@registry/components/ui/box";
      const styles = stylex.create({ root: { color: "blue" } });
      const view = <Box css={styles.root} />`)
    expect(composed.code).not.toContain("css={")
    expect(composed.code).toContain("xstyle={")
    expect(composed.stylex.map((rule) => rule[1].ltr).join(" ")).toContain(
      "color:blue",
    )
  })

  test("rejects untrusted style expressions and style-bearing spreads", () => {
    const importBox = 'import { Box } from "@registry/components/ui/box"; '
    for (const source of [
      "<Box color={theme.color} />",
      "<Box color={tokens[key]} />",
      "<Box css={styles[variant]} />",
      "<Box css={other.root} />",
      "<Box {...{ p: 2 }} />",
      "<Box {...{ css: { color: 'red' } }} />",
      "const props = { p: 2 }; <Box {...props} />",
    ])
      expect(() => compile(importBox + source)).toThrow()
  })

  test("compiles workspace-scoped component imports", () => {
    const result = compile(
      'import { Box } from "@yopem-ui/registry/components/ui/box"; <Box p={2} />',
    )
    expect(result.stylex.map((rule) => rule[1].ltr).join(" ")).toContain(
      "padding-block:calc(var(--spacing) * 2)",
    )
  })

  test("leaves non-style JSX alone", () => {
    const result = compile(
      `import { Box } from "@registry/components/ui/box"; <Box id="demo" onClick={handler} xstyle={override} />`,
    )
    expect(result.code).toContain("xstyle={override}")
    expect(result.code).not.toContain("stylex.create")
  })
})
