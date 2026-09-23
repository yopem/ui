import * as stylex from "@stylexjs/stylex"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Flex } from "@/components/ui/flex"
export default function Example() {
  return (
    <Flex {...stylex.props(exampleStyles.example1)}>
      <Avatar>
        <AvatarImage
          alt="User"
          src="https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=96&h=96&dpr=2&q=80"
        />
        <AvatarFallback>AV</AvatarFallback>
      </Avatar>
      <Avatar {...stylex.props(exampleStyles.example2)}>
        <AvatarImage
          alt="User"
          src="https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=144&h=144&dpr=2&q=80"
        />
        <AvatarFallback>AV</AvatarFallback>
      </Avatar>
      <Avatar {...stylex.props(exampleStyles.example3)}>
        <AvatarImage
          alt="User"
          src="https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=192&h=192&dpr=2&q=80"
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
    inlineSize: "calc(0.25rem * 12)",
    blockSize: "calc(0.25rem * 12)",
  },
  example3: {
    inlineSize: "calc(0.25rem * 16)",
    blockSize: "calc(0.25rem * 16)",
  },
})
