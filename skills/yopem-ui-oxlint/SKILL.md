---
name: yopem-ui-oxlint
description: >-
  Configure @yopem-ui/oxlint-plugin and repair Yopem UI lint diagnostics. Use
  for Oxlint plugin registration, recommended rules, copied-component overrides,
  custom import paths, no-restyle policies, static StyleX, semantic color
  tokens, unused styles, layout primitives, and optional atoms policies.
---

# Yopem UI Oxlint plugin

## Inspect the existing policy

Read the project's Oxlint configuration, package scripts, installed component
paths, and plugin version. Preserve unrelated rules and explicit settings. Check
the installed plugin before using options from newer documentation.

The plugin namespace is `yopem-ui`. Registration alone enables no rules. The
recommended preset contains four error rules:

- `yopem-ui/prefer-layout-primitives`
- `yopem-ui/no-restyle`
- `yopem-ui/enforce-styling-methods`
- `yopem-ui/static-stylex`

CLI init also enables `no-raw-stylex-colors`. The preset does not include it.
`no-unused-stylex-styles` and `atoms` remain optional. There is no exported
strict preset. Do not invent one.

## Install and register

Prefer existing CLI setup when initializing an app. Use the `yopem-ui-cli` skill
for that workflow. For manual setup, choose the project's package manager:

```sh
bun add -D oxlint @yopem-ui/oxlint-plugin
npm install -D oxlint @yopem-ui/oxlint-plugin
pnpm add -D oxlint @yopem-ui/oxlint-plugin
yarn add -D oxlint @yopem-ui/oxlint-plugin
```

Merge this example into `.oxlintrc.json`. It matches the five-rule CLI default,
not only the four-rule preset:

```json
{
  "jsPlugins": [{ "name": "yopem-ui", "specifier": "@yopem-ui/oxlint-plugin" }],
  "rules": {
    "yopem-ui/prefer-layout-primitives": "error",
    "yopem-ui/no-restyle": "error",
    "yopem-ui/enforce-styling-methods": "error",
    "yopem-ui/static-stylex": "error",
    "yopem-ui/no-raw-stylex-colors": "error"
  },
  "overrides": [
    {
      "files": ["src/components/ui/**/*.{tsx,jsx}"],
      "rules": {
        "yopem-ui/prefer-layout-primitives": "off",
        "yopem-ui/no-restyle": "off",
        "yopem-ui/enforce-styling-methods": "off",
        "yopem-ui/static-stylex": "off",
        "yopem-ui/no-raw-stylex-colors": "off"
      }
    }
  ]
}
```

Adjust the override to the actual copied-source directory. Keep checks enabled
for application code. Do not replace an existing configuration with this
example. For JavaScript configuration, the plugin exposes
`configs.recommended.rules` and named `recommendedRules`; plugin registration is
still required.

## Repair diagnostics

| Rule                       | Repair                                                                                                   |
| -------------------------- | -------------------------------------------------------------------------------------------------------- |
| `prefer-layout-primitives` | Use the named layout or typography primitive. Preserve semantics, props, events, and refs.               |
| `no-restyle`               | Prefer `variant` and `size`. Keep overrides within the project's allowed properties.                     |
| `enforce-styling-methods`  | Pass StyleX through `xstyle` on recognized components. Keep native/framework styles on `stylex.props`.   |
| `static-stylex`            | Use literal object shapes. Remove spreads and unsupported computed keys from checked StyleX definitions. |
| `no-raw-stylex-colors`     | Replace reported literal colors with semantic token references.                                          |
| `no-unused-stylex-styles`  | Remove unused top-level style keys after checking their references and value side effects.               |
| `atoms`                    | Follow the configured atoms mode. Verify compiler setup before enforcing atoms.                          |

These rules do not provide automatic fixes. Do not rely on `--fix` to perform
these repairs. Fix the source contract instead of weakening checks.

### Layout and semantic elements

