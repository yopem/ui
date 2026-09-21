import { lazy, type ComponentType, type LazyExoticComponent } from "react"

export type ExampleModule =
  | { default: ComponentType; Example?: never }
  | { Example: ComponentType; default?: never }

export function resolveExampleModule(module: ExampleModule) {
  return { default: module.default ?? module.Example }
}

type ExampleLoader = () => Promise<ExampleModule>

export const stylexExampleModules = import.meta.glob<ExampleModule>(
  "../components/examples/stylex/*.tsx",
)

export const stylexExampleComponents = createComponents(stylexExampleModules)

export function findExampleModule(
  modules: Record<string, ExampleLoader>,
  example: string,
) {
  return Object.entries(modules).find(([path]) =>
    path.endsWith(`/${example}.tsx`),
  )?.[1]
}

export function findExampleComponent(
  components: Map<string, LazyExoticComponent<ComponentType>>,
  example: string,
) {
  return [...components].find(([path]) => path.endsWith(`/${example}.tsx`))?.[1]
}

function createComponents(modules: Record<string, ExampleLoader>) {
  return new Map(
    Object.entries(modules).map(
      ([path, load]) =>
        [path, lazy(() => load().then(resolveExampleModule))] as const,
    ),
  )
}
