import { defineRegistryArtifactE2E } from "@registry/../test/registry-e2e-contract"

defineRegistryArtifactE2E({
  contains: ["schemaVersion", "registry:ui"],
  contentType: "json",
  pagePath: "/components",
  path: "/schema/registry.json",
  source: "schema.ts",
})
