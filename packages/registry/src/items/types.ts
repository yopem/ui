import type { RegistryItem } from "@registry/schema"

export interface SourceFile {
  path: string
  target: string
  type: RegistryItem["type"]
}

export interface SourceItem extends Omit<
  RegistryItem,
  "$schema" | "files" | "registryVersion" | "schemaVersion"
> {
  files: SourceFile[]
}
