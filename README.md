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
bun run test:e2e
bun run test:a11y
bun run build
```

Tests live with their workspace: CLI and Oxlint use `bun:test`; docs and
registry use Playwright for browser and accessibility checks. Turborepo builds
required fixtures and runs workspace tasks in parallel within each phase:

```sh
bun run test && bun run test:e2e && bun run test:a11y
```

After building, run a workspace directly:

```sh
bun run --cwd packages/cli test
bun run --cwd packages/oxlint-plugin test
bun run --cwd apps/docs test:e2e
bun run --cwd apps/docs test:a11y
bun run --cwd packages/registry test:e2e
bun run --cwd packages/registry test:a11y
```

Browser suites use the built docs app on fixed test ports: `3100` for docs and
`3101` for registry. Logs and reports stay in each workspace's `test-results/`.

## License

MIT. See [LICENSE](LICENSE).
