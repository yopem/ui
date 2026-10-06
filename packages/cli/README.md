# @yopem-ui/cli

Copy Yopem UI components into an existing React project. Configure StyleX with
the CLI. The CLI requires Bun. Registry requests use `https://ui.yopem.com/r` by
default.

```sh
bunx @yopem-ui/cli init
bunx @yopem-ui/cli add button
bunx @yopem-ui/cli update button
bunx @yopem-ui/cli --help
bunx @yopem-ui/cli --version
```

Run the CLI without arguments, or with `--help` (`-h`), to show usage. Use
`--version` (`-v`) to show the installed CLI version. These commands do not need
a project. They exit successfully. Invalid commands or arguments exit with
status 1.

The `init` command supports Vite, TanStack Router, TanStack Start, React Router,
Next.js App Router, and Astro. Pass `--framework <name>` if the CLI cannot
identify one framework. The `init` and `add` commands keep local changes to
installed source. The `update` command rejects modified files unless you pass
`--force`. The CLI records installed files and their hashes in `ui.json`.

## Dry run

Preview `add` or `update` before installation:

```sh
bunx @yopem-ui/cli add button --dry-run
bunx @yopem-ui/cli update button --dry-run
bunx @yopem-ui/cli update button --dry-run --force
```

The plan lists file writes, skipped files, local conflicts, and runtime and
development dependency additions. File writes include tracking changes in
`ui.json`. The plan identifies forced source overwrites explicitly. As in normal
mode, `add` skips modified tracked files. Without `--force`, `update` reports
those files as conflicts. Resolve conflicts before a real installation, or use
`--force` to overwrite files. Dependency lists show requested package arguments,
not package-manager version resolution.

Dry runs read the registry. They validate URLs, schemas, paths, and file
integrity. They do not write files or create directories or temporary files.
They do not run a package manager. They do not change `ui.json`, project
configuration, package manifests, lockfiles, or dependencies. Use `--cwd` and
`--registry` as usual. The `init --dry-run` command also previews setup for
supported frameworks and shared UI workspaces.

Programmatic callers can use `installItem(name, { dryRun: true })` through
`@yopem-ui/cli/install`. The result includes `preview.files`,
`preview.dependencies`, and `preview.devDependencies`. Each preview file has
`path` and `action`, with optional `reason` and `forced`. The `installed` count
is zero. Normal calls return `{ installed, skipped }`. Previewed writes apply
only if no conflicts block the command and files remain unchanged before the
real installation.

## Registry

Pass `--registry <URL>` to `init`, `add`, or `update` to use another registry.
The setting applies only to that command. The CLI does not store it in
`ui.json`. URLs must use HTTPS, except HTTP on `localhost` or loopback
addresses. The CLI rejects credentials, query strings, and fragments.

For local development, start this repository's docs server with `bun run dev`:

```sh
bunx @yopem-ui/cli init --registry http://localhost:3100/r
bunx @yopem-ui/cli add button --registry http://localhost:3100/r
bunx @yopem-ui/cli update button --registry http://localhost:3100/r
```

Each request has a 30-second timeout for connection and JSON body reads.
Failures report timeout, network, HTTP status, or malformed JSON details. The
CLI makes no source, configuration, or dependency changes after these failures.
Programmatic callers can set `InstallOptions.registryUrl` and
`requestTimeoutMs`. The timeout uses milliseconds.

## Monorepos

Use `--cwd` to target an app from the repository root. The CLI detects the
package manager from the app and its workspace root. Dependencies stay in the
target package. The CLI supports Bun, npm, pnpm, and Yarn workspaces.

```sh
bunx @yopem-ui/cli init --cwd apps/web
bunx @yopem-ui/cli add button --cwd apps/web
```

For shared components, use an existing named React package in the same
workspace. The `--ui` path is relative to the target app, not the repository
root.

```sh
bunx @yopem-ui/cli init --cwd apps/web --ui ../../packages/ui
bunx @yopem-ui/cli add button --cwd packages/ui
bunx @yopem-ui/cli update button --cwd packages/ui
```

The `init --ui` command installs base files in the UI package. It adds source
subpath exports and links the app. It configures StyleX to scan both packages.
For Next.js, it also adds `transpilePackages`. The command registers shared
package imports with the Yopem UI Oxlint rules. It keeps existing rule options
and explicit opt-outs.

Shared source imports use the UI package name, such as
`@acme/ui/components/ui/button`. Later `add` and `update` commands use that name
from the package's `ui.json`. Run `init --ui` for each consuming app. Pass
`--ui` again when you repeat init. Review conflicting exports or build
configuration manually. The init command does not migrate app-local components.

## Development checks

Generate registry fixtures from the repository root. Build the lint plugin
before you run CLI tests:

```sh
bun run registry:build
bun run --cwd packages/oxlint-plugin build
bun test packages/cli
```

The `bun run --cwd packages/cli test` command also runs the CLI suite. Tests use
`bun:test`, not browsers. Packaged installation checks explicitly pass a local
`--registry`. They serve registry JSON with Bun if port 3100 has no registry
server.

Registry network tests use isolated local Bun servers. They cover successful
workflows, header and body stalls, malformed JSON, and HTTP and network
failures. Tests save command logs and configuration artifacts in
`packages/cli/test-results/`.

Run `bun test packages/cli/test/dry-run.test.ts` for real fixture project
checks. These checks use local registries and complete file and directory
snapshots. They cover dependency-call tracking, conflict and force previews,
shared import prefixes, validation failures, and CLI argument rules. Tests save
snapshot and preview evidence in `step5-dry-run.json` in the results directory.

Run `bun test packages/cli/test/public.test.ts` for packed CLI production
checks. These checks cover help, version matching, dry-run previews, init,
Button installation, lint, and builds. They use Vite and Next.js App Router
apps, including shared UI workspaces. Next.js checks require Node.js. Fixture
dependencies require network access. Tests verify build artifacts and compiled
StyleX CSS. They save evidence in `packaged-*.log`, `packaged-*.html`, and
`packaged-*.css`.

## Licence

This project uses the
[MIT license](https://github.com/yopem/ui/blob/main/LICENSE.md).
