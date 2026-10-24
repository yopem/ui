import {
  parseMedia,
  mediaKinds,
  safeMediaUrl,
} from "@yopem-ui/editor/media/schema"
import { z } from "zod"

import { checkTree, DocumentError } from "./boundary"

export const documentMediaSchema = z
  .object({ kind: z.enum(mediaKinds), url: z.string() })
  .loose()
  .transform((input) => {
    checkTree(input)
    const media = parseMedia(input)

    if (Object.keys(input).some((key) => !Object.hasOwn(media, key)))
      throw new DocumentError(["Unsupported media metadata."])

    for (const source of [input.url, media.trackUrl]) {
      if (source === undefined) continue
      const url = new URL(safeMediaUrl(source))

      if (url.search || url.hash)
        throw new DocumentError([
          "Media URLs cannot contain queries or fragments.",
        ])
    }

    return media
  })
