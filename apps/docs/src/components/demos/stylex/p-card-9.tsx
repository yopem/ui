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

export default function Particle() {
  return (
    <Frame {...stylex.props(demoStyles.demo1)}>
      <FrameHeader>
        <FrameTitle>Create project</FrameTitle>
        <FrameDescription>
          Deploy your new project in one-click.
        </FrameDescription>
      </FrameHeader>
      <Card>
        <CardPanel>
          <Form {...stylex.props(demoStyles.demo2)}>
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
                  {frameworkOptions.map(({ label, value }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
            </Field>
            <Button {...stylex.props(demoStyles.demo3)} type="submit">
              Deploy
            </Button>
          </Form>
        </CardPanel>
      </Card>
    </Frame>
  )
}

const demoStyles = stylex.create({
  demo1: {
    inlineSize: "100%",
    maxInlineSize: "20rem",
  },
  demo2: {
    display: "flex",
    inlineSize: "100%",
    flexDirection: "column",
    gap: "calc(0.25rem * 4)",
  },
  demo3: {
    inlineSize: "100%",
  },
})
