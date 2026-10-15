import { Button } from "@registry/components/ui/button"
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
} from "@registry/components/ui/dialog"
import { Field, FieldLabel } from "@registry/components/ui/field"
import { Form } from "@registry/components/ui/form"
import { Input } from "@registry/components/ui/input"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  dialogPopup: { maxInlineSize: { "@media (min-width: 768px)": "24rem" } },
  form: { display: "contents" },
  dialogPanel: { display: "grid", gap: "calc(0.25rem * 4)" },
})

const reservationFields = [
  { defaultValue: "Nora Ellis", label: "Name" },
  { defaultValue: "Wetland listening walk", label: "Visit" },
]

export function Preview() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        Open Dialog
      </DialogTrigger>
      <DialogPopup xstyle={styles.dialogPopup}>
        <DialogHeader>
          <DialogTitle>Edit reservation</DialogTitle>
          <DialogDescription>
            Update the visitor name and field visit before you collect
            equipment.
          </DialogDescription>
        </DialogHeader>
        <Form xstyle={styles.form}>
          <DialogPanel xstyle={styles.dialogPanel}>
            {reservationFields.map((field) => (
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
