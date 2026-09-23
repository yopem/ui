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
import { Grid } from "@/components/ui/grid"
import { Input } from "@/components/ui/input"
import { Paragraph } from "@/components/ui/paragraph"
export default function Example() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        Open parent
      </DialogTrigger>
      <DialogPopup showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Manage team member</DialogTitle>
          <DialogDescription>
            View and manage a user in your team.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel {...stylex.props(exampleStyles.example1)}>
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
        </DialogPanel>
        <DialogFooter>
          <Dialog>
            <DialogTrigger render={<Button variant="outline" />}>
              Edit details
            </DialogTrigger>
            <DialogPopup showCloseButton={false}>
              <DialogHeader>
                <DialogTitle>Edit details</DialogTitle>
                <DialogDescription>
                  Make changes to the member&apos;s information.
                </DialogDescription>
              </DialogHeader>
              <DialogPanel {...stylex.props(exampleStyles.example1)}>
                <Field>
                  <FieldLabel>Name</FieldLabel>
                  <Input defaultValue="Bora Baloglu" type="text" />
                </Field>
                <Field>
                  <FieldLabel>Email</FieldLabel>
                  <Input defaultValue="bora@example.com" type="text" />
                </Field>
              </DialogPanel>
              <DialogFooter>
                <DialogClose render={<Button variant="ghost" />}>
                  Cancel
                </DialogClose>
                <Button type="submit">Save changes</Button>
              </DialogFooter>
            </DialogPopup>
          </Dialog>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
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
