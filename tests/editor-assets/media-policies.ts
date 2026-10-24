import type { AssetConfig } from "@editor/server/asset-model"

import { mediaAudio, mediaFile, mediaVideo } from "./media-fixtures"

export function mediaPolicies(): NonNullable<AssetConfig["admissions"]> {
  return [
    {
      kind: "audio",
      mediaType: "audio/wav",
      maxBytes: 8192,
      signature: (bytes) =>
        Buffer.from(bytes.slice(0, 4)).toString() === "RIFF",
      validate: (bytes) =>
        Promise.resolve(Buffer.from(bytes).equals(mediaAudio)),
    },
    {
      kind: "video",
      mediaType: "video/webm",
      maxBytes: 8192,
      signature: (bytes) =>
        Buffer.from(bytes.slice(0, 4)).equals(mediaVideo.subarray(0, 4)),
      validate: (bytes) =>
        Promise.resolve(Buffer.from(bytes).equals(mediaVideo)),
    },
    {
      kind: "file",
      mediaType: "text/html",
      maxBytes: 1024,
      signature: (bytes) =>
        Buffer.from(bytes.slice(0, 15)).toString() === "<!doctype html>",
      validate: (bytes) =>
        Promise.resolve(Buffer.from(bytes).equals(mediaFile)),
    },
  ]
}
