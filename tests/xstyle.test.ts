import { describe, expect, test } from "bun:test"
import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { resolve } from "node:path"
import { runInNewContext } from "node:vm"

const root = resolve(import.meta.dirname, "..")
const registryRequire = createRequire(
  resolve(root, "packages/registry/package.json"),
)
const stylex = registryRequire("@stylexjs/stylex")
const React = registryRequire("react")
const { stylexProps } = registryRequire(
  resolve(root, "packages/registry/src/lib/stylex.ts"),
)
const ts = registryRequire("typescript-api")
const { clsx } = registryRequire("clsx")
const { renderToStaticMarkup } = registryRequire("react-dom/server")
const { mergeProps } = registryRequire("@base-ui/react/merge-props")
const transpiler = new Bun.Transpiler({
  loader: "tsx",
  tsconfig: {
    compilerOptions: { jsx: "react", jsxFactory: "React.createElement" },
  },
})

function evaluate(
  source: string,
  filename: string,
  result: string,
  bindings: Record<string, unknown> = {},
) {
  const compiled = {
    code: execFileSync("node", [resolve(root, "tests/stylex-compile.mjs")], {
      encoding: "utf8",
      input: JSON.stringify({
        source: transpiler.transformSync(
          source.replaceAll(
            "@registry/styles/",
            `${root}/packages/registry/src/styles/`,
          ),
        ),
        filename,
      }),
    }),
  }
  return runInNewContext(
    `${compiled.code
      .replace(/import[\s\S]*?from\s*["'][^"']+["'];?/g, "")
      .replace(/export\s*\{[^}]*\};?/g, "")
      .replace(/export /g, "")}\n;(${result})`,
    {
      ...registryRequire("lucide-react"),
      stylex,
      stylexProps,
      React,
      clsx,
      mergeProps,
      ...bindings,
    },
  )
}

const overrides = evaluate(
  `import * as stylex from '@stylexjs/stylex'; export const overrides = stylex.create({ base: { color: 'red', opacity: 0.25 }, variant: { color: 'blue' }, button: { backgroundColor: 'tomato' }, dynamic: (value) => ({ opacity: value }) });`,
  resolve(root, "tests/xstyle-fixture.tsx"),
  "overrides",
)

function component(
  name: string,
  filename: string,
  bindings: Record<string, unknown> = {},
) {
  const path = resolve(root, "packages/registry/src/components/ui", filename)
  return evaluate(readFileSync(path, "utf8"), path, name, bindings)
}

