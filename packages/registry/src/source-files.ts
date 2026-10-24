/** Import aliases used in the copyable source files served by the registry. */
export const sourceImportReplacements = [
  ["@yopem-ui/editor/server", "@/lib/editor-auth"],
  ["@yopem-ui/editor/typeahead", "@/components/editor/typeahead-index"],
  ["@yopem-ui/editor", "@/components/editor"],
  ["@registry/components/ui/", "@/components/ui/"],
  ["@registry/hooks/", "@/hooks/"],
  ["@registry/lib/", "@/lib/"],
  ["@registry/styles/", "@/styles/"],
  ["@registry/theme/", "@/theme/"],
] as const

export function rewriteImports(content: string, path = "") {
  const source = path.startsWith("lib/editor-store/")
    ? content.replaceAll('from "./auth"', 'from "@/lib/editor-auth/auth"')
    : content

  return sourceImportReplacements.reduce(
    (result, [source, target]) => result.replaceAll(source, target),
    source,
  )
}
