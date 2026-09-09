import {
  createElement,
  lazy,
  type ComponentType,
  type LazyExoticComponent,
} from "react"

interface DemoModule {
  default: ComponentType
}
type SourceLoader = () => Promise<string>

export interface CatalogDemo {
  component: LazyExoticComponent<ComponentType>
  file: string
  loadSource: SourceLoader
  name: string
}

export interface CatalogItem {
  demos: CatalogDemo[]
  name: string
  slug: string
  title: string
}

const modules = import.meta.glob<DemoModule>("../components/demos/stylex/*.tsx")
const sources = import.meta.glob<string>("../components/demos/stylex/*.tsx", {
  import: "default",
  query: "?raw",
})

const demos = Object.entries(modules)
  .map(([path, load]) => {
    const file = path.split("/").at(-1) ?? path
    const match = /^p-(.+)-(\d+)\.tsx$/.exec(file)
    if (!match) return null
    const loadSource = sources[path]
    if (!loadSource) return null
    return {
      file,
      load,
      loadSource,
      name: file.slice(0, -4),
      order: Number(match[2]),
      slug: match[1],
    }
  })
  .filter((demo) => demo !== null)
  .sort((left, right) =>
    left.slug === right.slug
      ? left.order - right.order
      : left.slug.localeCompare(right.slug),
  )

const groups = new Map<string, typeof demos>()
for (const demo of demos) {
  const group = groups.get(demo.slug) ?? []
  group.push(demo)
  groups.set(demo.slug, group)
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
  .map((componentDemos) => {
    const first = componentDemos[0]
    if (!first) throw new Error("Empty demo group")
    const slug = first.slug
    const override = compositionOverrides[slug]
    const name = override?.name ?? componentIdentifier(slug)
    return {
      demos: componentDemos.map(
        ({ file, load, loadSource, name: demoName }) => ({
          component: lazy(() =>
            load().catch(() => ({ default: UnavailableDemo })),
          ),
          file,
          loadSource: () =>
            loadSource().then((source) =>
              source
                .replaceAll(
                  "@/components/ui/stylex/",
                  "@registry/components/ui/",
                )
                .replaceAll("@/lib/table-wrapper", "@tanstack/react-table")
                .replaceAll("@/hooks/", "@registry/hooks/"),
            ),
          name: demoName,
        }),
      ),
      name,
      slug,
      title: override?.title ?? titleCase(slug),
    }
  })
  .concat(
    {
      demos: [],
      name: "Label",
      slug: "label",
      title: "Label",
    },
    {
      demos: [],
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

function UnavailableDemo() {
  return createElement(
    "p",
    null,
    "Example could not load. Refresh the page and try again.",
  )
}
