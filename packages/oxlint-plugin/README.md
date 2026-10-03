# @yopem-ui/oxlint-plugin

Oxlint rules for Yopem UI projects. `bunx @yopem-ui/cli init` installs and
configures this plugin automatically. The published entry point is JavaScript,
so Oxlint can load it through Node from `node_modules`.

## Design-system-first (recommended)

`yopem-ui/prefer-layout-primitives` checks native layout wrappers and
typography. Use Box for wrappers, `Box as="section"` (or the original semantic
tag) for landmarks and lists, Text for paragraphs, Blockquote for quotations, Em
for emphasis, Mark for marked text, and `Heading as="h1"` through `h6` for
headings. Choose Flex, Stack, HStack, VStack, Grid, Center, Container,
AbsoluteCenter, Bleed, Float, or Wrap by layout intent, not an inferred CSS
heuristic.

Generic `pre` uses `Box as="pre"`; Codeblock is an intentional code display, not
a tag-compatible replacement. Prose and Highlight depend on content intent.
Native anchors, TanStack Router Link, controls, tables, SVG, document shells,
custom elements, and text semantics without an equivalent remain valid. Registry
Link is excluded from default styling contracts too. Explicit `styleComponents`
can opt it back in.

`elements` replaces the default tag list; `[]` disables checks. Disable the rule
or use file overrides for copied implementations and non-DOM JSX renderers. No
autofix: replacements must preserve native semantics, events, and ref types. See
[the full policy](https://ui.yopem.com/docs/lint) for checked tags and examples.

## Unused StyleX styles (opt-in)

Enable `no-unused-stylex-styles` explicitly; recommended rules and CLI init
leave it disabled:

```json
{
  "jsPlugins": [{ "name": "yopem-ui", "specifier": "@yopem-ui/oxlint-plugin" }],
  "rules": {
    "yopem-ui/no-unused-stylex-styles": "warn"
  }
}
```

Reports unused top-level keys in local `stylex.create` declarations, including
function styles. Recognizes import aliases, lexical scope, dot access, and
string-literal bracket access. Skips exports, escaping or destructured style
objects, dynamic access, and declarations with spreads or computed keys. No
autofix: removing a declaration can remove side effects.

## Licence

This project is licensed under the terms of the
[MIT license](https://github.com/yopem/ui/blob/main/LICENSE.md).
