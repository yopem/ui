import type { SourceItem } from "@registry/items/types"

interface Definition {
  api: string[]
  categories: string[]
  description: string
  name: string
  title: string
}

const definitions: Definition[] = [
  {
    api: ["BoxElement", "BoxProps", "Box"],
    categories: ["layout"],
    description:
      "Generic intrinsic-element wrapper with StyleX defaults and xstyle.",
    name: "box",
    title: "Box",
  },
  {
    api: ["FlexProps", "Flex"],
    categories: ["layout"],
    description: "Div-only flex layout with display:flex and xstyle.",
    name: "flex",
    title: "Flex",
  },
  {
    api: ["VStackProps", "VStack"],
    categories: ["layout"],
    description:
      "Div-only vertical flex layout with centered items and spacing.",
    name: "vstack",
    title: "VStack",
  },
  {
    api: ["HStackProps", "HStack"],
    categories: ["layout"],
    description:
      "Div-only horizontal flex layout with centered items and spacing.",
    name: "hstack",
    title: "HStack",
  },
  {
    api: ["StackProps", "Stack"],
    categories: ["layout"],
    description: "Div-only vertical flex layout with spacing.",
    name: "stack",
    title: "Stack",
  },
  {
    api: ["GridProps", "Grid"],
    categories: ["layout"],
    description: "Div-only grid layout with display:grid.",
    name: "grid",
    title: "Grid",
  },
  {
    api: ["CenterProps", "Center"],
    categories: ["layout"],
    description: "Div-only flex layout that centers content on both axes.",
    name: "center",
    title: "Center",
  },
  {
    api: ["ContainerProps", "Container"],
    categories: ["layout"],
    description:
      "Centered, fluid page wrapper with a 90rem maximum width and horizontal padding.",
    name: "container",
    title: "Container",
  },
  {
    api: ["LinkProps", "Link"],
    categories: ["navigation"],
    description: "Native anchor with xstyle and no component visual defaults.",
    name: "link",
    title: "Link",
  },
  {
    api: ["ParagraphProps", "Paragraph"],
    categories: ["typography"],
    description: "Native paragraph with xstyle.",
    name: "paragraph",
    title: "Paragraph",
  },
  {
    api: ["MarkProps", "Mark"],
    categories: ["typography"],
    description: "Native marked text using semantic theme tokens.",
    name: "mark",
    title: "Mark",
  },
  {
    api: ["HeadingTag", "HeadingProps", "Heading"],
    categories: ["typography"],
    description:
      "Native h2-by-default heading with h1-h6 selection and xstyle.",
    name: "heading",
    title: "Heading",
  },
]

export const layoutItems: SourceItem[] = definitions.map(
  ({ api, categories, description, name, title }) => ({
    categories,
    dependencies: [],
    description,
    devDependencies: [],
    docs: {
      api,
      usage: `Import ${title} from \`@/components/ui/${name}\`.`,
    },
    files: [
      {
        path: `components/ui/${name}.tsx`,
        target: `@/components/ui/${name}.tsx`,
        type: "registry:ui" as const,
      },
    ],
    name,
    peerDependencies: ["react@>=19 <20", "react-dom@>=19 <20"],
    registryDependencies: ["base"],
    title,
    type: "registry:ui" as const,
  }),
)
