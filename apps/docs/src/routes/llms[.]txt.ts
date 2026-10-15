import { createFileRoute } from "@tanstack/react-router"

import { catalog } from "@/catalog/components"
import { guidePages } from "@/catalog/docs-data"
import { createLlms, textResponse } from "@/lib/plain-text"
import { siteOrigin } from "@/lib/seo"

export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: () =>
        textResponse(`${createLlms(siteOrigin, guidePages, catalog)}
## Media, lists, and semantic text

AspectRatio renders a div with CSS aspectRatio. Its optional numeric ratio defaults to 16 / 9.
Nonpositive and nonfinite ratios use the default. AspectRatio does not clip or automatically size children.
List renders ul by default. Use List render={<ol />} for ordered lists through Base UI useRender.
Put native start and reversed attributes on the rendered ol.
Import List and ListItem from @/components/ui/list. ListItem renders li.
Strong renders semantic strong with weight 600 and inherits surrounding typography.
Figcaption renders semantic figcaption with muted text, 0.875rem font size, and 1.5 line height.
Place Figcaption inside Box render={<figure />}. There is no Figure primitive.
These components accept StyleX xstyle, className, native attributes, events, and refs.
These component recommendations do not expand the lint rule's supported native tags.
`),
    },
  },
})
