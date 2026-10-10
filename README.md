# Yopem UI

Yopem UI provides source-owned React components with StyleX and Base UI. Copy
components into your app. The first release does not publish a component
package.

## Install source

Start with a supported React project. Supported frameworks are Vite React, React
Router, client TanStack Router, TanStack Start, Next.js App Router, and Astro.
React Router supports client mode and framework mode. Initialize StyleX before
you add a component:

```sh
bunx @yopem-ui/cli init --dry-run
bunx @yopem-ui/cli init
bunx @yopem-ui/cli add button
bunx @yopem-ui/cli update button
```

The `init` command installs tokens, reset CSS, and StyleX helpers. It configures
build plugins, aliases, and root styles. It stops if existing configuration
conflicts with required settings.

Use `--dry-run` with `init`, `add`, or `update` to validate and preview changes.
A dry run does not write files or run a package manager. The init preview lists
absolute target paths, configuration changes, manifest exports and scripts,
prerequisites, and pending dependencies. It groups dependencies by app or shared
UI package (`--ui <path>`).

The CLI keeps compatible dependency specifications. It does not run a package
manager if source is unchanged and dependencies meet requirements. It does not
assume compatibility for unknown dependency specifications.

The `update` command keeps locally edited files unless you pass `--force`. The
`ui.json` manifest records registry URLs and item versions for each tracked
file. This includes transitive and overlapping file owners. The CLI also
supports legacy version-1 manifests. It warns before it applies a known file
from a different registry. Modified or tracked files that it skips keep their
original provenance.

Use `--registry <URL>` to select another registry. The URL must use HTTPS,
except for local HTTP. It must not contain credentials, query strings, or
fragments. The CLI rejects redirects. The CLI is not yet published. These
commands work after release. See
[installation](https://ui.yopem.com/docs/installation).

## Styling

Use `Box` for generic containers. Use its `render` prop to select a semantic
tag. Layout primitives such as `Flex`, `Stack`, and `Grid` provide additional
defaults. Create styles with `stylex.create`. Pass them through `xstyle` to
apply them after component defaults and variants. Use `stylex.props` on native
or framework elements.

Components provide `className` for external CSS integration. The documentation
app uses only StyleX for styling. The project does not install CSS-property
aliases or a style-props compiler.

```tsx
import * as stylex from "@stylexjs/stylex"

import { Box } from "@/components/ui/box"

const styles = stylex.create({ section: { padding: "1rem" } })

export function Profile() {
  return (
    <Box render={<section />} xstyle={styles.section}>
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

Each workspace contains its tests. CLI and Oxlint tests use `bun:test`. Docs and
registry tests use Playwright for browser and accessibility checks. Turborepo
builds required fixtures. It runs workspace tasks in parallel within each phase:

```sh
bun run test && bun run test:e2e && bun run test:a11y
```

After the build, run a workspace directly:

```sh
bun run --cwd packages/cli test
bun run --cwd packages/oxlint-plugin test
bun run --cwd apps/docs test:e2e
bun run --cwd apps/docs test:a11y
bun run --cwd packages/registry test:e2e
bun run --cwd packages/registry test:a11y
```

Browser suites use the built docs app on fixed test ports. Docs tests use port
`3100`. Registry tests use port `3101`. Each workspace saves logs and reports in
`test-results/`.

## License

MIT. See [LICENSE](LICENSE).
