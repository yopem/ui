import workspace from "@workspace/package.json"
import editor from "@workspace/packages/editor/package.json"

const catalog: Readonly<Record<string, string>> = workspace.catalog

export function editorDependency(name: keyof typeof editor.dependencies) {
  const configured = editor.dependencies[name]
  const version = configured === "catalog:" ? catalog[name] : configured

  if (!version) throw new Error(`Missing catalog version for ${name}`)

  return `${name}@${version}`
}