Use `Box render={<section />}` for sections, and preserve list tags through
`render`. Use `Text` for paragraphs and `Heading render={<h1 />}` through h6 for
headings. Use `Box render={<pre />}` for generic preformatted content. Codeblock
adds a wrapper and toolbar; it cannot replace every native pre ref.

The rule checks supported native tags regardless of styling or props. Native
markup inside `render` is permitted. Native controls, tables, SVG, metadata,
anchors, `strong`, and inline `code` are not default replacement targets.

Use narrow file overrides for primitive implementations or non-DOM JSX
renderers. A filename or `data-slot` does not create an automatic exemption. Do
not globally turn off the rule to avoid migrating one file.

### Styling methods and source paths

The default method policy permits `xstyle` and `className`. It rejects `css`,
authored React `style`, and direct StyleX-prop spreading on recognized
components. A stricter project can reject `className` through
`methods.className: false`. Keep component support for consumer `className` even
when app usage is restricted.

`no-restyle` and `enforce-styling-methods` recognize imported components from
these default source prefixes:

```json
["@/components/ui/", "@registry/components/ui/", "@yopem-ui/ui"]
```

The last entry is a detection pattern, not a component package to install.
Registry Link is excluded from the default component-name set.

For custom aliases or shared packages, set `componentSources` on both rules. The
option replaces defaults. Include every source prefix the project uses. The
`styleComponents` option also replaces its default name list.

For example, merge this option into each rule's existing options:

```json
{
  "componentSources": ["@/components/ui/", "@acme/ui/components/ui/"]
}
```

### Property policy

`no-restyle` defaults to `allow: ["layout"]`. Its layout category matches
`margin`, `inlineSize`, `blockSize`, `width`, and `height` prefixes. It does not
automatically permit `display`, `alignItems`, padding, or gap. Use the
appropriate layout primitive before adding another override.

Allow and deny entries accept exact properties, wildcard patterns, or
categories. Matching deny entries win. An empty allow list rejects all checked
properties. Component contracts use regex `pattern` values; the last matching
contract wins. Unspecified contract fields inherit the global policy.

Do not assume imported style contents, arbitrary prop spreads, dynamic member
access, or `controlXstyle` receive the same checks as explicit local `xstyle`. A
passing lint run does not prove every override follows policy.

### Static styles, colors, and unused keys

`static-stylex` permits supported imported StyleX `when` condition keys. It is
not a replacement for the StyleX compiler. Keep theme value spreads in the token
module and use a narrow boundary override when required.

`no-raw-stylex-colors` checks selected color properties and literal formats. It
is not a complete CSS color parser. Use semantic tokens even for values the rule
does not report, including colors inside shadows or gradients.

Enable unused-style checks separately when needed:

```json
{
  "yopem-ui/no-unused-stylex-styles": "warn"
}
```

The unused-style rule is conservative around exported objects, escaping values,
and dynamic access. A passing result does not prove every style reaches the DOM.

### Atoms are optional

Do not install an atoms compiler for ordinary Yopem UI usage. The default
`atoms` mode is `allow`. `disallow` rejects imports from the configured source.
Use `enforce` only when the project already has a compatible atoms workflow.

Install the atoms package and configure StyleX compilation before enforcement.
Set `source` when atoms come from a custom wrapper. Enforcement checks atoms
references, not the validity of every resolved atom. Do not put atoms inside
`stylex.create`.

## Validate repairs

Use the project's existing lint script when available. Otherwise, choose one
installed-binary command:

```sh
bunx oxlint .
npm exec -- oxlint .
pnpm exec oxlint .
yarn exec oxlint .
```

Run the same failing check after repair. Run the project's format, typecheck,
and build commands for source changes. Exercise affected UI behavior with
pointer and keyboard input. A lint result does not establish accessibility or
runtime correctness. Report remaining diagnostics and skipped checks.

See the [lint guide](https://ui.yopem.com/docs/lint.md) for all rule options.
Use the `yopem-ui` skill for component and StyleX composition.
