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

export default function Particle() {
  return (
    <div {...stylex.props(demoStyles.demo1)}>
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
          <Form {...stylex.props(demoStyles.demo2)}>
            <DrawerPanel {...stylex.props(demoStyles.demo3)}>
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
          <Form {...stylex.props(demoStyles.demo2)}>
            <DrawerPanel {...stylex.props(demoStyles.demo3)}>
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

const demoStyles = stylex.create({
  demo1: {
    display: "flex",
    flexWrap: "wrap",
    gap: "calc(0.25rem * 2)",
  },
  demo2: {
    display: "contents",
  },
  demo3: {
    display: "grid",
    gap: "calc(0.25rem * 4)",
  },
})
