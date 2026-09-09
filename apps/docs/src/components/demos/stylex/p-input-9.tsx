"use client"

import { themeMarker } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { EyeIcon, EyeOffIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/stylex/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/stylex/input-group"
import {
  Tooltip,
  TooltipPopup,
  TooltipTrigger,
} from "@/components/ui/stylex/tooltip"

export default function Particle() {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <InputGroup {...stylex.props(demoStyles.inputGroup, demoStyles.outlined)}>
      <InputGroupInput
        aria-label="Password with toggle visibility"
        placeholder="Enter your password"
        {...stylex.props(demoStyles.input)}
        type={showPassword ? "text" : "password"}
      />
      <InputGroupAddon
        align="inline-end"
        {...stylex.props(demoStyles.endAddon)}
      >
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword(!showPassword)}
                size="icon-xs"
                variant="ghost"
              />
            }
          >
            {showPassword ? (
              <EyeOffIcon
                {...stylex.props(demoStyles.icon2, demoStyles.icon)}
              />
            ) : (
              <EyeIcon {...stylex.props(demoStyles.icon2, demoStyles.icon)} />
            )}
          </TooltipTrigger>
          <TooltipPopup>
            {showPassword ? "Hide password" : "Show password"}
          </TooltipPopup>
        </Tooltip>
      </InputGroupAddon>
    </InputGroup>
  )
}

const demoStyles = stylex.create({
  icon2: {
    blockSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    inlineSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    flexShrink: 0,
    pointerEvents: "none",
  },
  outlined: { boxShadow: "var(--button-outline-shadow)" },
  input: { paddingInlineEnd: "0.5rem" },
  endAddon: { marginInlineEnd: "-0.5rem" },
  icon: {
    marginInline: "-0.125rem",
    opacity: 0.8,
  },
  inputGroup: {
    lineHeight: {
      default: "1.5rem",
      "@media (min-width: 640px)": "1.25rem",
    },
    "::before": {
      borderRadius: "calc(var(--radius-lg) - 1px)",
      boxShadow: {
        default: "var(--button-outline-inset-shadow)",
        [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
          "var(--button-outline-inset-shadow-dark)",
      },
      content: '""',
      inset: 0,
      pointerEvents: "none",
      position: "absolute",
    },
  },
})
