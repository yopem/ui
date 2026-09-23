import * as stylex from "@stylexjs/stylex"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Flex } from "@/components/ui/flex"
export default function Example() {
  return (
    <Flex {...stylex.props(exampleStyles.report1)}>
      <Avatar
        {...stylex.props(exampleStyles.report2, exampleStyles.report2Manual)}
      >
        <AvatarImage
          alt="U1"
          src="https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=144&h=144&dpr=2&q=80"
        />
        <AvatarFallback>U1</AvatarFallback>
      </Avatar>
      <Avatar
        {...stylex.props(
          exampleStyles.report3,
          exampleStyles.report3Manual,
          exampleStyles.overlap,
        )}
      >
        <AvatarImage
          alt="U2"
          src="https://images.unsplash.com/photo-1628157588553-5eeea00af15c?w=144&h=144&dpr=2&q=80"
        />
        <AvatarFallback>U2</AvatarFallback>
      </Avatar>
      <Avatar
        {...stylex.props(
          exampleStyles.report4,
          exampleStyles.report4Manual,
          exampleStyles.overlap,
        )}
      >
        <AvatarImage
          alt="U3"
          src="https://images.unsplash.com/photo-1655874819398-c6dfbec68ac7?w=144&h=144&dpr=2&q=80"
        />
        <AvatarFallback>U3</AvatarFallback>
      </Avatar>
    </Flex>
  )
}

const exampleStyles = stylex.create({
  report1: {
    display: "flex",
  },
  overlap: {
    marginInlineStart: "-0.75rem",
  },
  report2: {
    inlineSize: "calc(0.25rem * 12)",
    blockSize: "calc(0.25rem * 12)",
    boxShadow:
      "0 0 #0000, 0 0 #0000, 0 0 #0000,  0 0 0 calc(2px + 0px) currentcolor, 0 0 #0000",
  },
  report3: {
    inlineSize: "calc(0.25rem * 12)",
    blockSize: "calc(0.25rem * 12)",
    boxShadow:
      "0 0 #0000, 0 0 #0000, 0 0 #0000,  0 0 0 calc(2px + 0px) currentcolor, 0 0 #0000",
  },
  report4: {
    inlineSize: "calc(0.25rem * 12)",
    blockSize: "calc(0.25rem * 12)",
    boxShadow:
      "0 0 #0000, 0 0 #0000, 0 0 #0000,  0 0 0 calc(2px + 0px) currentcolor, 0 0 #0000",
  },
  report2Manual: {
    boxShadow: "0 0 0 2px var(--background)",
  },
  report3Manual: {
    boxShadow: "0 0 0 2px var(--background)",
  },
  report4Manual: {
    boxShadow: "0 0 0 2px var(--background)",
  },
})
