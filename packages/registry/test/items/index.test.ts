import { sourceItems } from "@registry/items"
import { expect, test } from "bun:test"

function findCycle(
  name: string,
  dependencies: Map<string, string[]>,
  visiting: Set<string>,
  visited: Set<string>,
): string[] | undefined {
  if (visiting.has(name)) return [...visiting, name]
  if (visited.has(name)) return
  visiting.add(name)
  for (const dependency of dependencies.get(name) ?? []) {
    const cycle = findCycle(dependency, dependencies, visiting, visited)
    if (cycle) return cycle
  }
  visiting.delete(name)
  visited.add(name)
}

test("registry item graph is unique, complete, and acyclic", () => {
  const names = sourceItems.map((item) => item.name)
  expect(new Set(names).size).toBe(names.length)

  const known = new Set(names)
  const targets = sourceItems.flatMap((item) =>
    item.files.map((file) => file.target),
  )
  expect(new Set(targets).size).toBe(targets.length)

  const dependencies = new Map(
    sourceItems.map((item) => [item.name, item.registryDependencies]),
  )
  for (const item of sourceItems) {
    expect(item.files.length, item.name).toBeGreaterThan(0)
    expect(item.registryDependencies, item.name).not.toContain(item.name)
    for (const dependency of item.registryDependencies)
      expect(known.has(dependency), `${item.name} -> ${dependency}`).toBe(true)
  }

  const visited = new Set<string>()
  for (const name of names)
    expect(
      findCycle(name, dependencies, new Set(), visited),
      name,
    ).toBeUndefined()
})
