import type * as StyleProps from "@registry/lib/style-props"

import { mergeStyleProps, stylexProps } from "@registry/lib/stylex"
import * as stylex from "@stylexjs/stylex"
import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { resolve } from "node:path"
import { runInNewContext } from "node:vm"
import * as React from "react"
import ts from "typescript-api"

import { testStylePropsContract } from "./style-props-contract"

const root = resolve(import.meta.dirname, "../../..")
const source = readFileSync(resolve(root, "src/components/ui/box.tsx"), "utf8")
const { core }: { core: typeof StyleProps } = createRequire(import.meta.url)(
  resolve(root, "test/lib/style-props-fixture.ts"),
)

function renderBox(props: Record<string, unknown>) {
  const exports: Record<string, unknown> = {}
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ESNext,
    },
  }).outputText
  runInNewContext(code, {
    exports,
    require(name: string) {
      if (name === "@registry/lib/style-props") return core
      if (name === "@registry/lib/stylex")
        return { mergeStyleProps, stylexProps }
      if (name === "react") return React
      throw new Error(`Unexpected import: ${name}`)
    },
  })
  if (typeof exports.Box !== "function") throw new Error("Missing Box export")
  const element: unknown = exports.Box(props)
  if (!React.isValidElement<Record<string, unknown>>(element))
    throw new Error("Box did not return an element")
  return element
}

test("Box preserves native attributes without dropping unrelated CSS properties", () => {
  const image = renderBox({
    as: "img",
    width: "40",
    height: "24",
    content: '"preview"',
  })
  expect(image.type).toBe("img")
  expect(image.props.width).toBe("40")
  expect(image.props.height).toBe("24")
  expect(image.props.style).toEqual(
    stylex.props(core.resolveStyleProps({ content: '"preview"' })).style,
  )
  const input = renderBox({ as: "input", size: 12, width: 4 })
  expect(input.props.size).toBe(12)
  expect(input.props.style).toEqual(
    stylex.props(core.resolveStyleProps({ width: 4 })).style,
  )
  const meta = renderBox({ as: "meta", content: "Description", width: 4 })
  expect(meta.props.content).toBe("Description")
  expect(meta.props.style).toEqual(
    stylex.props(core.resolveStyleProps({ width: 4 })).style,
  )
})

test("Box preserves refs, handlers, slots and inline style precedence", () => {
  const ref = React.createRef<HTMLButtonElement>()
  function onClick() {
    return "clicked"
  }
  const element = renderBox({
    as: "button",
    ref,
    onClick,
    p: 4,
    "data-slot": "custom",
    style: { padding: "7px" },
  })
  expect(element.type).toBe("button")
  expect(element.props.ref).toBe(ref)
  expect(element.props.onClick).toBe(onClick)
  expect(element.props["data-slot"]).toBe("custom")
  expect(element.props.style).toEqual(
    expect.objectContaining({ padding: "7px" }),
  )
  expect(element.props).not.toHaveProperty("p")
})

testStylePropsContract("box")

test("Box keeps native tag props, refs, and event types", () => {
  const filename = resolve(root, "src/box-type-contract.tsx")
  const config = ts.readConfigFile(
    resolve(root, "tsconfig.json"),
    ts.sys.readFile,
  )
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root)
  const host = ts.createCompilerHost(parsed.options)
  const getSourceFile = host.getSourceFile.bind(host)
  const example = `
    import { createRef } from "react"
    import { Box, type BoxProps } from "@registry/components/ui/box"
    import { Center } from "@registry/components/ui/center"
    import { Flex } from "@registry/components/ui/flex"
    import { Grid } from "@registry/components/ui/grid"
    import { HStack } from "@registry/components/ui/hstack"
    import { Stack } from "@registry/components/ui/stack"
    import { VStack } from "@registry/components/ui/vstack"

    const divRef = createRef<HTMLDivElement>()
    const inputRef = createRef<HTMLInputElement>()
    const flexRef = createRef<HTMLDivElement>()
    export const valid = <>
      <Box ref={divRef} width={4} onClick={event => event.currentTarget.dataset.clicked = "true"} />
      <Box as="p" onClick={event => event.currentTarget.textContent} />
      <Box as="input" ref={inputRef} size={12} onChange={event => event.currentTarget.value} />
      <Box as="img" alt="Preview" src="/preview.png" width={40} height={24} />
      <Box as="img" alt="Preview" width="40" height="24" />
      <Box as="meta" name="description" content="Description" />
      <Flex ref={flexRef} onClick={event => event.currentTarget.dataset.clicked = "true"} display={{ base: "block", md: "flex" }} />
      <VStack gap={2} />
      <HStack alignItems="stretch" />
      <Stack flexDirection="row" />
      <Grid gridTemplateColumns="repeat(2, 1fr)" />
      <Center minBlockSize="4rem" />
    </>
    export const linkProps: BoxProps<"a"> = { as: "a", href: "/docs" }
    // @ts-expect-error An input cannot receive a div ref.
    export const invalidRef = <Box as="input" ref={divRef} />
    // @ts-expect-error Input size is a native number attribute.
    export const invalidInputSize = <Box as="input" size={{ md: 12 }} />
    // @ts-expect-error Image width is a native string or number attribute.
    export const invalidImageWidth = <Box as="img" width={{ md: 40 }} />
    // @ts-expect-error Meta content is a native string attribute.
    export const invalidMetaContent = <Box as="meta" content={{ md: "Description" }} />
  `
  host.getSourceFile = (
    path,
    languageVersion,
    onError,
    shouldCreateNewSourceFile,
  ) =>
    path === filename
      ? ts.createSourceFile(
          path,
          example,
          languageVersion,
          true,
          ts.ScriptKind.TSX,
        )
      : getSourceFile(path, languageVersion, onError, shouldCreateNewSourceFile)
  const program = ts.createProgram([filename], parsed.options, host)
  const diagnostics = ts
    .getPreEmitDiagnostics(program)
    .filter((diagnostic) =>
      [
        filename,
        resolve(root, "src/components/ui/box.tsx"),
        resolve(root, "src/components/ui/center.tsx"),
        resolve(root, "src/components/ui/flex.tsx"),
        resolve(root, "src/components/ui/grid.tsx"),
        resolve(root, "src/components/ui/hstack.tsx"),
        resolve(root, "src/components/ui/stack.tsx"),
        resolve(root, "src/components/ui/vstack.tsx"),
      ].includes(diagnostic.file?.fileName ?? ""),
    )

  expect(
    diagnostics.map((diagnostic) =>
      ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
    ),
  ).toEqual([])
}, 120000)

test("Box keeps CSS props on div and has no HTML factory", () => {
  expect(source).toContain(
    "export type BoxElement = keyof React.JSX.IntrinsicElements",
  )
  expect(source).toContain("Reflect.deleteProperty(restProps, key)")
  expect(source).toContain("splitStyleProps(restProps)")
  expect(source).toContain('"data-slot": "box"')
  expect(source).not.toContain("useRender")
  expect(source).not.toContain("html.")
})
