"use client"

import { Button } from "@/components/ui/button"
import { toastManager } from "@/components/ui/toast"

const DEDUP_ID = "coss-example-dedup-toast"

export default function Example() {
  return (
    <Button
      onClick={() => {
        toastManager.add({
          description:
            "Repeated clicks update this toast instead of stacking another.",
          id: DEDUP_ID,
          title: "Saved",
          type: "success",
        })
      }}
      variant="outline"
    >
      One Success Toast
    </Button>
  )
}
