import * as stylex from "@stylexjs/stylex"

import { Box } from "@/components/ui/box"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
} from "@/components/ui/input-group"
export default function Example() {
  return (
    <InputGroup>
      <Box
        as="input"
        data-slot="input"
        aria-label="Enter your domain"
        {...stylex.props(exampleStyles.nativeInput, exampleStyles.report1)}
        placeholder="coss"
        type="text"
      />
      <InputGroupAddon>
        <InputGroupText>https://</InputGroupText>
      </InputGroupAddon>
      <InputGroupAddon align="inline-end">
        <InputGroupText>.com</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  )
}

const exampleStyles = stylex.create({
  nativeInput: {
    appearance: "none",
    backgroundColor: "transparent",
    blockSize: { default: "2.125rem", "@media (min-width: 640px)": "1.875rem" },
    borderWidth: 0,
    color: "var(--foreground)",
    flexGrow: 1,
    inlineSize: "100%",
    lineHeight: {
      default: "2.125rem",
      "@media (min-width: 640px)": "1.875rem",
    },
    minInlineSize: 0,
    outline: "none",
    paddingInline: "0.75rem",
    "::placeholder": {
      color: "color-mix(in oklab, var(--muted-foreground) 72%, transparent)",
    },
    "::-webkit-calendar-picker-indicator": { display: "none" },
  },

  report1: {
    paddingInline: 0,
  },
})
