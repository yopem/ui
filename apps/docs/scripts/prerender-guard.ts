export function createPrerenderGuard() {
  let requiredRoutes: Set<string> | undefined

  return {
    "prerender:routes"(routes: Set<string>) {
      requiredRoutes = new Set(Array.from(routes, (route) => decodeURI(route)))
    },
    "prerender:done"({
      prerenderedRoutes,
    }: {
      prerenderedRoutes: readonly { route: string }[]
    }) {
      if (!requiredRoutes)
        throw new Error("Prerender route inventory was not initialized.")

      const written = new Set(prerenderedRoutes.map((route) => route.route))

      const missing = Array.from(requiredRoutes)
        .filter((route) => !written.has(route))
        .sort()

      if (missing.length) {
        throw new Error(
          `Missing required prerendered routes: ${missing.join(", ")}`,
        )
      }
    },
  }
}
