import * as stylex from "@stylexjs/stylex"
import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { resolve } from "node:path"
import { runInNewContext } from "node:vm"
import { jsx } from "react/jsx-runtime"

const root = resolve(import.meta.dir, "../../..")
const docsRequire = createRequire(resolve(root, "apps/docs/package.json"))
const compilerRequire = createRequire(docsRequire.resolve("@stylexjs/unplugin"))
const { transformSync } = compilerRequire("@babel/core")
const plugin = compilerRequire("@stylexjs/babel-plugin")
const transpiler = new Bun.Transpiler({
  loader: "tsx",
  tsconfig: { compilerOptions: { jsx: "react", jsxFactory: "jsx" } },
})

function compile(source: string, filename: string) {
  return transformSync(transpiler.transformSync(source), {
    filename,
    plugins: [
      [
        plugin,
        {
          dev: false,
          runtimeInjection: false,
          unstable_moduleResolution: { type: "commonJS", rootDir: root },
        },
      ],
    ],
  })
}

const tokenPath = resolve(root, "packages/registry/src/styles/tokens.stylex.ts")
const tokenResult = compile(readFileSync(tokenPath, "utf8"), tokenPath)
const css = tokenResult.metadata.stylex
  .map((entry: [string, { ltr: string }]) => entry[1].ltr)
  .join("\n")

function evaluate(
  code: string,
  bindings: Record<string, unknown>,
  result: string,
) {
  return runInNewContext(
    `${code.replace(/import[\s\S]*?from\s*["'][^"']+["'];?/g, "").replace(/export /g, "")}\n;(${result})`,
    bindings,
  )
}

const native = evaluate(
  tokenResult.code,
  { stylex },
  "{ tokens, lightTheme, darkTheme, rootStyles, themeMarker }",
)
const themePath = resolve(root, "packages/registry/src/theme/theme.tsx")
const runtime = evaluate(
  compile(readFileSync(themePath, "utf8"), themePath).code,
  { ...native, stylex, jsx, _jsx: jsx },
  "{ ThemeScript, getRootThemeProps, themeConfig }",
)

function runScript(
  storage: string | null,
  dark: boolean,
  blocked = false,
  storageKey?: string,
) {
  const classes = new Set<string>()
  const document = {
    documentElement: {
      dataset: { theme: "" },
      classList: {
        add: (...names: string[]) => names.forEach((name) => classes.add(name)),
        remove: (...names: string[]) =>
          names.forEach((name) => classes.delete(name)),
      },
    },
  }
  const element = runtime.ThemeScript({ nonce: "test-nonce", storageKey })
  runInNewContext(element.props.dangerouslySetInnerHTML.__html, {
    document,
    matchMedia: () => ({ matches: dark }),
    localStorage: {
      getItem: () => {
        if (blocked) throw new Error("denied")
        return storage
      },
    },
  })
  return { document, classes, element }
}

describe("native foundation", () => {
  test("compiler emits named CSS variables and native root defaults", () => {
    expect(native.tokens["--primary"]).toBe("var(--primary)")
    expect(css).toContain(":root,")
    expect(css).toContain("--primary:oklch(26.9% 0 none)")
    expect(css).toContain("--primary:oklch(97% 0 none)")
    expect(css).not.toContain("--primary:var(--primary)")
    const finalCSS = plugin.processStylexRules(tokenResult.metadata.stylex)
    expect(finalCSS).toContain("background-color:var(--background)")
    expect(finalCSS).toContain("color:var(--foreground)")
    expect(
      readFileSync(
        resolve(root, "packages/registry/src/styles/styles.css"),
        "utf8",
      ),
    ).not.toContain("--primary:")
  })

  test("imported marker works, but imported constant spreads cannot extend dark themes", () => {
    const result = compile(
      `import * as stylex from '@stylexjs/stylex'; import { tokens, darkValues, themeMarker } from './tokens.stylex'; export const brand = stylex.createTheme(tokens, { ...darkValues, '--primary': 'plum' }); export const styles = stylex.create({ item: { color: { default: 'red', [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]: 'blue' } } });`,
      resolve(root, "packages/registry/src/styles/consumer.stylex.ts"),
    )
    const rules = result.metadata.stylex
      .map((entry: [string, { ltr: string }]) => entry[1].ltr)
      .join("\n")
    expect(rules).toContain("--primary:plum")
    // Imported object spreads are not expanded by StyleX 0.19. Customize in tokens.stylex.ts.
    expect(rules).not.toContain("--foreground:")
    expect(rules).toContain("blue")
    expect(rules).toContain(
      stylex.props(native.themeMarker).className ?? "missing-marker",
    )
  })

  test("root props and initial script agree for persisted dark mode", () => {
    const result = runScript("dark", false)
    expect(result.document.documentElement.dataset.theme).toBe("dark")
    expect([...result.classes].sort()).toEqual(
      runtime.getRootThemeProps("dark").className.split(" ").sort(),
    )
    expect(result.element.props.nonce).toBe("test-nonce")
  })

  test("system works with blocked storage; invalid saved preferences use system", () => {
    expect(
      runScript(null, true, true).document.documentElement.dataset.theme,
    ).toBe("dark")
    expect(
      runScript("invalid", true).document.documentElement.dataset.theme,
    ).toBe("dark")
    expect(
      runScript("light", true).document.documentElement.dataset.theme,
    ).toBe("light")
  })

  test("script safely serializes storage keys", () => {
    const { element } = runScript(
      null,
      false,
      false,
      "</script><script>alert(1)</script>",
    )
    expect(element.props.dangerouslySetInnerHTML.__html).not.toContain(
      "</script>",
    )
  })

  test("complete custom dark values preserve dark palette and StyleX last-theme precedence", () => {
    const source = `${readFileSync(tokenPath, "utf8")}\nexport const custom = stylex.createTheme(tokens, { ...darkValues, '--primary': 'rebeccapurple' }); export const partial = stylex.createTheme(tokens, { '--primary': 'red' });`
    const result = compile(source, tokenPath)
    const compiled = evaluate(
      result.code,
      { stylex },
      "{ darkTheme, custom, partial }",
    )
    expect(stylex.props(compiled.darkTheme, compiled.custom)).toEqual(
      stylex.props(compiled.custom),
    )
    const rules = result.metadata.stylex.map(
      (entry: [string, { ltr: string }]) => entry[1].ltr,
    )
    expect(
      rules.find((rule: string) => rule.includes("--primary:rebeccapurple")),
    ).toContain("--foreground:oklch(97% 0 none)")
    expect(
      rules.find((rule: string) => rule.includes("--primary:red")),
    ).not.toContain("--background:")
    expect(stylex.props(compiled.darkTheme, compiled.partial)).toEqual(
      stylex.props(compiled.partial),
    )
  })
})
