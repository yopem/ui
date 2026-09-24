import { Button } from "@registry/components/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@registry/components/ui/card"
import { Field, FieldLabel } from "@registry/components/ui/field"
import { Flex } from "@registry/components/ui/flex"
import { Form } from "@registry/components/ui/form"
import { Input } from "@registry/components/ui/input"
import { Paragraph } from "@registry/components/ui/paragraph"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@registry/components/ui/select"
import * as stylex from "@stylexjs/stylex"
import { CircleAlertIcon } from "lucide-react"

const styles = stylex.create({
  form: {
    display: "flex",
    inlineSize: "100%",
    flexDirection: "column",
    gap: "calc(0.25rem * 4)",
  },
  button: { inlineSize: "100%" },
  card: { inlineSize: "100%", maxInlineSize: "20rem" },
  flex: {
    gap: "0.25rem",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--muted-foreground)",
  },
})
const frameworkOptions = [
  { label: "Next.js", value: "next" },
  { label: "Vite", value: "vite" },
  { label: "Remix", value: "remix" },
  { label: "Astro", value: "astro" },
]

function FrameworkSelect() {
  return (
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
  )
}

function ProjectForm() {
  return (
    <Form xstyle={styles.form}>
      <Field>
        <FieldLabel>Name</FieldLabel>
        <Input placeholder="Name of your project" type="text" />
      </Field>
      <Field>
        <FieldLabel>Framework</FieldLabel>
        <FrameworkSelect />
      </Field>
      <Button xstyle={styles.button} type="submit">
        Deploy
      </Button>
    </Form>
  )
}

export function Preview() {
  return (
    <Card xstyle={styles.card}>
      <CardHeader>
        <CardTitle>Create project</CardTitle>
        <CardDescription>Deploy your new project in one-click.</CardDescription>
      </CardHeader>
      <CardPanel>
        <ProjectForm />
      </CardPanel>
      <CardFooter>
        <Flex xstyle={styles.flex}>
          <CircleAlertIcon {...stylex.props(previewStyles.preview5)} />
          <Paragraph>This will take a few seconds to complete.</Paragraph>
        </Flex>
      </CardFooter>
    </Card>
  )
}

const previewStyles = stylex.create({
  preview5: {
    inlineSize: "calc(0.25rem * 3)",
    blockSize: "1lh",
    flexShrink: "0",
  },
})
