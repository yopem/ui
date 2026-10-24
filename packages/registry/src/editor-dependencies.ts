import { resolveDependency } from "@registry/registry-dependencies"
import editor from "@workspace/packages/editor/package.json"

export function editorDependency(name: keyof typeof editor.dependencies) {
  return resolveDependency(name, editor.dependencies[name])
}
