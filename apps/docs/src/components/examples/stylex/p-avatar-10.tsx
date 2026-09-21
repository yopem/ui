import * as stylex from "@stylexjs/stylex"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/stylex/avatar"
import { Badge } from "@/components/ui/stylex/badge"
import { Box } from "@/components/ui/stylex/box"
export default function Example() {
  return (
    <Box {...stylex.props(exampleStyles.example1)}>
      <Avatar>
        <AvatarImage
          alt="User"
          src="https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=128&h=128&dpr=2&q=80"
        />
        <AvatarFallback>LT</AvatarFallback>
      </Avatar>
      <Badge {...stylex.props(exampleStyles.example2)} size="sm">
        6
      </Badge>
    </Box>
  )
}

const exampleStyles = stylex.create({
  example1: {
    position: "relative",
  },
  example2: {
    position: "absolute",
    insetInlineEnd: "calc(0.25rem * -1)",
    insetBlockStart: "calc(0.25rem * -1)",
    borderRadius: "calc(infinity * 1px)",
    outlineStyle: "solid",
    outlineWidth: "2px",
    outlineColor: "var(--background)",
  },
})
