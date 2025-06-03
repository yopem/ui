// app/page.tsx or any component
"use client"

import { Button, useToast } from "@yopem-ui/react"

export default function ToastBasic() {
  const { toast, Toaster } = useToast()

  return (
    <div className="p-6">
      <Button
        onClick={() =>
          toast({
            id: "basic",
            title: "Toast Title",
            description: "This is a reusable toast!",
            action: {
              label: "action",
              onClick: () => alert("action clicked"),
            },
          })
        }
      >
        Basic
      </Button>
      <Toaster />
    </div>
  )
}
