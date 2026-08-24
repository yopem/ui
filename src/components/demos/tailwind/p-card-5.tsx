import { Button } from "@/components/ui/tailwind/button"
import {
  Card,
  CardFrame,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
  CardPanel,
} from "@/components/ui/tailwind/card"
import { Field, FieldLabel } from "@/components/ui/tailwind/field"
import { Form } from "@/components/ui/tailwind/form"
import { Input } from "@/components/ui/tailwind/input"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/tailwind/select"

const frameworkOptions = [
  { label: "Next.js", value: "next" },
  { label: "Vite", value: "vite" },
  { label: "Remix", value: "remix" },
  { label: "Astro", value: "astro" },
]

export default function Particle() {
  return (
    <CardFrame className="w-full max-w-xs">
      <CardFrameHeader>
        <CardFrameTitle>Create project</CardFrameTitle>
        <CardFrameDescription>
          Deploy your new project in one-click.
        </CardFrameDescription>
      </CardFrameHeader>
      <Card>
        <CardPanel>
          <Form className="flex w-full flex-col gap-4">
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
            <Button className="w-full" type="submit">
              Deploy
            </Button>
          </Form>
        </CardPanel>
      </Card>
    </CardFrame>
  )
}
