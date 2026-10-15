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
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@registry/components/ui/select"
import { Text } from "@registry/components/ui/text"
import * as stylex from "@stylexjs/stylex"
import { CircleAlertIcon } from "lucide-react"

const styles = stylex.create({
  inheritedText: {
    fontSize: "inherit",
    lineHeight: "inherit",
    color: "inherit",
  },
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

const kitOptions = [
  { label: "Birdwatching", value: "birdwatching" },
  { label: "Audio recording", value: "audio" },
  { label: "Water sampling", value: "water" },
  { label: "Trail mapping", value: "mapping" },
]

function KitSelect() {
  return (
    <Select defaultValue="birdwatching" items={kitOptions}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectPopup>
        {kitOptions.map(({ label, value }) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectPopup>
    </Select>
  )
}

function ReservationForm() {
  return (
    <Form xstyle={styles.form}>
      <Field>
        <FieldLabel>Name</FieldLabel>
        <Input placeholder="Morning wetland survey" type="text" />
      </Field>
      <Field>
        <FieldLabel>Equipment</FieldLabel>
        <KitSelect />
      </Field>
      <Button xstyle={styles.button} type="submit">
        Reserve kit
      </Button>
    </Form>
  )
}

export function Preview() {
  return (
    <Card xstyle={styles.card}>
      <CardHeader>
        <CardTitle>Reserve a field kit</CardTitle>
        <CardDescription>
          Choose equipment for your next field visit.
        </CardDescription>
      </CardHeader>
      <CardPanel>
        <ReservationForm />
      </CardPanel>
      <CardFooter>
        <Flex xstyle={styles.flex}>
          <CircleAlertIcon {...stylex.props(previewStyles.preview5)} />
          <Text xstyle={styles.inheritedText}>
            Collect your kit from the station desk.
          </Text>
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
