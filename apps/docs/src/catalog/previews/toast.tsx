"use client"

import type { MouseEvent } from "react"

import { Button } from "@registry/components/ui/button"
import {
  anchoredToastManager,
  AnchoredToastProvider,
  toastManager,
} from "@registry/components/ui/toast"
import { Wrap } from "@registry/components/ui/wrap"
import { useRef } from "react"

function handleClick() {
  toastManager.add({
    description: "East gate · Saturday at 07:00",
    title: "Field visit reserved",
  })
}

function showStatusToast(event: MouseEvent<HTMLButtonElement>) {
  const type = event.currentTarget.value

  toastManager.add({
    title: `${type[0].toUpperCase()}${type.slice(1)} notification`,
    timeout: 0,
    type,
  })
}

function showAnchoredToast(event: MouseEvent<HTMLButtonElement>) {
  anchoredToastManager.add({
    positionerProps: { anchor: event.currentTarget },
    title: "Field visit reserved",
  })
}

export function Preview() {
  const anchorRef = useRef<HTMLButtonElement>(null)

  return (
    <AnchoredToastProvider>
      <Wrap>
        <Button onClick={handleClick} variant="outline">
          Default Toast
        </Button>
        {(["success", "error", "info", "warning"] as const).map((type) => (
          <Button
            key={type}
            onClick={showStatusToast}
            value={type}
            variant="outline"
          >
            {type[0].toUpperCase() + type.slice(1)} Toast
          </Button>
        ))}
        <Button ref={anchorRef} onClick={showAnchoredToast} variant="outline">
          Anchored Toast
        </Button>
      </Wrap>
    </AnchoredToastProvider>
  )
}
