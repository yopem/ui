import type { SourceItem } from "@registry/items/types"

interface Definition {
  api: string[]
  categories: string[]
  description: string
  name: string
  registryDependencies?: string[]
  title: string
}

const definitions: Definition[] = [
  {
    api: ["BoxElement", "BoxProps", "Box"],
    categories: ["layout"],
    description:
      "Provides a native-element wrapper with StyleX defaults and xstyle.",
    name: "box",
    title: "Box",
  },
  {
    api: ["FlexProps", "Flex"],
    categories: ["layout"],
    description: "Renders a div with display:flex and xstyle.",
    name: "flex",
    title: "Flex",
  },
  {
    api: ["VStackProps", "VStack"],
    categories: ["layout"],
    description:
      "Renders a div with vertical flex layout, centered items, and spacing.",
    name: "vstack",
    title: "VStack",
  },
  {
    api: ["HStackProps", "HStack"],
    categories: ["layout"],
    description:
      "Renders a div with horizontal flex layout, centered items, and spacing.",
    name: "hstack",
    title: "HStack",
  },
  {
    api: ["StackProps", "Stack"],
    categories: ["layout"],
    description: "Renders a div with vertical flex layout and spacing.",
    name: "stack",
    title: "Stack",
  },
  {
    api: ["GridProps", "Grid"],
    categories: ["layout"],
    description: "Renders a div with display:grid.",
    name: "grid",
    title: "Grid",
  },
  {
    api: ["CenterProps", "Center"],
    categories: ["layout"],
    description:
      "Renders a div with flex layout that centers content on both axes.",
    name: "center",
    title: "Center",
  },
  {
    api: ["ContainerProps", "Container"],
    categories: ["layout"],
    description:
      "Centers a fluid page wrapper with a 90rem maximum width and horizontal padding.",
    name: "container",
    title: "Container",
  },
  {
    api: ["AbsoluteCenterAxis", "AbsoluteCenterProps", "AbsoluteCenter"],
    categories: ["layout"],
    description: "Center an element within a positioned ancestor.",
    name: "absolute-center",
    title: "AbsoluteCenter",
  },
  {
    api: ["BleedProps", "Bleed"],
    categories: ["layout"],
    description: "Extend content into a parent's inline padding.",
    name: "bleed",
    title: "Bleed",
  },
  {
    api: ["FloatPlacement", "FloatProps", "Float"],
    categories: ["layout"],
    description: "Position content over a corner of its parent.",
    name: "float",
    title: "Float",
  },
  {
    api: ["WrapProps", "Wrap"],
    categories: ["layout"],
    description: "Flex layout that wraps items across rows.",
    name: "wrap",
    title: "Wrap",
  },
  {
    api: ["LinkProps", "Link"],
    categories: ["navigation"],
    description:
      "Renders a native anchor with xstyle. It has no component visual defaults.",
    name: "link",
    title: "Link",
  },
  {
    api: ["TextProps", "Text"],
    categories: ["typography"],
    description: "Renders a native paragraph with xstyle.",
    name: "text",
    title: "Text",
  },
  {
    api: ["BlockquoteProps", "Blockquote"],
    categories: ["typography"],
    description: "Renders a semantic quotation with a subtle left border.",
    name: "blockquote",
    title: "Blockquote",
  },
  {
    api: ["EmProps", "Em"],
    categories: ["typography"],
    description: "Renders native emphasized text.",
    name: "em",
    title: "Em",
  },
  {
    api: ["HighlightProps", "Highlight"],
    categories: ["typography"],
    description: "Highlight matching text with semantic marks.",
    name: "highlight",
    registryDependencies: ["mark"],
    title: "Highlight",
  },
  {
    api: ["MarkProps", "Mark"],
    categories: ["typography"],
    description: "Renders native marked text with semantic theme tokens.",
    name: "mark",
    title: "Mark",
  },
  {
    api: ["ProseProps", "Prose"],
    categories: ["typography"],
    description: "Provides a readable container for long-form content.",
    name: "prose",
    title: "Prose",
  },
  {
    api: ["CodeblockProps", "Codeblock"],
    categories: ["typography"],
    description: "Displays preformatted source code with scrolling.",
    name: "codeblock",
    title: "Codeblock",
  },
  {
    api: ["HeadingTag", "HeadingProps", "Heading"],
    categories: ["typography"],
    description:
      "Renders a native h2 heading by default. Supports h1 through h6 selection and xstyle.",
    name: "heading",
    title: "Heading",
  },
]

export const layoutItems: SourceItem[] = definitions.map(
  ({ api, categories, description, name, registryDependencies, title }) => ({
    categories,
    dependencies: ["box", "heading", "link"].includes(name)
      ? ["@base-ui/react@^1.7.0"]
      : [],
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
    registryDependencies: [
      "base",
      ...(registryDependencies ?? []),
      ...(name === "codeblock" ? ["use-event-callback"] : []),
    ],
    title,
    type: "registry:ui" as const,
  }),
)
