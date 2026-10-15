"use client"

import { Steps, StepsItem } from "@registry/components/ui/steps"

export function Preview() {
  return (
    <Steps>
      <StepsItem status="completed">Choose equipment</StepsItem>
      <StepsItem status="current">Plan visit</StepsItem>
      <StepsItem>Confirm loan</StepsItem>
    </Steps>
  )
}
