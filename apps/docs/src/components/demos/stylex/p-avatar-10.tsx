import * as stylex from "@stylexjs/stylex"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/stylex/avatar"
import { Badge } from "@/components/ui/stylex/badge"

export default function Particle() {
  return (
    <div {...stylex.props(demoStyles.demo1)}>
      <Avatar>
        <AvatarImage
          alt="User"
          src="https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=128&h=128&dpr=2&q=80"
        />
        <AvatarFallback>LT</AvatarFallback>
      </Avatar>
      <Badge {...stylex.props(demoStyles.demo2)} size="sm">
        6
      </Badge>
    </div>
  )
}

const demoStyles = stylex.create({
  demo1: {
    position: "relative",
  },
  demo2: {
    position: "absolute",
    insetInlineEnd: "calc(0.25rem * -1)",
    insetBlockStart: "calc(0.25rem * -1)",
    borderRadius: "calc(infinity * 1px)",
    outlineStyle: "solid",
    outlineWidth: "2px",
    outlineColor: "var(--background)",
  },
})
