# @yopem-ui/cli

Copy Yopem UI components and configure StyleX in an existing React project.
Requires Bun. Until the registry is deployed, run the docs server on
`http://localhost:3100` before using the CLI.

```sh
bunx @yopem-ui/cli init
bunx @yopem-ui/cli add button
bunx @yopem-ui/cli update button
```

`init` supports Vite, TanStack Router, TanStack Start, React Router, Next.js App
Router, and Astro. Pass `--framework <name>` if autodetection is ambiguous.
Installed source changes stay intact on `init` and `add`; `update` rejects
modified files unless `--force` is supplied.

## Monorepos

Target an app from the repository root with `--cwd`. Package manager detection
uses the app and its workspace root; dependencies stay in the target package.
Bun, npm, pnpm, and Yarn workspaces are supported.

```sh
bunx @yopem-ui/cli init --cwd apps/web
bunx @yopem-ui/cli add button --cwd apps/web
```

For shared components, use an existing named React package in the same
workspace. `--ui` is relative to the target app, not the repository root.

```sh
bunx @yopem-ui/cli init --cwd apps/web --ui ../../packages/ui
bunx @yopem-ui/cli add button --cwd packages/ui
bunx @yopem-ui/cli update button --cwd packages/ui
```

`init --ui` installs base files in the UI package, adds source subpath exports,
links the app, and configures StyleX to scan both packages. Next.js also gets
`transpilePackages`. Init registers shared package imports with the Yopem UI
Oxlint rules, preserving existing rule options and explicit opt-outs. Shared
source imports use the UI package name, such as `@acme/ui/components/ui/button`;
later `add` and `update` reuse that name from its `.yopem-ui.json`. Run
`init --ui` for each consuming app and keep passing `--ui` when repeating init.
Existing conflicting exports or build configuration require manual review; init
does not migrate app-local components.

## Development checks

From the repository root, generate registry fixtures and build the lint plugin
before running CLI tests:

```sh
bun run registry:build
bun run --cwd packages/oxlint-plugin build
bun test packages/cli
```

`bun run --cwd packages/cli test` also runs the CLI suite. Tests use `bun:test`,
not browsers; packaged installation checks serve registry JSON with Bun when
port 3100 has no registry server. Command logs and configuration artifacts are
saved in `packages/cli/test-results/`.

## Licence

This project is licensed under the terms of the
[MIT license](https://github.com/yopem/ui/blob/main/LICENSE.md).
