import { createPrerenderGuard } from "@workspace/apps/docs/scripts/prerender-guard"
import { describe, expect, test } from "bun:test"

describe("required static publication", () => {
  test("accepts completed required routes and extra crawled routes", () => {
    const guard = createPrerenderGuard()
    guard["prerender:routes"](new Set(["/", "/components/dialog"]))
    expect(() =>
      guard["prerender:done"]({
        prerenderedRoutes: [
          { route: "/" },
          { route: "/components/dialog" },
          { route: "/extra" },
        ],
      }),
    ).not.toThrow()
  })

  test("rejects routes lost before Nitro records a failed response", () => {
    const guard = createPrerenderGuard()
    guard["prerender:routes"](
      new Set(["/", "/components/dialog", "/components/dialog.md"]),
    )
    expect(() =>
      guard["prerender:done"]({ prerenderedRoutes: [{ route: "/" }] }),
    ).toThrow(/\/components\/dialog.*\/components\/dialog\.md/)
  })

  test("rejects an absent required HTML or Markdown output independently", () => {
    for (const missing of ["/components/dialog", "/components/dialog.md"]) {
      const guard = createPrerenderGuard()
      guard["prerender:routes"](
        new Set(["/components/dialog", "/components/dialog.md"]),
      )

      const generated = ["/components/dialog", "/components/dialog.md"].filter(
        (route) => route !== missing,
      )

      expect(() =>
        guard["prerender:done"]({
          prerenderedRoutes: generated.map((route) => ({ route })),
        }),
      ).toThrow(new RegExp(`${missing.replaceAll(".", "\\.")}$`))
    }
  })

  test("accepts the required 404 file when its route was generated", () => {
    const guard = createPrerenderGuard()
    guard["prerender:routes"](new Set(["/404"]))
    expect(() =>
      guard["prerender:done"]({ prerenderedRoutes: [{ route: "/404" }] }),
    ).not.toThrow()
  })

  test("matches the route decoding used by Nitro", () => {
    const guard = createPrerenderGuard()
    guard["prerender:routes"](new Set(["/docs/%E2%9C%93"]))
    expect(() =>
      guard["prerender:done"]({ prerenderedRoutes: [{ route: "/docs/✓" }] }),
    ).not.toThrow()
  })

  test("keeps the required inventory after the crawler changes its set", () => {
    const guard = createPrerenderGuard()
    const routes = new Set(["/components/dialog"])
    guard["prerender:routes"](routes)
    routes.clear()
    expect(() => guard["prerender:done"]({ prerenderedRoutes: [] })).toThrow(
      "/components/dialog",
    )
  })

  test("resets the required inventory for the next build", () => {
    const guard = createPrerenderGuard()
    guard["prerender:routes"](new Set(["/old"]))
    guard["prerender:routes"](new Set(["/new"]))
    expect(() =>
      guard["prerender:done"]({ prerenderedRoutes: [{ route: "/new" }] }),
    ).not.toThrow()
  })

  test("keeps separate build instances independent", () => {
    const first = createPrerenderGuard()
    const second = createPrerenderGuard()
    first["prerender:routes"](new Set(["/first"]))
    second["prerender:routes"](new Set(["/second"]))
    expect(() =>
      first["prerender:done"]({ prerenderedRoutes: [{ route: "/first" }] }),
    ).not.toThrow()
    expect(() => second["prerender:done"]({ prerenderedRoutes: [] })).toThrow(
      "/second",
    )
  })

  test("accepts an explicit empty inventory", () => {
    const guard = createPrerenderGuard()
    guard["prerender:routes"](new Set())
    expect(() =>
      guard["prerender:done"]({ prerenderedRoutes: [] }),
    ).not.toThrow()
  })

  test("rejects completion without a captured inventory", () => {
    const guard = createPrerenderGuard()
    expect(() => guard["prerender:done"]({ prerenderedRoutes: [] })).toThrow(
      Error,
    )
  })
})
