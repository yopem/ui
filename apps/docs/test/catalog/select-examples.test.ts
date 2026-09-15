import { expect, test } from "bun:test"

import { selectExamples } from "@/catalog/select-examples"

test("selects shortest examples covering component props and values", () => {
  const examples = [
    {
      name: "p-button-1",
      source:
        "export default function Example() { return <Button>Button</Button> }",
    },
    {
      name: "p-button-2",
      source:
        'export default function Example() { return <Button variant="outline">Outline</Button> }',
    },
    {
      name: "p-button-3",
      source:
        'export default function Example() { return <Button size="sm">Small</Button> }',
    },
    {
      name: "p-button-4",
      source:
        'export default function Example() { return <Button onClick={() => undefined} variant="outline">Complex</Button> }',
    },
  ]

  expect(
    selectExamples(
      [
        {
          name: "Button",
          props: [
            {
              default: '"default"',
              name: "variant",
              source: "components/ui/button.tsx",
              type: '"default" | "outline"',
            },
            {
              default: '"default"',
              name: "size",
              source: "components/ui/button.tsx",
              type: '"default" | "sm"',
            },
            {
              name: "onClick",
              source: "@types/react/index.d.ts",
              type: "MouseEventHandler",
            },
          ],
        },
      ],
      examples,
    ).map((group) => ({
      label: group.label,
      examples: group.examples.map(({ label, name }) => ({ label, name })),
    })),
  ).toEqual([
    {
      label: "Default",
      examples: [{ label: "Default", name: "p-button-1" }],
    },
    {
      label: "Button variant",
      examples: [
        { label: "default", name: "p-button-1" },
        { label: "outline", name: "p-button-2" },
      ],
    },
    {
      label: "Button size",
      examples: [
        { label: "default", name: "p-button-1" },
        { label: "sm", name: "p-button-3" },
      ],
    },
  ])
})
