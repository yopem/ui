# @yopem/ui

Source-copy installer for Yopem UI components.

```sh
npx @yopem/ui init
npx @yopem/ui add button
npx @yopem/ui list
npx @yopem/ui doctor
```

The CLI writes `ui.json` and `ui-lock.json`, preserves locally modified files,
and supports Vite, TanStack Start, Next.js App Router, and Next.js Pages Router
projects.

Registry defaults to `https://ui.yopem.com/r`. Set `YOPEM_REGISTRY_URL` for
local or self-hosted registries.
