import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/stylex/input-group"
import { Kbd } from "@/components/ui/stylex/kbd"

export default function Particle() {
  return (
    <InputGroup {...stylex.props(demoStyles.inputGroup, demoStyles.outlined)}>
      <InputGroupInput
        aria-label="Search"
        placeholder="Search…"
        {...stylex.props(demoStyles.input)}
        type="search"
      />
      <InputGroupAddon
        align="inline-end"
        {...stylex.props(demoStyles.endAddon)}
      >
        <Kbd {...stylex.props(demoStyles.kbd)}>/</Kbd>
      </InputGroupAddon>
    </InputGroup>
  )
}

const demoStyles = stylex.create({
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
