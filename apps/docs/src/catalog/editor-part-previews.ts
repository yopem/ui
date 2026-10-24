import type { FunctionComponent } from "react"

import { lazyRouteComponent } from "@tanstack/react-router"

import type { CatalogPreview } from "./components"

import { editorParts } from "./editor-parts"

const modules = import.meta.glob<{ Preview: FunctionComponent }>(
  "./editor-previews/*.tsx",
)

export const editorPartPreviews = new Map<string, CatalogPreview>(
  editorParts.map((part) => {
    const load = modules[`./editor-previews/${part.slug}.tsx`]

    if (!load) throw new Error(`Missing editor preview: ${part.name}`)

    return [
      part.slug,
      { title: part.name, component: lazyRouteComponent(load, "Preview") },
    ]
  }),
)
