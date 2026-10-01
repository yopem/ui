# @yopem-ui/cli

Copy Yopem UI components and configure StyleX in an existing React project.
Requires Bun. Registry requests default to `https://ui.yopem.com/r`.

```sh
bunx @yopem-ui/cli init
bunx @yopem-ui/cli add button
bunx @yopem-ui/cli update button
bunx @yopem-ui/cli --help
bunx @yopem-ui/cli --version
```

No arguments or `--help` (`-h`) prints usage; `--version` (`-v`) prints the
installed CLI version. These commands need no project and exit successfully.
Invalid commands or arguments exit with status 1.

`init` supports Vite, TanStack Router, TanStack Start, React Router, Next.js App
Router, and Astro. Pass `--framework <name>` if autodetection is ambiguous.
Installed source changes stay intact on `init` and `add`; `update` rejects
modified files unless `--force` is supplied. Installed files and their hashes
are tracked in `ui.json`.

## Dry run

Preview `add` or `update` before installing:

```sh
bunx @yopem-ui/cli add button --dry-run
bunx @yopem-ui/cli update button --dry-run
bunx @yopem-ui/cli update button --dry-run --force
```

The plan lists file writes (including tracking in `ui.json`), skips, all local
file conflicts, and runtime/dev dependency additions. Forced source overwrites
are marked explicitly. As in normal mode, `add` skips modified tracked files;
`update` reports them as conflicts without `--force`. Conflicts block a real
install until resolved or forced. Dependency lists show the package arguments
the installer would request, not package-manager version resolution.

Dry runs still read the registry and validate URLs, schemas, paths, and file
integrity. They write no files, create no directories or temporary files, never
run a package manager, and do not create or change `ui.json`, project config,
package manifests, lockfiles, or dependencies. `--cwd` and `--registry` work as
usual. `init --dry-run` and `initProject({ dryRun: true })` are rejected before
any changes.

Programmatic callers use `installItem(name, { dryRun: true })` through
`@yopem-ui/cli/install`. The result adds `preview.files` (`path`, `action`,
optional `reason` and `forced`), `preview.dependencies`, and
`preview.devDependencies`; `installed` is zero. Normal calls retain their
`{ installed, skipped }` result. Previewed writes apply when no conflicts block
the command and files have not changed before a subsequent real install.

## Registry

Pass `--registry <URL>` to `init`, `add`, or `update` to use another registry.
The override applies to that command only; it is not stored in `ui.json`. URLs
must use HTTPS, except HTTP on `localhost` or loopback addresses. Credentials,
query strings, and fragments are rejected.

For local development, start this repository's docs server with `bun run dev`:

```sh
bunx @yopem-ui/cli init --registry http://localhost:3100/r
bunx @yopem-ui/cli add button --registry http://localhost:3100/r
bunx @yopem-ui/cli update button --registry http://localhost:3100/r
```

Each request has a 30-second timeout covering connection and JSON body reads.
Failures report timeout, network, HTTP status, or malformed JSON details without
writing source, configuration, or dependencies. Programmatic callers can set
`InstallOptions.registryUrl` and `requestTimeoutMs` (milliseconds).

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
later `add` and `update` reuse that name from its `ui.json`. Run `init --ui` for
each consuming app and keep passing `--ui` when repeating init. Existing
conflicting exports or build configuration require manual review; init does not
migrate app-local components.

## Development checks

From the repository root, generate registry fixtures and build the lint plugin
before running CLI tests:

```sh
bun run registry:build
bun run --cwd packages/oxlint-plugin build
bun test packages/cli
```

`bun run --cwd packages/cli test` also runs the CLI suite. Tests use `bun:test`,
not browsers; packaged installation checks explicitly pass a local `--registry`
and serve registry JSON with Bun when port 3100 has no registry server. Registry
network tests use isolated local Bun servers for successful workflows, header
and body stalls, malformed JSON, and HTTP/network failures. Command logs and
configuration artifacts are saved in `packages/cli/test-results/`.

`bun test packages/cli/test/dry-run.test.ts` checks real fixture projects with
local registries, whole-project file/directory snapshots, dependency-call
tracking, conflict/force previews, shared import prefixes, validation failures,
and CLI argument rules. Snapshot and preview evidence is saved in
`step5-dry-run.json` under the results directory.

`bun test packages/cli/test/public.test.ts` runs packed CLI production smoke
checks: help, version matching the packed manifest, dry-run previews, init, add
Button, lint, and build in Vite and Next.js App Router apps, including shared UI
workspaces. Requires Node.js for Next.js and network access for fixture
dependencies. Tests verify build artifacts and compiled StyleX CSS, then save
`packaged-*.log`, `packaged-*.html`, and `packaged-*.css` evidence.

## Licence

This project is licensed under the terms of the
[MIT license](https://github.com/yopem/ui/blob/main/LICENSE.md).
