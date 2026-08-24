"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "@/components/ui/tailwind/alert-dialog";
import { Button } from "@/components/ui/tailwind/button";
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
} from "@/components/ui/tailwind/dialog";
import { Field } from "@/components/ui/tailwind/field";
import { Form } from "@/components/ui/tailwind/form";
import { Textarea } from "@/components/ui/tailwind/textarea";

export default function Particle() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [value, setValue] = useState("");

  return (
    <Dialog
      onOpenChange={(o) => {
        if (!o && value) {
          setConfirmOpen(true);
        } else {
          setDialogOpen(o);
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
          className="contents"
          onSubmit={(event) => {
            event.preventDefault();
            // Close the dialog when submitting
            setDialogOpen(false);
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
                setValue("");
                setDialogOpen(false);
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
                setConfirmOpen(false);
                setValue("");
                setDialogOpen(false);
              }}
            >
              Discard
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </Dialog>
  );
}
