import * as stylex from "@stylexjs/stylex"
import { CircleAlertIcon } from "lucide-react"

import { Button } from "@/components/ui/stylex/button"
import {
  Card,
  CardFrame,
  CardFrameDescription,
  CardFrameFooter,
  CardFrameHeader,
  CardFrameTitle,
  CardPanel,
} from "@/components/ui/stylex/card"
import { Field, FieldLabel } from "@/components/ui/stylex/field"
import { Flex } from "@/components/ui/stylex/flex"
import { Form } from "@/components/ui/stylex/form"
import { Input } from "@/components/ui/stylex/input"
import { Paragraph } from "@/components/ui/stylex/paragraph"
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

export default function Example() {
  return (
    <CardFrame {...stylex.props(exampleStyles.example1)}>
      <CardFrameHeader>
        <CardFrameTitle>Create project</CardFrameTitle>
        <CardFrameDescription>
          Deploy your new project in one-click.
        </CardFrameDescription>
      </CardFrameHeader>
      <Card {...stylex.props(exampleStyles.example2)}>
        <CardPanel>
          <Form {...stylex.props(exampleStyles.example3)}>
            {projectFields.map(({ control, label }) => (
              <Field key={label}>
                <FieldLabel>{label}</FieldLabel>
                {control}
              </Field>
            ))}
            <Button {...stylex.props(exampleStyles.example4)} type="submit">
              Deploy
            </Button>
          </Form>
        </CardPanel>
      </Card>
      <CardFrameFooter>
        <Flex {...stylex.props(exampleStyles.example5)}>
          <CircleAlertIcon {...stylex.props(exampleStyles.example6)} />
          <Paragraph>This will take a few seconds to complete.</Paragraph>
        </Flex>
      </CardFrameFooter>
    </CardFrame>
  )
}

const exampleStyles = stylex.create({
  example1: {
    inlineSize: "100%",
    maxInlineSize: "20rem",
  },
  example2: {
    borderBottomRightRadius: "0",
    borderBottomLeftRadius: "0",
  },
  example3: {
    display: "flex",
    inlineSize: "100%",
    flexDirection: "column",
    gap: "calc(0.25rem * 4)",
  },
  example4: {
    inlineSize: "100%",
  },
  example5: {
    display: "flex",
    gap: "0.25rem",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--muted-foreground)",
  },
  example6: {
    inlineSize: "calc(0.25rem * 3)",
    blockSize: "1lh",
    flexShrink: "0",
  },
})
