import * as stylex from "@stylexjs/stylex"

import { Button } from "@/components/ui/button"
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
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Form } from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const profileFields = [
  { defaultValue: "Margaret Welsh", label: "Name" },
  { defaultValue: "@maggie.welsh", label: "Username" },
]

export function Preview() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        Open Dialog
      </DialogTrigger>
      <DialogPopup {...stylex.props(previewStyles.preview1)}>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <Form {...stylex.props(previewStyles.preview2)}>
          <DialogPanel {...stylex.props(previewStyles.preview3)}>
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

const previewStyles = stylex.create({
  preview1: {
    maxInlineSize: {
      default: null,
      "@media (min-width: 40rem)": "24rem",
    },
  },
  preview2: {
    display: "contents",
  },
  preview3: {
    display: "grid",
    gap: "calc(0.25rem * 4)",
  },
})
