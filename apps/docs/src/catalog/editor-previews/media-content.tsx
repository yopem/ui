"use client"

import { Box } from "@registry/components/ui/box"
import { Figcaption } from "@registry/components/ui/figcaption"
import { MediaContent, parseMedia } from "@yopem-ui/editor/media"

const media = parseMedia({
  kind: "image",
  url: "https://interactive-examples.mdn.mozilla.net/media/cc0-images/grapefruit-slice.jpg",
  alt: "Media preview",
  width: 320,
})

export function Preview() {
  return (
    <Box render={<figure />}>
      <MediaContent media={media} />
      <Figcaption>Validated image without an editor root.</Figcaption>
    </Box>
  )
}
