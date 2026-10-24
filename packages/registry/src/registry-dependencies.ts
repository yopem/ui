import workspace from "@workspace/package.json"
import registry from "@workspace/packages/registry/package.json"

const catalog: Readonly<Record<string, string>> = workspace.catalog

const dependencies = { ...registry.dependencies, ...registry.devDependencies }

export function resolveDependency(name: string, configured: string) {
  const version = configured === "catalog:" ? catalog[name] : configured

  if (!version) throw new Error(`Missing catalog version for ${name}`)

  return `${name}@${version}`
}

export function registryDependency(name: keyof typeof dependencies) {
  return resolveDependency(name, dependencies[name])
}
