"use client"

import { Steps, StepsItem } from "@registry/components/ui/steps"

export function Preview() {
  return (
    <Steps>
      <StepsItem status="completed">Account</StepsItem>
      <StepsItem status="current">Preferences</StepsItem>
      <StepsItem>Finish</StepsItem>
    </Steps>
  )
}
