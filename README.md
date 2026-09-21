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

## Acknowledgements

Thanks to [shadcn/ui](https://ui.shadcn.com) for the inspiration and
[coss ui](https://coss.com/ui) for the base styles and example files.

See `CONTRIBUTING.md` for contributor workflow and `LICENSE` for MIT terms.
