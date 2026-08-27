import * as stylex from "@stylexjs/stylex"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/stylex/avatar"
import { Button } from "@/components/ui/stylex/button"

export default function Particle() {
  return (
    <Button {...stylex.props(demoStyles.demo1, demoStyles.pill)}>
      <Avatar {...stylex.props(demoStyles.demo2)}>
        <AvatarImage
          alt="Luke Tracy"
          src="https://images.unsplash.com/photo-1628157588553-5eeea00af15c?w=128&h=128&dpr=2&q=80"
        />
        <AvatarFallback>LT</AvatarFallback>
      </Avatar>
      @georgelucas
    </Button>
  )
}

const demoStyles = stylex.create({
  pill: { borderRadius: "calc(infinity * 1px)" },
  demo1: {
    paddingInlineStart: "0.25rem",
  },
  demo2: {
    inlineSize: "calc(0.25rem * 6)",
    blockSize: "calc(0.25rem * 6)",
  },
})
