import * as stylex from "@stylexjs/stylex"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/stylex/avatar"
import { Badge } from "@/components/ui/stylex/badge"

export default function Particle() {
  return (
    <div {...stylex.props(exampleStyles.example1)}>
      <Avatar {...stylex.props(exampleStyles.example2)}>
        <AvatarImage
          alt="User"
          src="https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=128&h=128&dpr=2&q=80"
        />
        <AvatarFallback {...stylex.props(exampleStyles.example2)}>
          LT
        </AvatarFallback>
      </Avatar>
      <Badge {...stylex.props(exampleStyles.example3)} size="sm">
        6
      </Badge>
    </div>
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
    insetInlineEnd: "calc(0.25rem * -1.5)",
    insetBlockStart: "calc(0.25rem * -1.5)",
    borderRadius: "calc(infinity * 1px)",
    outlineStyle: "solid",
    outlineWidth: "2px",
    outlineColor: "var(--background)",
  },
})
