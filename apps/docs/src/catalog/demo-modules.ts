import { lazy, type ComponentType, type LazyExoticComponent } from "react"

export interface DemoModule {
  default: ComponentType
}

type DemoLoader = () => Promise<DemoModule>

export const stylexDemoModules = import.meta.glob<DemoModule>(
  "../components/demos/stylex/*.tsx",
)

export const stylexDemoComponents = createComponents(stylexDemoModules)

export function findDemoModule(
  modules: Record<string, DemoLoader>,
  demo: string,
) {
  return Object.entries(modules).find(([path]) =>
    path.endsWith(`/${demo}.tsx`),
  )?.[1]
}

export function findDemoComponent(
  components: Map<string, LazyExoticComponent<ComponentType>>,
  demo: string,
) {
  return [...components].find(([path]) => path.endsWith(`/${demo}.tsx`))?.[1]
}

function createComponents(modules: Record<string, DemoLoader>) {
  return new Map(
    Object.entries(modules).map(([path, load]) => [path, lazy(load)] as const),
  )
}
