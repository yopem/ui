# @yopem-ui/oxlint-plugin

Oxlint rules for Yopem UI projects. `bunx @yopem-ui/cli init` installs and
configures this plugin automatically. The published entry point is JavaScript,
so Oxlint can load it through Node from `node_modules`.

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
