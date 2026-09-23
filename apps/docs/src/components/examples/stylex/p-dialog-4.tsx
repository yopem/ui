"use client"

import * as stylex from "@stylexjs/stylex"
import { useState } from "react"

import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import { Field } from "@/components/ui/field"
import { Form } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"

export default function Example() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [value, setValue] = useState("")

  return (
    <Dialog
      onOpenChange={(o) => {
        if (!o && value) {
          setConfirmOpen(true)
        } else {
          setDialogOpen(o)
        }
      }}
      open={dialogOpen}
    >
      <DialogTrigger render={<Button variant="outline" />}>
        Compose
      </DialogTrigger>
      <DialogPopup showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>New message</DialogTitle>
          <DialogDescription>Type something and try closing.</DialogDescription>
        </DialogHeader>
        <Form
          {...stylex.props(exampleStyles.example1)}
          onSubmit={(event) => {
            event.preventDefault()
            // Close the dialog when submitting
            setDialogOpen(false)
          }}
        >
          <DialogPanel>
            <Field>
              <Textarea
                onChange={(e) => setValue(e.target.value)}
                value={value}
              />
            </Field>
          </DialogPanel>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>
              Cancel
            </DialogClose>
            <Button
              onClick={() => {
                setValue("")
                setDialogOpen(false)
              }}
            >
              Send
            </Button>
          </DialogFooter>
        </Form>
      </DialogPopup>

      {/* Confirmation dialog */}
      <AlertDialog onOpenChange={setConfirmOpen} open={confirmOpen}>
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Your message will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="ghost" />}>
              Go back
            </AlertDialogClose>
            <Button
              onClick={() => {
                setConfirmOpen(false)
                setValue("")
                setDialogOpen(false)
              }}
            >
              Discard
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </Dialog>
  )
}

const exampleStyles = stylex.create({
  example1: {
    display: "contents",
  },
})
