"use client"

import * as React from "react"

import { CheckboxMenu } from "@/components/menu/checkbox-menu"
import { GroupMenu } from "@/components/menu/group-menu"
import { NestedMenu } from "@/components/menu/nested-menu"
import { RadioGroupContent } from "@/components/menu/radio-group-menu"

export default function MenuComponentPage() {
  return (
    <main className="flex w-full flex-col px-4 py-12">
      <RadioGroupContent />
      <NestedMenu />
      <GroupMenu />
      <CheckboxMenu />
    </main>
  )
}
