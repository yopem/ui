import type * as Core from "@registry/lib/style-props"

import * as config from "@registry/lib/style-props-config"
import * as stylex from "@stylexjs/stylex"
import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { runInNewContext } from "node:vm"

const root = resolve(import.meta.dirname, "../../../..")
const transpiler = new Bun.Transpiler({ loader: "ts" })
const filename = resolve(
  root,
  "packages/registry/src/lib/style-props-styles.ts",
)
const source =
  transpiler.transformSync(readFileSync(filename, "utf8")) +
  `
export const escapeStyles = stylex.create({
  custom: { color: { default: 'red', ':has(> span)': 'purple' }, padding: '3px' },
  override: { padding: '24px' },
  buttonSize: { paddingInline: 'calc(0.75rem - 1px)' },
  spacingDefaults: { paddingInline: '11px', paddingBlock: '7px', marginInline: '13px', marginBlock: '9px' },
  spacingSides: { paddingInlineStart: '11px', paddingInlineEnd: '13px', marginBlockStart: '7px', marginBlockEnd: '9px', paddingLeft: '15px', marginRight: '17px' },
  pseudoSpacing: { '::before': { content: '"Before"', paddingInline: '11px', marginBlock: '7px' } },
});`
const tokensFilename = resolve(
  root,
  "packages/registry/src/styles/tokens.stylex.ts",
)
const tokenSource =
  transpiler.transformSync(readFileSync(tokensFilename, "utf8")) +
  `
export const spaciousTheme = stylex.createTheme(tokens, { ...lightValues, '--spacing': '0.5rem' });`
const compiled: { code: string; tokenCode: string; css: string } = JSON.parse(
  execFileSync(
    "node",
    [
      "--input-type=module",
      "-e",
      `
  import { createRequire } from 'node:module';
  import { readFileSync } from 'node:fs';
  const require = createRequire(${JSON.stringify(resolve(root, "apps/docs/package.json"))});
  const compilerRequire = createRequire(require.resolve('@stylexjs/unplugin'));
  const { transformSync } = compilerRequire('@babel/core');
  const plugin = compilerRequire('@stylexjs/babel-plugin');
  const input = JSON.parse(readFileSync(0, 'utf8'));
  const options = { dev: false, runtimeInjection: false, unstable_moduleResolution: { type: 'commonJS', rootDir: ${JSON.stringify(root)} } };
  const result = transformSync(input.source, { filename: input.filename, plugins: [[plugin, options]] });
  const tokenResult = transformSync(input.tokenSource, { filename: input.tokensFilename, plugins: [[plugin, options]] });
  const rules = [...result.metadata.stylex, ...tokenResult.metadata.stylex].sort((a, b) => a[2] - b[2]);
  process.stdout.write(JSON.stringify({code: result.code, tokenCode: tokenResult.code, css: rules.map(rule => '@layer priority' + String(rule[2]).replace('.', '_') + '{' + rule[1].ltr + '}').join('\\n')}));
`,
    ],
    {
      input: JSON.stringify({ source, filename, tokenSource, tokensFilename }),
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
    },
  ),
)

function executable(code: string) {
  return code
    .replace(/import[\s\S]*?from\s*["'][^"']+["'];?/g, "")
    .replaceAll("export ", "")
}

const styles = runInNewContext(
  `${executable(compiled.code)};({propertyStyles, scopedPropertyStyles, conditionStyles, variableStyles, escapeStyles})`,
  { stylex },
)
const themes = runInNewContext(
  `${executable(compiled.tokenCode)};({tokens, spaciousTheme})`,
  { stylex },
)
export const spacingToken: string = themes.tokens["--spacing"]
export const spaciousThemeProps = stylex.props(themes.spaciousTheme)
export const escapeStyles: Record<
  | "custom"
  | "override"
  | "buttonSize"
  | "spacingDefaults"
  | "spacingSides"
  | "pseudoSpacing",
  stylex.CompiledStyles
> = styles.escapeStyles
const coreSource = readFileSync(
  resolve(root, "packages/registry/src/lib/style-props.ts"),
  "utf8",
)
export const core: typeof Core = runInNewContext(
  `${executable(transpiler.transformSync(coreSource))};({normalizeStyleProps, resolveStyleProps, splitStyleProps, isStyleProp})`,
  { ...config, ...styles, ...themes, stylex },
)
export const css = compiled.css
export const compiledSource = compiled.code

export function resolvedProps(input: unknown, defaults?: unknown) {
  return stylex.props(
    core.resolveStyleProps(defaults),
    core.resolveStyleProps(input),
  )
}
