import { Button } from "@registry/components/ui/button"
import { Field, FieldLabel } from "@registry/components/ui/field"
import { Form } from "@registry/components/ui/form"
import { Input } from "@registry/components/ui/input"
import {
  Sheet,
  SheetClose,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPanel,
  SheetPopup,
  SheetTitle,
  SheetTrigger,
} from "@registry/components/ui/sheet"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  form: { display: "contents" },
  sheetPanel: { display: "grid", gap: "calc(0.25rem * 4)" },
})

const visitFields = [
  { defaultValue: "Nora Ellis", label: "Name" },
  { defaultValue: "East reed bed", label: "Location" },
]

export function Preview() {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" />}>
        Open Sheet
      </SheetTrigger>
      <SheetPopup>
        <SheetHeader>
          <SheetTitle>Edit field visit</SheetTitle>
          <SheetDescription>
            Set the contact name and survey location for the station log.
          </SheetDescription>
        </SheetHeader>
        <Form xstyle={styles.form}>
          <SheetPanel xstyle={styles.sheetPanel}>
            {visitFields.map(({ defaultValue, label }) => (
              <Field key={label}>
                <FieldLabel>{label}</FieldLabel>
                <Input defaultValue={defaultValue} type="text" />
              </Field>
            ))}
          </SheetPanel>
          <SheetFooter>
            <SheetClose render={<Button variant="ghost" />}>Cancel</SheetClose>
            <Button type="submit">Save</Button>
          </SheetFooter>
        </Form>
      </SheetPopup>
    </Sheet>
  )
}
