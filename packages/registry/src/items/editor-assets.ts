import type { SourceItem } from "@registry/items/types"

import { editorDependency } from "@registry/editor-dependencies"

export const editorAssetsItem: SourceItem = {
  categories: ["utility"],
  dependencies: [editorDependency("zod"), editorDependency("aws4fetch")],
  description:
    "Stores private editor assets with authenticated delivery and durable cleanup.",
  devDependencies: [],
  docs: {
    api: [
      "createAssetHttpHandler",
      "createD1AssetRepository",
      "createPostgresAssetRepository",
      "createR2Objects",
      "createS3Objects",
      "AssetConfig",
      "AssetAdmission",
      "AssetError",
    ],
    usage:
      "Import server helpers from @/lib/editor-assets. Apply the matching dialect migrations in order. Supply authentication, expiry, document and asset policy, CSRF, quotas, bounded scanners, and scheduled cleanup. See /docs/editor-assets.",
  },
  files: [
    "index.ts",
    "asset-http.ts",
    "asset-model.ts",
    "asset-bytes.ts",
    "asset-r2.ts",
    "asset-s3.ts",
    "asset-repository.ts",
    "migrations/d1/0002-private-assets.sql",
    "migrations/d1/0003-general-assets.sql",
    "migrations/postgres/0002-private-assets.sql",
    "migrations/postgres/0003-general-assets.sql",
  ].map((file) => ({
    path: `lib/editor-assets/${file}`,
    target: `@/lib/editor-assets/${file}`,
    type: "registry:lib",
  })),
  name: "editor-assets",
  peerDependencies: [],
  registryDependencies: ["editor-store"],
  title: "Editor assets",
  type: "registry:lib",
}
