"use client"

import { Button, useToast } from "@yopem-ui/react"

export default function ToastSuccess() {
  const { toast, Toaster } = useToast()

  return (
    <div className="p-6">
      <Button
        onClick={() =>
          toast({
            title: "Toast Title",
            description: "This is a reusable toast!",
            type: "success",
          })
        }
      >
        Success
      </Button>
      <Toaster />
    </div>
  )
}
