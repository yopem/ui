import * as stylex from "@stylexjs/stylex"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/stylex/avatar"
import { Flex } from "@/components/ui/stylex/flex"
export default function Example() {
  return (
    <Flex {...stylex.props(exampleStyles.example1)}>
      <Avatar {...stylex.props(exampleStyles.example2)}>
        <AvatarImage
          alt="User"
          src="https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=128&h=128&dpr=2&q=80"
        />
        <AvatarFallback>AV</AvatarFallback>
      </Avatar>
      <Avatar {...stylex.props(exampleStyles.example3)}>
        <AvatarImage
          alt="User"
          src="https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=128&h=128&dpr=2&q=80"
        />
        <AvatarFallback>AV</AvatarFallback>
      </Avatar>
      <Avatar {...stylex.props(exampleStyles.example4)}>
        <AvatarImage
          alt="User"
          src="https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=128&h=128&dpr=2&q=80"
        />
        <AvatarFallback>AV</AvatarFallback>
      </Avatar>
    </Flex>
  )
}

const exampleStyles = stylex.create({
  example1: {
    display: "flex",
    alignItems: "center",
    gap: "calc(0.25rem * 4)",
  },
  example2: {
    borderRadius: "calc(var(--radius) - 2px)",
  },
  example3: {
    borderRadius: "calc(var(--radius) + 4px)",
  },
  example4: {
    borderRadius: "calc(infinity * 1px)",
  },
})
