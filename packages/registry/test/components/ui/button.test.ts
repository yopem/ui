import { expect, test } from "bun:test"
import { resolve } from "node:path"
import ts from "typescript-api"

import { testStylePropsContract } from "./style-props-contract"

testStylePropsContract("button")

test("style props retain component controls and responsive native collisions", () => {
  const root = resolve(import.meta.dirname, "../../..")
  const filename = resolve(root, "src/style-props-component-contract.tsx")
  const config = ts.readConfigFile(
    resolve(root, "tsconfig.json"),
    ts.sys.readFile,
  )
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root)
  const host = ts.createCompilerHost(parsed.options)
  const getSourceFile = host.getSourceFile.bind(host)
  const source = `
    import { Button, type ButtonProps } from "@registry/components/ui/button"
    import { Calendar } from "@registry/components/ui/calendar"
    import { Input } from "@registry/components/ui/input"
    import { DrawerPopup } from "@registry/components/ui/drawer"
    import { MenuItem } from "@registry/components/ui/menu"
    import { ScrollArea } from "@registry/components/ui/scroll-area"
    import { Spinner } from "@registry/components/ui/spinner"
    import { Checkbox } from "@registry/components/ui/checkbox"
    import { TableCell } from "@registry/components/ui/table"
    const props: ButtonProps = { p: 4, color: { base: "red", md: "blue" }, width: ["100%", "auto"], size: "sm", disabled: true }
    export const examples = <>
      <Button {...props} css={{ _hover: { bg: "red" } }} />
      <Calendar mode="single" selected={new Date()} onSelect={date => date?.getTime()} p={2} />
      <Calendar mode="single" required selected={new Date()} onSelect={date => date.getTime()} />
      <Calendar mode="multiple" selected={[]} onSelect={dates => dates?.map(date => date.getTime())} />
      <Calendar mode="multiple" required selected={[]} onSelect={dates => dates.map(date => date.getTime())} />
      <Calendar mode="range" selected={{ from: new Date() }} onSelect={range => range?.from?.getTime()} />
      <Calendar mode="range" required selected={{ from: new Date() }} onSelect={range => range.from?.getTime()} />
      <Input size={12} p={2} disabled width={{ base: "100%", lg: "24rem" }} />
      <DrawerPopup position="bottom" css={{ position: "fixed" }} p={4} />
      <MenuItem inset css={{ inset: 2 }} color={{ md: "red" }} />
      <ScrollArea fill scrollbarGutter css={{ fill: "red", scrollbarGutter: "stable" }} />
      <Spinner size={24} width={{ base: "1rem", md: "2rem" }} color="red" />
      <Checkbox _disabled={{ opacity: 0.4 }} disabled style={state => ({ opacity: state.checked ? 1 : 0.5 })} className={state => state.checked ? "checked" : undefined} />
      <TableCell width={{ base: "100%", md: "20rem" }} />
    </>
    // @ts-expect-error Single selection cannot accept multiple dates.
    export const invalidSingle = <Calendar mode="single" selected={[]} />
    // @ts-expect-error Multiple selection cannot accept a single date.
    export const invalidMultiple = <Calendar mode="multiple" selected={new Date()} />
    // @ts-expect-error Range selection cannot accept a single date.
    export const invalidRange = <Calendar mode="range" selected={new Date()} />
    // @ts-expect-error Required single selection callbacks cannot receive undefined.
    export const invalidRequired = <Calendar mode="single" required selected={new Date()} onSelect={(date: undefined) => date} />
    // @ts-expect-error native disabled remains a boolean
    export const invalidDisabled = <Button disabled={{ base: true }} />
    // @ts-expect-error button size remains its documented variant
    export const invalidSize = <Button size="giant" />
    // @ts-expect-error drawer position remains its placement API
    export const invalidPosition = <DrawerPopup position="fixed" />
    // @ts-expect-error menu inset remains a boolean
    export const invalidInset = <MenuItem inset="2rem" />
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
          source,
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
        resolve(root, "src/components/ui/calendar.tsx"),
        resolve(root, "src/lib/style-props.ts"),
      ].includes(diagnostic.file?.fileName ?? ""),
    )
  expect(
    diagnostics.map((diagnostic) =>
      ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
    ),
  ).toEqual([])
}, 120000)
