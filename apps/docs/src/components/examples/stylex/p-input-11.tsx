import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Kbd } from "@/components/ui/kbd"

export default function Example() {
  return (
    <InputGroup
      {...stylex.props(exampleStyles.inputGroup, exampleStyles.outlined)}
    >
      <InputGroupInput
        aria-label="Search"
        placeholder="Search…"
        {...stylex.props(exampleStyles.input)}
        type="search"
      />
      <InputGroupAddon
        align="inline-end"
        {...stylex.props(exampleStyles.endAddon)}
      >
        <Kbd {...stylex.props(exampleStyles.kbd)}>/</Kbd>
      </InputGroupAddon>
    </InputGroup>
  )
}

const exampleStyles = stylex.create({
  outlined: { boxShadow: "var(--button-outline-shadow)" },
  input: { paddingInlineEnd: "0.5rem" },
  endAddon: { marginInlineEnd: "-0.35rem" },
  kbd: { borderRadius: "calc(var(--radius) - 5px)", lineHeight: "1rem" },
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
import { themeMarker } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
