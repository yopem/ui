import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@registry/components/ui/input-group"
import * as stylex from "@stylexjs/stylex"
import { SearchIcon } from "lucide-react"

export function Preview() {
  return (
    <InputGroup>
      <InputGroupInput aria-label="Search" placeholder="Search" type="search" />
      <InputGroupAddon>
        <SearchIcon {...stylex.props(previewStyles.icon)} aria-hidden="true" />
      </InputGroupAddon>
    </InputGroup>
  )
}

const previewStyles = stylex.create({
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
  },
})
