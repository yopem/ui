import * as stylex from "@stylexjs/stylex"

import { Button } from "@/components/ui/stylex/button"
import {
  Drawer,
  DrawerClose,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/stylex/drawer"
import { Field, FieldLabel } from "@/components/ui/stylex/field"
import { Form } from "@/components/ui/stylex/form"
import { Input } from "@/components/ui/stylex/input"

export default function Example() {
  return (
    <div {...stylex.props(exampleStyles.example1)}>
      <Drawer position="right">
        <DrawerTrigger render={<Button variant="outline" />}>
          Default footer
        </DrawerTrigger>
        <DrawerPopup variant="inset">
          <DrawerHeader>
            <DrawerTitle>Edit profile</DrawerTitle>
            <DrawerDescription>
              Make changes to your profile here. Click save when you&apos;re
              done.
            </DrawerDescription>
          </DrawerHeader>
          <Form {...stylex.props(exampleStyles.example2)}>
            <DrawerPanel {...stylex.props(exampleStyles.example3)}>
              <Field>
                <FieldLabel>Name</FieldLabel>
                <Input defaultValue="Margaret Welsh" type="text" />
              </Field>
              <Field>
                <FieldLabel>Username</FieldLabel>
                <Input defaultValue="@maggie.welsh" type="text" />
              </Field>
            </DrawerPanel>
            <DrawerFooter>
              <DrawerClose render={<Button variant="ghost" />}>
                Cancel
              </DrawerClose>
              <Button>Save</Button>
            </DrawerFooter>
          </Form>
        </DrawerPopup>
      </Drawer>
      <Drawer position="right">
        <DrawerTrigger render={<Button variant="outline" />}>
          Bare footer
        </DrawerTrigger>
        <DrawerPopup variant="inset">
          <DrawerHeader>
            <DrawerTitle>Edit profile</DrawerTitle>
            <DrawerDescription>
              Make changes to your profile here. Click save when you&apos;re
              done.
            </DrawerDescription>
          </DrawerHeader>
          <Form {...stylex.props(exampleStyles.example2)}>
            <DrawerPanel {...stylex.props(exampleStyles.example3)}>
              <Field>
                <FieldLabel>Name</FieldLabel>
                <Input defaultValue="Margaret Welsh" type="text" />
              </Field>
              <Field>
                <FieldLabel>Username</FieldLabel>
                <Input defaultValue="@maggie.welsh" type="text" />
              </Field>
            </DrawerPanel>
            <DrawerFooter variant="bare">
              <DrawerClose render={<Button variant="ghost" />}>
                Cancel
              </DrawerClose>
              <Button>Save</Button>
            </DrawerFooter>
          </Form>
        </DrawerPopup>
      </Drawer>
    </div>
  )
}

const exampleStyles = stylex.create({
  example1: {
    display: "flex",
    flexWrap: "wrap",
    gap: "calc(0.25rem * 2)",
  },
  example2: {
    display: "contents",
  },
  example3: {
    display: "grid",
    gap: "calc(0.25rem * 4)",
  },
})
