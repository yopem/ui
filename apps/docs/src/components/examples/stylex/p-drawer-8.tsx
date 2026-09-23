import * as stylex from "@stylexjs/stylex"

import { Button } from "@/components/ui/button"
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
} from "@/components/ui/drawer"
import { Field, FieldLabel } from "@/components/ui/field"
import { Grid } from "@/components/ui/grid"
import { Input } from "@/components/ui/input"
import { Paragraph } from "@/components/ui/paragraph"
export default function Example() {
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
          <Grid {...stylex.props(exampleStyles.example2)}>
            <Paragraph {...stylex.props(exampleStyles.example3)}>
              Name
            </Paragraph>
            <Paragraph {...stylex.props(exampleStyles.example4)}>
              Bora Baloglu
            </Paragraph>
          </Grid>
          <Grid {...stylex.props(exampleStyles.example2)}>
            <Paragraph {...stylex.props(exampleStyles.example3)}>
              Email
            </Paragraph>
            <Paragraph {...stylex.props(exampleStyles.example4)}>
              bora@example.com
            </Paragraph>
          </Grid>
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
