"use client"

import { Button } from "@/components/ui/stylex/button"
import { toastManager } from "@/components/ui/stylex/toast"

const ERROR_TOAST_ID = "coss-example-error-upsert"

export default function Example() {
  return (
    <Button
      onClick={() => {
        toastManager.add({
          description:
            "Repeated clicks update this toast; errors use a shake animation.",
          id: ERROR_TOAST_ID,
          title: "Something went wrong",
          type: "error",
        })
      }}
      variant="outline"
    >
      One Error Toast
    </Button>
  )
}
