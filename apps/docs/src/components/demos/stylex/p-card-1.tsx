import * as stylex from "@stylexjs/stylex"
import { CircleAlertIcon } from "lucide-react"

import { Button } from "@/components/ui/stylex/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@/components/ui/stylex/card"
import { Field, FieldLabel } from "@/components/ui/stylex/field"
import { Form } from "@/components/ui/stylex/form"
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
    <Card {...stylex.props(demoStyles.demo1)}>
      <CardHeader>
        <CardTitle>Create project</CardTitle>
        <CardDescription>Deploy your new project in one-click.</CardDescription>
      </CardHeader>
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
      <CardFooter>
        <div {...stylex.props(demoStyles.demo4)}>
          <CircleAlertIcon {...stylex.props(demoStyles.demo5)} />
          <p>This will take a few seconds to complete.</p>
        </div>
      </CardFooter>
    </Card>
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
  demo4: {
    display: "flex",
    gap: "0.25rem",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--muted-foreground)",
  },
  demo5: {
    inlineSize: "calc(0.25rem * 3)",
    blockSize: "1lh",
    flexShrink: "0",
  },
})
