"use client"

import {
  RadioGroupPrimitive,
  RadioPrimitive,
} from "@/components/ui/tailwind/radio-group"
import {
  segmentedControlItemVariants,
  segmentedControlRootClassName,
} from "@/lib/segmented-control"

const itemClassName = segmentedControlItemVariants({
  className: "grow",
  size: "lg",
  state: "checked",
})

export default function Particle() {
  return (
    <RadioGroupPrimitive
      aria-label="Billing period"
      className={segmentedControlRootClassName}
      defaultValue="monthly"
    >
      <RadioPrimitive.Root className={itemClassName} value="monthly">
        Monthly
      </RadioPrimitive.Root>
      <RadioPrimitive.Root className={itemClassName} value="yearly">
        Yearly
      </RadioPrimitive.Root>
    </RadioGroupPrimitive>
  )
}
