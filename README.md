# Yopem UI

Source-owned React components built with StyleX and Base UI.

## Style props

Base installation includes `lib/style-props.ts`, its configuration, and
generated StyleX declarations alongside tokens and `stylex.ts`. Keep these files
together and process them with your existing StyleX build. No new runtime
dependency, CSS injection, or application transform is required. The declaration
generator is repository tooling, not part of consumer installation.

Styled component parts accept typed CSS properties and Chakra-style aliases such
as `p`, `px`, `m`, `w`, `bg`, and `rounded`. Component-specific props keep their
existing meaning; for example, `size` still selects a component size.

- **Numbers versus strings:** spacing and dimensions multiply the StyleX
  `--spacing` theme token (default `0.25rem`): `p={4}` means `1rem`, not `4px`.
  Customize `--spacing` in `tokens.stylex.ts`. Use `p="4px"` for literal CSS
  lengths. CSS strings pass through unchanged; strings such as `"4"` are not
  token lookups. Negative numeric margins are allowed; negative padding is
  rejected. Unitless properties such as `opacity` retain their CSS numeric
  meaning.
- **Precedence:** defaults → variants → style props → `xstyle` → explicit inline
  `style`. External `className` follows the CSS cascade; it is not guaranteed to
  win last. `css` accepts a style object or compiled StyleX styles; direct style
  props override matching entries from `css`.
- **Responsive values:** arrays map to `base`, `sm`, `md`, `lg`, `xl`, `2xl`;
  `null` or `undefined` skips an entry. Objects name these breakpoints, for
  example `p={{ base: 2, md: 4 }}`. Breakpoints start at 480, 768, 1024, 1280,
  and 1536 CSS pixels, respectively.
- **Ranges:** `mdOnly` ends before `lg`; `mdDown` means below `md`, not through
  `md`; `mdToXl` spans `md` through the `xl` interval. Reversed ranges are
  rejected. Nested conditions combine, rather than selecting a viewport in JS.
- **Conditional defaults:** provide an explicit `base` value when overriding a
  component default conditionally, for example `p={{ base: 2, md: 4 }}`.
  Conditional-only declarations fall back to `unset`, not the component's
  earlier StyleX default, outside matching conditions.
- **Conditions:** supported keys include `_hover`, `_focusVisible`, `_disabled`,
  `_checked`, `_dark`, `_rtl`, and `_motionReduce`. Use the exported types and
  `style-props-config.ts` for the complete supported set. State conditions style
  existing state; they do not add interaction or accessibility behavior.
- **Typed `css`:** accepts supported properties, aliases, custom properties, and
  condition objects. For other selectors, pass statically authored StyleX styles
  with `css={styles.custom}`; StyleX's compiler validates those selectors. Raw
  objects cannot contain arbitrary selectors, at-rules, or Chakra theme-token
  paths. Unknown properties and conditions throw. Pseudo-elements cannot nest;
  custom properties on pseudo-elements are unsupported.

For custom wrappers, `splitStyleProps(props)` returns `{ domProps, xstyle }`.
Spread only `domProps` onto the underlying element and compose returned `xstyle`
after defaults/variants but before consumer `xstyle`. Alternatively,
`resolveStyleProps(styleProps)` resolves an explicit style object. Import
`StyleProps`, `StyleObject`, and `ResponsiveValue` from `@/lib/style-props`.

## Layout primitives

Use `Box`, `Flex`, `Stack`, `HStack`, `VStack`, `Grid`, and `Center` for layout.
They share the style props above, including responsive values and StyleX
`xstyle` overrides. Use `Link` for anchors, `Paragraph` for paragraphs, and
`Heading` for heading levels. `Box` covers generic containers and other semantic
elements through `as`. There is no HTML component or factory.

```tsx
import { Heading } from "@/components/ui/heading"
import { HStack } from "@/components/ui/hstack"
import { Link } from "@/components/ui/link"
import { Paragraph } from "@/components/ui/paragraph"
import { VStack } from "@/components/ui/vstack"

export function Profile() {
  return (
    <VStack alignItems="stretch" gap={4}>
      <Heading>Profile</Heading>
      <HStack justifyContent="space-between">
        <Paragraph>Account settings</Paragraph>
        <Link href="/settings">Edit</Link>
      </HStack>
    </VStack>
  )
}
```

