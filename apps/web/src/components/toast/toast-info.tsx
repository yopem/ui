// app/page.tsx or any component
"use client"

import { Button, useToast } from "@yopem-ui/react"

export default function ToastInfo() {
  const { toast, Toaster } = useToast()

  return (
    <div className="p-6">
      <Button
        onClick={() =>
          toast({
            title: "Toast Title",
            description: "This is a reusable toast!",
            type: "info",
          })
        }
      >
        Info
      </Button>
      <Toaster />
    </div>
  )
}
