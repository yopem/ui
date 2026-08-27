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
  install: string
  name: string
  slug: string
  title: string
  usage: string
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
  Pick<CatalogItem, "install" | "name" | "title" | "usage">
> = {
  "date-picker": {
    install: "npx @yopem/ui add calendar popover",
    name: "DatePicker",
    title: "Date Picker",
    usage:
      'import { Calendar } from "@/components/ui/calendar"\nimport { Popover } from "@/components/ui/popover"',
  },
  navigation: {
    install: "npx @yopem/ui add radio-group tabs",
    name: "SegmentedControl",
    title: "Segmented Control",
    usage:
      'import { RadioGroup } from "@/components/ui/radio-group"\nimport { Tabs } from "@/components/ui/tabs"',
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
          loadSource,
          name: demoName,
        }),
      ),
      install: override?.install ?? `npx @yopem/ui add ${slug}`,
      name,
      slug,
      title: override?.title ?? titleCase(slug),
      usage:
        override?.usage ?? `import { ${name} } from "@/components/ui/${slug}"`,
    }
  })
  .concat(
    {
      demos: [],
      install: "npx @yopem/ui add label",
      name: "Label",
      slug: "label",
      title: "Label",
      usage: 'import { Label } from "@/components/ui/label"',
    },
    {
      demos: [],
      install: "npx @yopem/ui add sidebar",
      name: "Sidebar",
      slug: "sidebar",
      title: "Sidebar",
      usage: 'import { Sidebar } from "@/components/ui/sidebar"',
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
    "Demo waiting for its StyleX component wrapper.",
  )
}
