# Yopem UI

Source-owned React components built with StyleX and Base UI. Copy components
into your app; first release does not publish a component package.

## Install source

From a Vite React, React Router (client or framework), client TanStack Router,
TanStack Start, Next.js App Router, or Astro project, initialize StyleX and add
a component:

```sh
bunx @yopem-ui/cli init
bunx @yopem-ui/cli add button
bunx @yopem-ui/cli update button
```

`init` installs tokens, reset CSS, and StyleX helpers, configures build plugins
and aliases, and wires root styles. It stops on conflicting configurations.
`update` preserves locally edited files unless passed `--force`. CLI is not yet
published; commands work after release. See
[installation](https://ui.yopem.com/docs/installation).

## Styling

Use `Box` for generic containers and semantic tags through `as`. Layout
primitives such as `Flex`, `Stack`, and `Grid` provide additional defaults.
Author styles with `stylex.create` and pass them as `xstyle` after component
defaults and variants. Use `stylex.props` on native or framework elements.
Components expose `className` for external CSS integration; this documentation
app styles itself with StyleX only. No CSS-property aliases or style-props
compiler are installed.

```tsx
import { Box } from "@/components/ui/box"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({ section: { padding: "1rem" } })

export function Profile() {
  return (
    <Box as="section" xstyle={styles.section}>
      Profile
    </Box>
  )
}
```

See [styling](https://ui.yopem.com/docs/styling) and
[lint rules](https://ui.yopem.com/docs/lint) for details.

## Development

```sh
bun install
bun run dev
bun run registry:build
bun run lint && bun run fmt:check && bun run typecheck
bun run test
bun run test:a11y
bun run build
```

## License

MIT. See [LICENSE](LICENSE).
