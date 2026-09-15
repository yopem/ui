import * as stylex from "@stylexjs/stylex"

import { Button } from "@/components/ui/stylex/button"
import { Card, CardPanel } from "@/components/ui/stylex/card"
import { Field, FieldLabel } from "@/components/ui/stylex/field"
import { Form } from "@/components/ui/stylex/form"
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FrameTitle,
} from "@/components/ui/stylex/frame"
import { Input } from "@/components/ui/stylex/input"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/stylex/select"

const frameworkOptions = [
  { label: "Next.js", value: "next" },
  { label: "Vite", value: "vite" },
  { label: "Remix", value: "remix" },
  { label: "Astro", value: "astro" },
]

const projectFields = [
  {
    control: <Input placeholder="Name of your project" type="text" />,
    label: "Name",
  },
  {
    control: (
      <Select defaultValue="next" items={frameworkOptions}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectPopup>
          {frameworkOptions.map(({ label, value }) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectPopup>
      </Select>
    ),
    label: "Framework",
  },
]

function ProjectForm() {
  return (
    <Form {...stylex.props(exampleStyles.example2)}>
      {projectFields.map(({ control, label }) => (
        <Field key={label}>
          <FieldLabel>{label}</FieldLabel>
          {control}
        </Field>
      ))}
      <Button {...stylex.props(exampleStyles.example3)} type="submit">
        Deploy
      </Button>
    </Form>
  )
}

export default function Example() {
  return (
    <Frame {...stylex.props(exampleStyles.example1)}>
      <FrameHeader>
        <FrameTitle>Create project</FrameTitle>
        <FrameDescription>
          Deploy your new project in one-click.
        </FrameDescription>
      </FrameHeader>
      <Card>
        <CardPanel>
          <ProjectForm />
        </CardPanel>
      </Card>
    </Frame>
  )
}

const exampleStyles = stylex.create({
  example1: {
    inlineSize: "100%",
    maxInlineSize: "20rem",
  },
  example2: {
    display: "flex",
    inlineSize: "100%",
    flexDirection: "column",
    gap: "calc(0.25rem * 4)",
  },
  example3: {
    inlineSize: "100%",
  },
})
