import { documentLimits } from "./document/boundary"

export const docxLimits = {
  compressedBytes: documentLimits.bytes,
  uncompressedBytes: documentLimits.bytes,
  entries: 128,
  entryNameBytes: 255,
  relationships: 1024,
  externalRelationships: 256,
} as const
