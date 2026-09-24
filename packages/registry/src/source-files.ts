import { resolve } from "node:path"

/** Import aliases used in the copyable source files served by the registry. */
export const sourceImportReplacements = [
  ["@registry/components/ui/", "@/components/ui/"],
  ["@registry/hooks/", "@/hooks/"],
  ["@registry/lib/", "@/lib/"],
  ["@registry/styles/", "@/styles/"],
  ["@registry/theme/", "@/theme/"],
] as const

export function sourceFilePath(path: string) {
  return resolve(import.meta.dirname, path)
}

export function rewriteImports(content: string) {
  return sourceImportReplacements.reduce(
    (result, [source, target]) => result.replaceAll(source, target),
    content,
  )
}
