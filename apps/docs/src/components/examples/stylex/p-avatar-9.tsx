import * as stylex from "@stylexjs/stylex"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/stylex/avatar"
import { Box } from "@/components/ui/stylex/box"
export default function Example() {
  return (
    <Box {...stylex.props(exampleStyles.example1)}>
      <Avatar {...stylex.props(exampleStyles.example2)}>
        <AvatarImage
          alt="User"
          src="https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=128&h=128&dpr=2&q=80"
        />
        <AvatarFallback {...stylex.props(exampleStyles.example2)}>
          LT
        </AvatarFallback>
      </Avatar>
      <Box
        as="span"
        aria-hidden="true"
        {...stylex.props(exampleStyles.example3)}
      />
    </Box>
  )
}

const exampleStyles = stylex.create({
  example1: {
    position: "relative",
  },
  example2: {
    borderRadius: "var(--radius)",
  },
  example3: {
    position: "absolute",
    insetInlineEnd: "calc(0.25rem * -0.5)",
    insetBlockStart: "calc(0.25rem * -0.5)",
    inlineSize: "calc(0.25rem * 2)",
    blockSize: "calc(0.25rem * 2)",
    borderRadius: "calc(infinity * 1px)",
    backgroundColor: "oklch(69.6% 0.17 162.48)",
    outlineStyle: "solid",
    outlineWidth: "2px",
    outlineColor: "var(--background)",
  },
})
