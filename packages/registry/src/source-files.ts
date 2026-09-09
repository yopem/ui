/** Import aliases used in the copyable source files served by the registry. */
export const sourceImportReplacements = [
  ["@registry/components/ui/", "@ui/"],
  ["@registry/hooks/", "@hooks/"],
  ["@registry/lib/", "@lib/"],
  ["@registry/styles/", "@styles/yopem/"],
  ["@registry/theme/", "@components/"],
] as const

export function rewriteImports(content: string) {
  return sourceImportReplacements.reduce(
    (result, [source, target]) => result.replaceAll(source, target),
    content,
  )
}
