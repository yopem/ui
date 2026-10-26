"use client"

import { Box } from "@registry/components/ui/box"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import * as stylex from "@stylexjs/stylex"
import {
  MediaPreviewDialog,
  MediaPreviewGallery,
  MediaPreviewRoot,
  MediaPreviewTrigger,
} from "@yopem-ui/editor/media"

const images = [
  {
    id: "mark",
    src: "https://ui.yopem.com/favicon.svg",
    alt: "Yopem UI mark",
    caption: "Yopem UI mark",
  },
  {
    id: "fruit",
    src: "https://interactive-examples.mdn.mozilla.net/media/cc0-images/grapefruit-slice.jpg",
    alt: "Grapefruit slice",
    caption: "Grapefruit slice",
  },
]

const styles = stylex.create({
  row: { flexDirection: "row", flexWrap: "wrap" },
  thumbnail: { blockSize: "6rem", inlineSize: "6rem", objectFit: "contain" },
})

function PreviewImages() {
  return (
    <Stack xstyle={styles.row}>
      {images.map((image) => (
        <MediaPreviewTrigger key={image.id} imageId={image.id}>
          <img
            {...stylex.props(styles.thumbnail)}
            src={image.src}
            alt={image.alt}
          />
        </MediaPreviewTrigger>
      ))}
    </Stack>
  )
}

export function MediaPreviewComposition() {
  return (
    <Stack>
      <Box render={<section aria-label="Composed image preview" />}>
        <Text>
          Compose triggers and a dialog inside one preview root. No EditorRoot
          is required.
        </Text>
        <MediaPreviewRoot images={images}>
          <PreviewImages />
          <MediaPreviewDialog />
        </MediaPreviewRoot>
      </Box>
      <Box render={<section aria-label="Image gallery preset" />}>
        <Text>Use the gallery preset to include the dialog.</Text>
        <MediaPreviewGallery images={images}>
          <PreviewImages />
        </MediaPreviewGallery>
      </Box>
    </Stack>
  )
}
