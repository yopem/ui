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
