import * as stylex from "@stylexjs/stylex"
import { CircleAlertIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardPanel } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Flex } from "@/components/ui/flex"
import { Form } from "@/components/ui/form"
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FrameTitle,
} from "@/components/ui/frame"
import { Input } from "@/components/ui/input"
import { Paragraph } from "@/components/ui/paragraph"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
const frameworkOptions = [
  { label: "Next.js", value: "next" },
  { label: "Vite", value: "vite" },
  { label: "Remix", value: "remix" },
  { label: "Astro", value: "astro" },
]

function FrameworkOptions() {
  return frameworkOptions.map(({ label, value }) => (
    <SelectItem key={value} value={value}>
      {label}
    </SelectItem>
  ))
}

function ProjectForm() {
  return (
    <Form {...stylex.props(exampleStyles.example2)}>
      <Field>
        <FieldLabel>Name</FieldLabel>
        <Input placeholder="Name of your project" type="text" />
      </Field>
      <Field>
        <FieldLabel>Framework</FieldLabel>
        <Select defaultValue="next" items={frameworkOptions}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectPopup>
            <FrameworkOptions />
          </SelectPopup>
        </Select>
      </Field>
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
      <FrameFooter>
        <Flex {...stylex.props(exampleStyles.example4)}>
          <CircleAlertIcon {...stylex.props(exampleStyles.example5)} />
          <Paragraph>This will take a few seconds to complete.</Paragraph>
        </Flex>
      </FrameFooter>
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
  example4: {
    display: "flex",
    gap: "0.25rem",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--muted-foreground)",
  },
  example5: {
    inlineSize: "calc(0.25rem * 3)",
    blockSize: "1lh",
    flexShrink: "0",
  },
})
