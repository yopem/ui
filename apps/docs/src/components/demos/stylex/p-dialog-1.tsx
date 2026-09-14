import * as stylex from "@stylexjs/stylex"

import { Button } from "@/components/ui/stylex/button"
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/stylex/dialog"
import { Field, FieldLabel } from "@/components/ui/stylex/field"
import { Form } from "@/components/ui/stylex/form"
import { Input } from "@/components/ui/stylex/input"

const profileFields = [
  { defaultValue: "Margaret Welsh", label: "Name" },
  { defaultValue: "@maggie.welsh", label: "Username" },
]

export default function Particle() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        Open Dialog
      </DialogTrigger>
      <DialogPopup {...stylex.props(demoStyles.demo1)}>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <Form {...stylex.props(demoStyles.demo2)}>
          <DialogPanel {...stylex.props(demoStyles.demo3)}>
            {profileFields.map((field) => (
              <Field key={field.label}>
                <FieldLabel>{field.label}</FieldLabel>
                <Input defaultValue={field.defaultValue} type="text" />
              </Field>
            ))}
          </DialogPanel>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>
              Cancel
            </DialogClose>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </Form>
      </DialogPopup>
    </Dialog>
  )
}

const demoStyles = stylex.create({
  demo1: {
    maxInlineSize: {
      default: null,
      "@media (min-width: 40rem)": "24rem",
    },
  },
  demo2: {
    display: "contents",
  },
  demo3: {
    display: "grid",
    gap: "calc(0.25rem * 4)",
  },
})
