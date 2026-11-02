"use client"

import type { ComponentProps } from "react"

import { Button } from "@registry/components/ui/button"
import {
  Menu,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from "@registry/components/ui/menu"

export type EditorReviewMode = "editing" | "suggestion" | "viewing"

export type EditorReviewModeMenuProps = Omit<
  ComponentProps<typeof Button>,
  "value"
> & {
  value: EditorReviewMode
  canChangeMode: (mode: EditorReviewMode) => boolean
  onModeChange: (mode: EditorReviewMode) => void
}

const modes = ["editing", "suggestion", "viewing"] as const

const labels = {
  editing: "Editing",
  suggestion: "Suggestion",
  viewing: "Viewing",
}

export function EditorReviewModeMenu({
  value,
  canChangeMode,
  onModeChange,
  children,
  disabled,
  "aria-label": label,
  ...props
}: EditorReviewModeMenuProps) {
  const menuLabel = label ?? "Document mode"
  const triggerLabel = label ?? `Document mode: ${labels[value]}`

  return (
    <Menu>
      <MenuTrigger
        aria-label={triggerLabel}
        disabled={disabled}
        render={<Button variant="outline" size="sm" {...props} />}
      >
        {children ?? label ?? labels[value]}
      </MenuTrigger>
      <MenuPopup
        aria-label={menuLabel}
        portalProps={{ role: "region", "aria-label": menuLabel }}
      >
        <MenuRadioGroup value={value}>
          {modes.map((mode) => (
            <MenuRadioItem
              key={mode}
              value={mode}
              disabled={disabled === true || canChangeMode(mode) !== true}
              onClick={(event) => {
                if (
                  !event.defaultPrevented &&
                  disabled !== true &&
                  canChangeMode(mode) === true
                )
                  onModeChange(mode)
              }}
            >
              {labels[mode]}
            </MenuRadioItem>
          ))}
        </MenuRadioGroup>
      </MenuPopup>
    </Menu>
  )
}
