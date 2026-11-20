"use client"

import { HStack } from "@registry/components/ui/hstack"
import {
  ThemeSwitcher,
  ThemeToggle,
} from "@registry/components/ui/theme-switcher"

export function Preview() {
  return (
    <HStack>
      <ThemeToggle />
      <ThemeSwitcher />
    </HStack>
  )
}
