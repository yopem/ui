"use client"

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
import { useMediaQuery } from "@/hooks/use-media-query"

const FORM_TITLE = "Edit profile"
const FORM_DESCRIPTION =
  "Make changes to your profile here. Click save when you're done."
const TRIGGER_LABEL = "Open"
const CANCEL_LABEL = "Cancel"
const SAVE_LABEL = "Save"

const formFields = (
  <>
    <Field>
      <FieldLabel>Name</FieldLabel>
      <Input defaultValue="Margaret Welsh" type="text" />
    </Field>
    <Field>
      <FieldLabel>Username</FieldLabel>
      <Input defaultValue="@maggie.welsh" type="text" />
    </Field>
  </>
)

export default function Particle() {
  const isMobile = useMediaQuery("max-md")

  if (isMobile) {
    return (
      <Drawer>
        <DrawerTrigger render={<Button variant="outline" />}>
          {TRIGGER_LABEL}
        </DrawerTrigger>
        <DrawerPopup showBar>
          <DrawerHeader>
            <DrawerTitle>{FORM_TITLE}</DrawerTitle>
            <DrawerDescription>{FORM_DESCRIPTION}</DrawerDescription>
          </DrawerHeader>
          <Form {...stylex.props(demoStyles.demo1)}>
            <DrawerPanel {...stylex.props(demoStyles.demo2)} scrollable={false}>
              {formFields}
            </DrawerPanel>
            <DrawerFooter>
              <DrawerClose render={<Button variant="ghost" />}>
                {CANCEL_LABEL}
              </DrawerClose>
              <Button type="submit">{SAVE_LABEL}</Button>
            </DrawerFooter>
          </Form>
        </DrawerPopup>
      </Drawer>
    )
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        {TRIGGER_LABEL}
      </DialogTrigger>
      <DialogPopup {...stylex.props(demoStyles.demo3)}>
        <DialogHeader>
          <DialogTitle>{FORM_TITLE}</DialogTitle>
          <DialogDescription>{FORM_DESCRIPTION}</DialogDescription>
        </DialogHeader>
        <Form {...stylex.props(demoStyles.demo1)}>
          <DialogPanel {...stylex.props(demoStyles.demo2)}>
            {formFields}
          </DialogPanel>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>
              {CANCEL_LABEL}
            </DialogClose>
            <Button type="submit">{SAVE_LABEL}</Button>
          </DialogFooter>
        </Form>
      </DialogPopup>
    </Dialog>
  )
}

const demoStyles = stylex.create({
  demo1: {
    display: "contents",
  },
  demo2: {
    display: "grid",
    gap: "calc(0.25rem * 4)",
  },
  demo3: {
    maxInlineSize: {
      default: null,
      "@media (min-width: 40rem)": "24rem",
    },
  },
})
