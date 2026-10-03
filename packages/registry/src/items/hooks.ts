import type { SourceItem } from "@registry/items/types"

export const hookItems: SourceItem[] = [
  {
    categories: ["hooks"],
    dependencies: [],
    description:
      "Stable event callback that invokes the latest committed handler.",
    devDependencies: [],
    docs: {
      api: ["useEventCallback"],
      usage:
        "Import useEventCallback from @/hooks/use-event-callback. Use it for event handlers and effect callbacks, never during render. Arguments, return values, and thrown errors pass through to the latest committed callback.",
    },
    files: [
      {
        path: "hooks/use-event-callback.ts",
        target: "@/hooks/use-event-callback.ts",
        type: "registry:hook",
      },
    ],
    name: "use-event-callback",
    peerDependencies: ["react@>=18 <20"],
    registryDependencies: [],
    title: "useEventCallback",
    type: "registry:hook",
  },
  {
    categories: ["hooks"],
    dependencies: [],
    description:
      "Reactive media queries with named breakpoints, ranges, and pointer queries.",
    devDependencies: [],
    docs: {
      api: ["useMediaQuery", "MediaQueryInput"],
      usage:
        "Import useMediaQuery from @/hooks/use-media-query. Pass a raw CSS media query, a breakpoint such as md or max-md, a range such as sm:max-lg, or an object with min, max, and pointer. Minimum widths are inclusive; maximum widths are exclusive. Server rendering returns false; the client subscribes to matchMedia changes.",
    },
    files: [
      {
        path: "hooks/use-media-query.ts",
        target: "@/hooks/use-media-query.ts",
        type: "registry:hook",
      },
    ],
    name: "use-media-query",
    peerDependencies: ["react@>=18 <20"],
    registryDependencies: ["base"],
    title: "useMediaQuery",
    type: "registry:hook",
  },
]