Docs use these primitives as a consumer application. The local Oxlint plugin
checks docs JSX for native HTML elements and recommends UI primitives. Registry
implementations and test fixtures may use native HTML. Document-shell tags
remain native, as does the non-DOM JSX passed to the social-image renderer.

## Docs JSX linting

Root `.oxlintrc.json` loads local plugin through Oxlint's `jsPlugins`:

```json
{
  "jsPlugins": [
    {
      "name": "yopem-ui",
      "specifier": "./packages/oxlint-plugin/src/index.ts"
    }
  ]
}
```

Docs JSX enables recommended rules at error severity:

| Rule                         | Scope                               | Migration                                                                          |
| ---------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------- |
| `enforce-styling-methods`    | Imported Yopem components           | Fixes direct object styles; offers review suggestions for referenced StyleX styles |
| `no-unsupported-style-props` | Imported Yopem components           | Renames known unsupported aliases                                                  |
| `no-leaked-dom-style-props`  | Native JSX elements                 | Move style props to a Yopem component or filter them before DOM spread             |
| `valid-polymorphic-as`       | `Box` and `Heading`                 | Use a static supported intrinsic tag                                               |
| `static-stylex`              | Renamed or namespace StyleX imports | Replace dynamic keys and spreads with static declarations                          |
| `prefer-ui-primitives`       | Native JSX elements                 | Replace native elements with UI primitives                                         |

Rules resolve renamed and namespace imports. Styling diagnostics stay quiet for
unresolved components and declarations without a safe equivalent style prop.
Direct conversions retain source expressions, responsive arrays, condition
objects, and theme tokens. Existing style-prop collisions stay untouched so
`xstyle` precedence is preserved.

Plugin exports `recommended`, `strict-stylex`, `strict-atoms`, and
`strict-xstyle` configs. JSON projects can apply equivalent rule options:

```json
{
  "rules": {
    "yopem-ui/enforce-styling-methods": "error"
  }
}
```

StyleX-only, atoms-only, and `xstyle`-only projects ban other methods:

```json
{
  "rules": {
    "yopem-ui/enforce-styling-methods": [
      "error",
      {
        "preferStyleProps": false,
        "methods": {
          "atoms": false,
          "className": false,
          "reactStyle": false,
          "stylexStyle": true,
          "xstyle": false
        }
      }
    ]
  }
}
```

Set only `atoms`, `stylexStyle`, or `xstyle` to `true` for its strict mode. A
mixed project can allow selected methods while retaining style-prop preference:

```json
{
  "rules": {
    "yopem-ui/enforce-styling-methods": [
      "error",
      {
        "methods": {
          "className": false,
          "reactStyle": false
        }
      }
    ]
  }
}
```

Use `componentSources`, `styleComponents`, and `atomsImports` for project
aliases or custom components. Defaults cover documented Yopem exports from
`@/components/ui/stylex/*`, `@registry/components/ui/*`, and `@yopem/ui`, plus
the default export from `@stylexjs/atoms` (including renamed imports).

Root-shell override allows `base`, `body`, `head`, `html`, `link`, `meta`,
`script`, `style`, and `title`. `apps/docs/src/lib/og.tsx` excludes
`prefer-ui-primitives` because Satori renders non-DOM JSX. Run `bun run lint`
from repo root.

## Commands

```sh
bun install
bun run dev
bun run registry:build
bun run lint
bun run fmt:check
bun run typecheck
bun run test
bun run test:e2e
bun run test:a11y
bun run build
```

## Workspace

- `apps/docs` — TanStack Start documentation and component previews
- `packages/registry` — canonical component source and registry tooling
- `packages/oxlint-plugin` — reusable UI primitive lint rule and CLI tests

## Acknowledgements

Thanks to [shadcn/ui](https://ui.shadcn.com) for the inspiration and
[coss ui](https://coss.com/ui) for the base styles and example files.

See `CONTRIBUTING.md` for contributor workflow and `LICENSE` for MIT terms.
