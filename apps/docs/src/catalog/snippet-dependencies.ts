export function getSnippetDependencies(source: string) {
  const components = new Set<string>()
  const packages = new Set<string>()

  // ponytail: snippets use static imports; use a TS parser if dynamic imports are added.
  for (const match of source.matchAll(/\bfrom\s+["']([^"']+)["']/g)) {
    const path = match[1]

    if (path.startsWith("@/components/ui/") || path.startsWith("@/hooks/")) {
      components.add(path.split("/").at(-1)!)
    } else if (!path.startsWith("@/")) {
      packages.add(
        path
          .split("/")
          .slice(0, path.startsWith("@") ? 2 : 1)
          .join("/"),
      )
    }
  }

  return { components: [...components], packages: [...packages] }
}
