import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Form } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
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
} from "@/components/ui/sheet"

const profileFields = [
  { defaultValue: "Margaret Welsh", label: "Name" },
  { defaultValue: "@maggie.welsh", label: "Username" },
]

export function Preview() {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" />}>
        Open Sheet
      </SheetTrigger>
      <SheetPopup>
        <SheetHeader>
          <SheetTitle>Edit profile</SheetTitle>
          <SheetDescription>
            Make changes to your profile here. Click save when you&apos;re done.
          </SheetDescription>
        </SheetHeader>
        <Form display={"contents"}>
          <SheetPanel display={"grid"} gap={"calc(0.25rem * 4)"}>
            {profileFields.map(({ defaultValue, label }) => (
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
