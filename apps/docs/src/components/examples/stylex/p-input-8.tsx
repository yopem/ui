import { themeMarker } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { InfoIcon } from "lucide-react"

import { Button } from "@/components/ui/stylex/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/stylex/input-group"
import {
  Popover,
  PopoverPopup,
  PopoverTrigger,
} from "@/components/ui/stylex/popover"

export default function Particle() {
  return (
    <InputGroup
      {...stylex.props(exampleStyles.inputGroup, exampleStyles.outlined)}
    >
      <InputGroupInput
        aria-label="Set your URL"
        placeholder="coss.com"
        {...stylex.props(exampleStyles.input)}
        type="text"
      />
      <InputGroupAddon>https://</InputGroupAddon>
      <InputGroupAddon
        align="inline-end"
        {...stylex.props(exampleStyles.endAddon)}
      >
        <Popover>
          <PopoverTrigger
            openOnHover
            render={
              <Button aria-label="More info" size="icon-xs" variant="ghost" />
            }
          >
            <InfoIcon
              {...stylex.props(exampleStyles.icon2, exampleStyles.icon)}
            />
          </PopoverTrigger>
          <PopoverPopup side="top" tooltipStyle>
            <p>The URL of your website</p>
          </PopoverPopup>
        </Popover>
      </InputGroupAddon>
    </InputGroup>
  )
}

const exampleStyles = stylex.create({
  icon2: {
    blockSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    inlineSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    flexShrink: 0,
    pointerEvents: "none",
  },
  outlined: { boxShadow: "var(--button-outline-shadow)" },
  input: { paddingInlineEnd: "0.5rem", paddingInlineStart: 0 },
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
