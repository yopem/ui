import { componentDocs } from "@registry/docs"
import { layoutItems } from "@registry/items/layout"
import { expect, test } from "bun:test"

const expected = [
  {
    api: ["BoxElement", "BoxProps", "Box"],
    categories: ["layout"],
    name: "box",
  },
  { api: ["FlexProps", "Flex"], categories: ["layout"], name: "flex" },
  {
    api: ["VStackProps", "VStack"],
    categories: ["layout"],
    name: "vstack",
  },
  {
    api: ["HStackProps", "HStack"],
    categories: ["layout"],
    name: "hstack",
  },
  { api: ["StackProps", "Stack"], categories: ["layout"], name: "stack" },
  { api: ["GridProps", "Grid"], categories: ["layout"], name: "grid" },
  {
    api: ["CenterProps", "Center"],
    categories: ["layout"],
    name: "center",
  },
  { api: ["LinkProps", "Link"], categories: ["navigation"], name: "link" },
  {
    api: ["ParagraphProps", "Paragraph"],
    categories: ["typography"],
    name: "paragraph",
  },
  {
    api: ["HeadingTag", "HeadingProps", "Heading"],
    categories: ["typography"],
    name: "heading",
  },
]

test("layout registry items expose all copyable primitive sources", () => {
  expect(
    layoutItems.map(({ categories, docs, name }) => ({
      api: docs?.api,
      categories,
      name,
    })),
  ).toEqual(expected)

  for (const item of layoutItems) {
    expect(item.dependencies).toEqual([])
    expect(item.devDependencies).toEqual([])
    expect(item.peerDependencies).toEqual([
      "react@>=19 <20",
      "react-dom@>=19 <20",
    ])
    expect(item.registryDependencies).toEqual(["base"])
    expect(item.files).toEqual([
      {
        path: `components/ui/${item.name}.tsx`,
        target: `@/components/ui/${item.name}.tsx`,
        type: "registry:ui",
      },
    ])
    expect(item.docs?.usage).toContain(`@/components/ui/${item.name}`)
  }
})

test("layout metadata describes every documented primitive", () => {
  for (const item of layoutItems) {
    expect(item.title).toBeTruthy()
    expect(item.description.length).toBeGreaterThan(20)
    expect(item.docs?.usage).toBe(
      `Import ${item.title} from \`@/components/ui/${item.name}\`.`,
    )
  }
})

test("layout APIs retain shared style and native references", () => {
  const components = {
    box: "Box",
    flex: "Flex",
    stack: "Stack",
    hstack: "HStack",
    vstack: "VStack",
    grid: "Grid",
    center: "Center",
    link: "Link",
    paragraph: "Paragraph",
    heading: "Heading",
  } as const

  for (const [name, componentName] of Object.entries(components)) {
    const component = componentDocs
      .find((doc) => doc.name === name)
      ?.parts.find((part) => part.name === componentName)
    expect(component, name).toBeDefined()
    if (!component) continue

    expect(
      component.props.map((prop) => prop.name),
      name,
    ).toEqual(
      expect.arrayContaining([
        "children",
        "className",
        "ref",
        "style",
        "xstyle",
      ]),
    )
    if (name === "box" || name === "heading")
      expect(
        component.props.map((prop) => prop.name),
        name,
      ).toContain("as")
    else
      expect(
        component.props.map((prop) => prop.name),
        name,
      ).not.toContain("as")
    if (name === "link")
      expect(component.props.map((prop) => prop.name)).toContain("href")
  }
})
