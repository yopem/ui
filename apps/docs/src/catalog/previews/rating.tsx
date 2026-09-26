"use client"

import { Rating } from "@registry/components/ui/rating"

export function Preview() {
  return (
    <>
      <Rating aria-label="Rate this component" defaultValue={3} />
      <Rating aria-label="Disabled rating" defaultValue={2} disabled />
    </>
  )
}
