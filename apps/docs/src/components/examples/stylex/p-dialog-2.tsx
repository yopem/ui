"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog"
import { Menu, MenuItem, MenuPopup, MenuTrigger } from "@/components/ui/menu"

export default function Example() {
  const [dialogOpen, setDialogOpen] = useState(false)
  return (
    <>
      <Menu>
        <MenuTrigger render={<Button variant="outline" />}>
          Open menu
        </MenuTrigger>
        <MenuPopup align="start">
          <MenuItem onClick={() => setDialogOpen(true)}>Open dialog</MenuItem>
        </MenuPopup>
      </Menu>
      <Dialog onOpenChange={setDialogOpen} open={dialogOpen}>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>Change your preferences</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>Close</DialogClose>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </>
  )
}
