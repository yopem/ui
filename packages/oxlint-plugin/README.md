# @yopem-ui/oxlint-plugin

This plugin provides Oxlint rules for Yopem UI projects. Run
`bunx @yopem-ui/cli init` to install and configure it automatically. The
published entry point uses JavaScript. Oxlint can load it through Node from
`node_modules`.

## Rules

| Rule                       | Default     | Purpose                                                                                             |
| -------------------------- | ----------- | --------------------------------------------------------------------------------------------------- |
| `prefer-layout-primitives` | Recommended | Use layout and typography components while preserving native semantics.                             |
| `no-restyle`               | Recommended | Limit `xstyle` and supported style slots on imported UI components. Use `variant` and `size` first. |
| `enforce-styling-methods`  | Recommended | Permit `xstyle` and `className`. Reject other component styling methods by default.                 |
| `static-stylex`            | Recommended | Require static object shapes and keys in `stylex.create`.                                           |
| `no-raw-stylex-colors`     | CLI init    | Use design tokens instead of literal hex colors and CSS color functions.                            |
| `no-unused-stylex-styles`  | Off         | Report unused keys in local StyleX declarations.                                                    |
| `atoms`                    | Off         | Permit, reject, or require StyleX atoms.                                                            |

See [rule examples and configuration](https://ui.yopem.com/docs/lint) for
accepted and rejected code for every rule.

## Design-system-first (recommended)

The `yopem-ui/prefer-layout-primitives` rule checks native layout and text
elements. Use Box for wrappers. Use `Box render={<section />}` or another
semantic tag for landmarks and lists. Use Text for paragraphs and Blockquote for
quotations. Use Em for emphasis and Mark for marked text. Use
`Heading render={<h1 />}` through `render={<h6 />}` for headings.

Choose layout components for the required layout, not through a CSS heuristic.
Available components include Flex, Stack, HStack, VStack, Grid, Center,
Container, AbsoluteCenter, Bleed, Float, and Wrap.

Use Pre for generic `pre` content. Preserve native props and refs. Use Codeblock
for code displays. Codeblock is not a tag-compatible replacement for `pre`. The
styling rules recognize Pre and all Codeblock parts, including aliased and
namespace imports. Choose Prose and Highlight for the content that they support.

The rule permits native anchors, TanStack Router Link, controls, tables, SVG,
custom elements, and text tags without an equivalent component. Use file
overrides for document shells that require native elements. Default styling
contracts also exclude registry Link. Set `styleComponents` explicitly to
include it.

Set `elements` to replace the default tag list. An empty array, `[]`, disables
tag checks. Disable the rule or use file overrides for copied implementations
and non-DOM JSX renderers. The rule has no automatic fix. Replacements must keep
native semantics, events, and ref types. See the
[full policy](https://ui.yopem.com/docs/lint) for checked tags and examples.

## Style contracts

Default component detection includes all public StyleX components except Link.
This includes AspectRatio, Container, List, ListItem, Pre, Strong, and
Figcaption.

`no-restyle` resolves local styles through arrays, conditional expressions,
logical results, and static string bracket access. It does not check dynamic
keys or imported style contents. The left side of `&&` is a guard, not a style.

The rule checks `controlXstyle` on Input, Textarea, and AutocompleteInput. It
checks `surfaceXstyle` on SheetPopup. Slots inherit the component policy. A
contract pattern such as `^Input\\.controlXstyle$` selects a separate slot
policy. In JSON, escape the backslash. Put specific slot contracts after broad
component patterns. Slot contracts do not change the primary `xstyle` policy.

## Unused StyleX styles (opt-in)

Enable `no-unused-stylex-styles` explicitly. Recommended rules and CLI init keep
it disabled:

```json
{
  "jsPlugins": [{ "name": "yopem-ui", "specifier": "@yopem-ui/oxlint-plugin" }],
  "rules": {
    "yopem-ui/no-unused-stylex-styles": "warn"
  }
}
```

The rule reports unused top-level keys in local `stylex.create` declarations,
including function styles. It recognizes import aliases, lexical scope, dot
access, and string-literal bracket access. It does not check exports, objects
passed to other code, or destructured style objects. It does not check dynamic
access or declarations with spreads or computed keys. The rule has no automatic
fix. Removal of a declaration can remove side effects.

## Licence

This project uses the
[MIT license](https://github.com/yopem/ui/blob/main/LICENSE.md).
