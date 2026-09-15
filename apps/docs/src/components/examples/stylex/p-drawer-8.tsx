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
import { Input } from "@/components/ui/stylex/input"

export default function Particle() {
  return (
    <Drawer position="right">
      <DrawerTrigger render={<Button variant="outline" />}>
        Nested inset drawers
      </DrawerTrigger>
      <DrawerPopup variant="inset">
        <DrawerHeader>
          <DrawerTitle>Manage team member</DrawerTitle>
          <DrawerDescription>
            View and manage a user in your team.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerPanel {...stylex.props(exampleStyles.example1)}>
          <div {...stylex.props(exampleStyles.example2)}>
            <p {...stylex.props(exampleStyles.example3)}>Name</p>
            <p {...stylex.props(exampleStyles.example4)}>Bora Baloglu</p>
          </div>
          <div {...stylex.props(exampleStyles.example2)}>
            <p {...stylex.props(exampleStyles.example3)}>Email</p>
            <p {...stylex.props(exampleStyles.example4)}>bora@example.com</p>
          </div>
        </DrawerPanel>
        <DrawerFooter>
          <Drawer position="right">
            <DrawerTrigger render={<Button variant="outline" />}>
              Edit details
            </DrawerTrigger>
            <DrawerPopup variant="inset">
              <DrawerHeader>
                <DrawerTitle>Edit details</DrawerTitle>
                <DrawerDescription>
                  Make changes to the member&apos;s information.
                </DrawerDescription>
              </DrawerHeader>
              <DrawerPanel {...stylex.props(exampleStyles.example1)}>
                <Field>
                  <FieldLabel>Name</FieldLabel>
                  <Input defaultValue="Bora Baloglu" type="text" />
                </Field>
                <Field>
                  <FieldLabel>Email</FieldLabel>
                  <Input defaultValue="bora@example.com" type="email" />
                </Field>
              </DrawerPanel>
              <DrawerFooter>
                <DrawerClose render={<Button variant="ghost" />}>
                  Cancel
                </DrawerClose>
                <Button type="submit">Save changes</Button>
              </DrawerFooter>
            </DrawerPopup>
          </Drawer>
        </DrawerFooter>
      </DrawerPopup>
    </Drawer>
  )
}

const exampleStyles = stylex.create({
  example1: {
    display: "grid",
    gap: "calc(0.25rem * 4)",
  },
  example2: {
    display: "grid",
    gap: "0.25rem",
  },
  example3: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    color: "var(--muted-foreground)",
  },
  example4: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: "500",
  },
})
