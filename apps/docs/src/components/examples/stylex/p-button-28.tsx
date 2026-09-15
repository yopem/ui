import * as stylex from "@stylexjs/stylex"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/stylex/avatar"
import { Button } from "@/components/ui/stylex/button"

export default function Example() {
  return (
    <Button {...stylex.props(exampleStyles.example1, exampleStyles.pill)}>
      <Avatar {...stylex.props(exampleStyles.example2)}>
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

const exampleStyles = stylex.create({
  pill: { borderRadius: "calc(infinity * 1px)" },
  example1: {
    paddingInlineStart: "0.25rem",
  },
  example2: {
    inlineSize: "calc(0.25rem * 6)",
    blockSize: "calc(0.25rem * 6)",
  },
})