describe("StyleX overrides", () => {
  test("public props accept nested StyleX overrides and typed primitive callbacks", () => {
    const filename = resolve(
      root,
      "packages/registry/src/xstyle-contract.test.tsx",
    )
    const source = `
      import * as React from 'react';
      import * as stylex from '@stylexjs/stylex';
      import { Button, type ButtonProps } from '@registry/components/ui/button';
      import { Checkbox } from '@registry/components/ui/checkbox';
      import { Input } from '@registry/components/ui/input';
      import { Sidebar } from '@registry/components/ui/sidebar';
      import { Calendar } from '@registry/components/ui/calendar';
      import { ToastProvider } from '@registry/components/ui/toast';
      import type { StyleXProps } from '@registry/lib/stylex';
      const styles = stylex.create({ root: { color: 'red' }, dynamic: (n: number) => ({ opacity: n }) });
      const overrides: StyleXProps = { xstyle: [styles.root, false, [styles.dynamic(0.5)]] };
      const button: ButtonProps = { ...overrides, variant: 'outline', size: 'lg' };
      export const examples = <><Button {...button} ref={React.createRef<HTMLButtonElement>()} />
        <Checkbox {...overrides} className={state => state.checked ? 'checked' : undefined} />
        <Input {...overrides} className={state => state.disabled ? 'disabled' : undefined} />
        <Sidebar {...overrides} /><Calendar {...overrides} /><ToastProvider {...overrides} /></>;
    `
    const configPath = resolve(root, "packages/registry/tsconfig.json")
    const config = ts.readConfigFile(configPath, ts.sys.readFile)
    const parsed = ts.parseJsonConfigFileContent(
      config.config,
      ts.sys,
      resolve(root, "packages/registry"),
    )
    const host = ts.createCompilerHost(parsed.options)
    const getSourceFile = host.getSourceFile.bind(host)
    host.getSourceFile = (path: string, ...args: unknown[]) =>
      path === filename
        ? ts.createSourceFile(
            path,
            source,
            ts.ScriptTarget.Latest,
            true,
            ts.ScriptKind.TSX,
          )
        : getSourceFile(path, ...args)
    const program = ts.createProgram([filename], parsed.options, host)
    const diagnostics = ts
      .getPreEmitDiagnostics(program)
      .filter(
        (diagnostic: { file?: { fileName: string } }) =>
          diagnostic.file?.fileName === filename,
      )
    expect(
      diagnostics.map((diagnostic: { messageText: unknown }) =>
        ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
      ),
    ).toEqual([])
  }, 20000)

  test("last override wins and retains dynamic variables and legacy className", () => {
    const props = stylexProps(
      "legacy",
      overrides.base,
      overrides.variant,
      overrides.dynamic(0.7),
    )
    expect(props).toEqual({
      ...stylex.props(
        overrides.base,
        overrides.variant,
        overrides.dynamic(0.7),
      ),
      className: clsx(
        stylex.props(overrides.base, overrides.variant, overrides.dynamic(0.7))
          .className,
        "legacy",
      ),
    })
    expect(Object.values(props.style ?? {})).toContain(0.7)
    expect(props).not.toHaveProperty("xstyle")
  })

  test("primitive className callback receives actual state with generated classes", () => {
    const callback = (state: { checked: boolean }) =>
      state.checked ? "checked" : "unchecked"
    const props = stylexProps(callback, overrides.base, overrides.dynamic(0.5))
    expect(typeof props.className).toBe("function")
    if (typeof props.className !== "function")
      throw new Error("callback was discarded")
    expect(props.className({ checked: true })).toContain("checked")
    expect(props.className({ checked: false })).toContain("unchecked")
    expect(props.className({ checked: true })).toContain(
      stylex.props(overrides.base, overrides.dynamic(0.5)).className,
    )
    expect(props.style).toEqual(stylex.props(overrides.dynamic(0.5)).style)
  })

  test("Button consumes xstyle after size and variant, preserving ref and handlers", () => {
    const { Button, styles, sizeStyles, variantStyles } = component(
      "{ Button, styles, sizeStyles, variantStyles }",
      "button.tsx",
      {
        useRender: ({
          defaultTagName,
          props,
        }: {
          defaultTagName: string
          props: Record<string, unknown>
        }) => React.createElement(defaultTagName, props),
      },
    )
    let clicks = 0
    const onClick = () => {
      clicks += 1
    }
    const ref = React.createRef()
    const props = {
      variant: "outline",
      size: "lg",
      className: "legacy",
      xstyle: [overrides.button, overrides.dynamic(0.6)],
      onClick,
      ref,
    }
    const element = Button(props)
    expect(element.props).not.toHaveProperty("xstyle")
    expect(element.props.className).toBe(
      stylexProps(
        "legacy",
        styles.root,
        sizeStyles.lg,
        variantStyles.outline,
        props.xstyle,
      ).className,
    )
    expect(element.props.style).toEqual(stylex.props(props.xstyle).style)
    expect(element.props.ref).toBe(ref)
    element.props.onClick({ defaultPrevented: false })
    expect(clicks).toBe(1)
    expect(element.props["data-slot"]).toBe("button")
    expect(element.props["data-size"]).toBe("lg")
    expect(renderToStaticMarkup(element)).not.toContain("xstyle")
  })

  test("Checkbox consumes xstyle without losing primitive state callbacks", () => {
    const Checkbox = component("Checkbox", "checkbox.tsx", {
      CheckboxPrimitive: {
        Root: "checkbox-root",
        Indicator: "checkbox-indicator",
      },
    })
    const onCheckedChange = () => undefined
    const props = {
      xstyle: overrides.dynamic(0.4),
      className: (state: { checked: boolean }) =>
        state.checked ? "checked" : "unchecked",
      onCheckedChange,
    }
    const element = Checkbox(props)
    expect(element.props).not.toHaveProperty("xstyle")
    expect(element.props.className({ checked: true })).toContain("checked")
    expect(element.props.style).toEqual(stylex.props(props.xstyle).style)
    expect(element.props.onCheckedChange).toBe(onCheckedChange)
    expect(element.props["data-slot"]).toBe("checkbox")
  })
  test("Input and Textarea expose independent wrapper overrides, including unstyled mode", () => {
    for (const name of ["Input", "Textarea"]) {
      const Control = component(name, `${name.toLowerCase()}.tsx`, {
        InputPrimitive: "input-primitive",
        FieldPrimitive: { Control: "field-control" },
      })
      const controlXstyle = overrides.dynamic(0.6)
      for (const unstyled of [false, true]) {
        const element = Control({ controlXstyle, unstyled })
        expect(element.props.style).toEqual(stylex.props(controlXstyle).style)
        expect(element.props).not.toHaveProperty("controlXstyle")
        expect(element.props.children.props).not.toHaveProperty("controlXstyle")
      }
    }
  })
  test("Input targets control and preserves primitive callbacks and native variables", () => {
    const Input = component("Input", "input.tsx", {
      InputPrimitive: "input-primitive",
    })
    const xstyle = overrides.dynamic(0.8)
    const onChange = () => undefined
    const element = Input({
      xstyle,
      size: "sm",
      onChange,
      className: (state: { disabled: boolean }) =>
        state.disabled ? "disabled" : "enabled",
    })
    const control = element.props.children
    expect(control.props).not.toHaveProperty("xstyle")
    expect(control.props.className({ disabled: true })).toContain("disabled")
    expect(control.props.onChange).toBe(onChange)
    expect(control.props.style).toEqual(stylex.props(xstyle).style)
    const native = Input({ xstyle, nativeInput: true, className: "legacy" })
    expect(native.props.className).toContain("legacy")
    expect(native.props.children.props.style).toEqual(
      stylex.props(xstyle).style,
    )
    expect(renderToStaticMarkup(native)).not.toContain("xstyle")
  })

  test("Sidebar merges each rendered branch without clobbering mobile styles", () => {
    let isMobile = false
    const Sidebar = component("Sidebar", "sidebar.tsx", {
      React: {
        ...React,
        useContext: () => ({
          isMobile,
          state: "expanded",
          openMobile: true,
          setOpenMobile: () => undefined,
        }),
      },
      Sheet: "sheet",
      SheetPopup: "sheet-popup",
      SheetHeader: "sheet-header",
      SheetTitle: "sheet-title",
      SheetDescription: "sheet-description",
    })
    const xstyle = overrides.dynamic(0.3)
    const fixed = Sidebar({ xstyle, collapsible: "none" })
    expect(fixed.props.style).toEqual(stylex.props(xstyle).style)
    expect(fixed.props).not.toHaveProperty("xstyle")
    const desktop = Sidebar({ xstyle })
    expect(desktop.props.children[1].props.style).toEqual(
      stylex.props(xstyle).style,
    )
    isMobile = true
    const mobile = Sidebar({ xstyle }).props.children
    expect(mobile.props.xstyle.at(-1)).toBe(xstyle)
    expect(stylex.props(mobile.props.xstyle).className).toContain(
      stylex.props(xstyle).className,
    )
    expect(mobile.props.className).toBeUndefined()
  })

  test("Calendar consumes root override and preserves DayPicker callbacks", () => {
    const Calendar = component("Calendar", "calendar.tsx", {
      DayPicker: "day-picker",
    })
    const xstyle = overrides.dynamic(0.9)
    const onSelect = () => undefined
    const element = Calendar({ xstyle, onSelect })
    expect(element.props).not.toHaveProperty("xstyle")
    expect(element.props.style).toEqual(stylex.props(xstyle).style)
    expect(element.props.onSelect).toBe(onSelect)
  })

  test("Toast consumes provider and per-toast overrides after replay variants", () => {
    const rootXstyle = overrides.dynamic(0.2)
    const onClick = () => undefined
    const Toast = {
      createToastManager: () => ({}),
      useToastManager: () => ({
        toasts: [
          {
            id: "toast",
            type: "error",
            updateKey: 1,
            data: { rootProps: { xstyle: rootXstyle, onClick } },
          },
        ],
      }),
      Portal: "toast-portal",
      Viewport: "toast-viewport",
      Root: "toast-root",
      Content: "toast-content",
      Title: "toast-title",
      Description: "toast-description",
    }
    const Toasts = component("Toasts", "toast.tsx", { Toast })
    const root = Toasts({
      position: "bottom-right",
      xstyle: overrides.dynamic(0.8),
    }).props.children.props.children[0]
    expect(root.props).not.toHaveProperty("xstyle")
    expect(root.props.style).toEqual(stylex.props(rootXstyle).style)
    expect(root.props.onClick).toBe(onClick)
  })
})
