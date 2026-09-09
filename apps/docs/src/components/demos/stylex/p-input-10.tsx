"use client"

import { themeMarker } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { InfoIcon, StarIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/stylex/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/stylex/input-group"
import {
  Popover,
  PopoverDescription,
  PopoverPopup,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/stylex/popover"

export default function Particle() {
  const [isFavorite, setIsFavorite] = useState(false)

  return (
    <InputGroup
      {...stylex.props(
        demoStyles.inputGroup,
        demoStyles.report1Manual,
        demoStyles.outlined,
      )}
    >
      <Popover>
        <InputGroupAddon {...stylex.props(demoStyles.startAddon)}>
          <PopoverTrigger
            render={
              <Button
                size="icon-xs"
                {...stylex.props(demoStyles.innerButton)}
                variant="secondary"
              />
            }
          >
            <InfoIcon {...stylex.props(demoStyles.icon2, demoStyles.icon)} />
          </PopoverTrigger>
        </InputGroupAddon>
        <PopoverPopup
          align="start"
          alignOffset={-5}
          {...stylex.props(demoStyles.demo1)}
          sideOffset={6}
        >
          <PopoverTitle {...stylex.props(demoStyles.demo2)}>
            Your connection is not secure.
          </PopoverTitle>
          <PopoverDescription>
            You should not enter any sensitive information on this site.
          </PopoverDescription>
        </PopoverPopup>
      </Popover>
      <InputGroupAddon {...stylex.props(demoStyles.protocolAddon)}>
        https://
      </InputGroupAddon>
      <InputGroupInput
        aria-label="Url"
        {...stylex.props(demoStyles.input)}
        type="text"
      />
      <InputGroupAddon
        align="inline-end"
        {...stylex.props(demoStyles.endAddon)}
      >
        <Button
          onClick={() => setIsFavorite(!isFavorite)}
          size="icon-xs"
          {...stylex.props(demoStyles.innerButton)}
          variant="ghost"
        >
          <StarIcon
            {...stylex.props(
              demoStyles.icon3,
              demoStyles.icon,
              demoStyles.demo4,
              demoStyles.iconSize,
            )}
            data-favorite={isFavorite}
          />
        </Button>
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
  icon3: {
    flexShrink: 0,
    pointerEvents: "none",
  },
  outlined: {
    borderRadius: "var(--radius)",
    boxShadow: "var(--button-outline-shadow)",
  },
  startAddon: { marginInlineStart: "-0.5rem" },
  innerButton: { borderRadius: "calc(var(--radius) - 2px)" },
  protocolAddon: {
    color: "var(--muted-foreground)",
    paddingInlineStart: "0.375rem",
  },
  input: { paddingInlineEnd: "0.5rem", paddingInlineStart: "0.25rem" },
  endAddon: { marginInlineEnd: "-0.5rem" },
  iconSize: { blockSize: "1rem", inlineSize: "1rem" },
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
  demo1: {
    inlineSize: "calc(0.25rem * 64)",
  },
  demo2: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
  },
  demo4: {
    fill: {
      default: null,
      '[data-favorite="true"]': "var(--primary)",
    },
    stroke: {
      default: null,
      '[data-favorite="true"]': "var(--primary)",
    },
  },

  report1Manual: {
    "--radius-lg": "9999px",
    "--radius": "9999rem",
  },
})
