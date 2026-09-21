import {
  createElement,
  lazy,
  type ComponentType,
  type LazyExoticComponent,
} from "react"

import type { ExampleModule } from "./example-modules"

import { resolveExampleModule } from "./example-modules"

export interface CatalogExample {
  component: LazyExoticComponent<ComponentType>
  name: string
  preload: () => Promise<ReturnType<typeof resolveExampleModule>>
  source: () => Promise<string>
}

export interface CatalogItem {
  examples: CatalogExample[]
  name: string
  slug: string
  title: string
}

const modules = import.meta.glob<ExampleModule>(
  "../components/examples/stylex/*.tsx",
)
const sources = import.meta.glob<string>(
  "../components/examples/stylex/*.tsx",
  {
    query: "?raw",
    import: "default",
  },
)
const examples = Object.entries(modules)
  .map(([path, load]) => {
    const file = path.split("/").at(-1) ?? path
    const match = /^p-(.+)-(\d+)\.tsx$/.exec(file)
    const source = sources[path]
    if (!match || !source) return null
    return {
      load,
      name: file.slice(0, -4),
      order: Number(match[2]),
      slug: match[1],
      source,
    }
  })
  .filter((example) => example !== null)
  .sort((left, right) =>
    left.slug === right.slug
      ? left.order - right.order
      : left.slug.localeCompare(right.slug),
  )

const groups = new Map<string, typeof examples>()
for (const example of examples) {
  const group = groups.get(example.slug) ?? []
  group.push(example)
  groups.set(example.slug, group)
}

const compositionOverrides: Record<
  string,
  Pick<CatalogItem, "name" | "title">
> = {
  "date-picker": {
    name: "DatePicker",
    title: "Date Picker",
  },
  navigation: {
    name: "SegmentedControl",
    title: "Segmented Control",
  },
}

export const catalog: CatalogItem[] = [...groups.values()]
  .map((componentExamples) => {
    const first = componentExamples[0]
    if (!first) throw new Error("Empty example group")
    const slug = first.slug
    const override = compositionOverrides[slug]
    const name = override?.name ?? componentIdentifier(slug)
    return {
      examples: componentExamples.map(({ load, name: exampleName, source }) => {
        let promise:
          | Promise<ReturnType<typeof resolveExampleModule>>
          | undefined
        const preload = () =>
          (promise ??= load()
            .then(resolveExampleModule)
            .catch(() => ({ default: UnavailableExample })))
        return {
          component: lazy(preload),
          name: exampleName,
          preload,
          source,
        }
      }),
      name,
      slug,
      title: override?.title ?? titleCase(slug),
    }
  })
  .concat(
    {
      examples: [],
      name: "Label",
      slug: "label",
      title: "Label",
    },
    {
      examples: [],
      name: "Sidebar",
      slug: "sidebar",
      title: "Sidebar",
    },
  )
  .toSorted((left, right) => left.title.localeCompare(right.title))

export function getCatalogItem(slug: string) {
  return catalog.find((item) => item.slug === slug)
}

function titleCase(value: string) {
  return value
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function componentIdentifier(value: string) {
  return titleCase(value).replaceAll(" ", "")
}

function UnavailableExample() {
  return createElement(
    "p",
    null,
    "Example could not load. Refresh the page and try again.",
  )
}
