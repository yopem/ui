import * as stylex from "@stylexjs/stylex"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"

export default function Example() {
  return (
    <InputGroup
      {...stylex.props(exampleStyles.inputGroup, exampleStyles.noShadow)}
    >
      <InputGroupInput
        disabled
        placeholder="Processing…"
        {...stylex.props(exampleStyles.input)}
        type="search"
      />
      <InputGroupAddon>
        <Spinner {...stylex.props(exampleStyles.icon, exampleStyles.spinner)} />
      </InputGroupAddon>
    </InputGroup>
  )
}

const exampleStyles = stylex.create({
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
  },
  noShadow: { boxShadow: "none" },
  input: { paddingInlineStart: "0.5rem" },
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
