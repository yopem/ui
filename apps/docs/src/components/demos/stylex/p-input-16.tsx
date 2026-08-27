import * as stylex from "@stylexjs/stylex"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/stylex/input-group"
import { Spinner } from "@/components/ui/stylex/spinner"

export default function Particle() {
  return (
    <InputGroup {...stylex.props(demoStyles.inputGroup, demoStyles.noShadow)}>
      <InputGroupInput
        disabled
        placeholder="Processing…"
        {...stylex.props(demoStyles.input)}
        type="search"
      />
      <InputGroupAddon align="inline-end">
        <Spinner {...stylex.props(demoStyles.spinner)} />
      </InputGroupAddon>
    </InputGroup>
  )
}

const demoStyles = stylex.create({
  noShadow: { boxShadow: "none" },
  input: { paddingInlineEnd: "0.5rem" },
  spinner: { marginInline: "-0.125rem" },
  inputGroup: {
    lineHeight: {
      default: "1.5rem",
      "@media (min-width: 640px)": "1.25rem",
    },
    "::before": {
      borderRadius: "calc(var(--radius-lg) - 1px)",
      content: '""',
      inset: 0,
      pointerEvents: "none",
      position: "absolute",
    },
  },
})
