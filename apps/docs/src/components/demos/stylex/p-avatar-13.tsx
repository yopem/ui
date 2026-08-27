import * as stylex from "@stylexjs/stylex"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/stylex/avatar"

export default function Particle() {
  return (
    <div {...stylex.props(demoStyles.report1)}>
      <Avatar {...stylex.props(demoStyles.report2, demoStyles.report2Manual)}>
        <AvatarImage
          alt="U1"
          src="https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=72&h=72&dpr=2&q=80"
        />
        <AvatarFallback>U1</AvatarFallback>
      </Avatar>
      <Avatar
        {...stylex.props(
          demoStyles.report3,
          demoStyles.report3Manual,
          demoStyles.overlap,
        )}
      >
        <AvatarImage
          alt="U2"
          src="https://images.unsplash.com/photo-1628157588553-5eeea00af15c?w=72&h=72&dpr=2&q=80"
        />
        <AvatarFallback>U2</AvatarFallback>
      </Avatar>
      <Avatar
        {...stylex.props(
          demoStyles.report4,
          demoStyles.report4Manual,
          demoStyles.overlap,
        )}
      >
        <AvatarImage
          alt="U3"
          src="https://images.unsplash.com/photo-1655874819398-c6dfbec68ac7?w=72&h=72&dpr=2&q=80"
        />
        <AvatarFallback>U3</AvatarFallback>
      </Avatar>
    </div>
  )
}

const demoStyles = stylex.create({
  report1: {
    display: "flex",
  },
  overlap: {
    marginInlineStart: "-0.375rem",
  },
  report2: {
    inlineSize: "calc(0.25rem * 6)",
    blockSize: "calc(0.25rem * 6)",
    boxShadow:
      "0 0 #0000, 0 0 #0000, 0 0 #0000,  0 0 0 calc(2px + 0px) currentcolor, 0 0 #0000",
  },
  report3: {
    inlineSize: "calc(0.25rem * 6)",
    blockSize: "calc(0.25rem * 6)",
    boxShadow:
      "0 0 #0000, 0 0 #0000, 0 0 #0000,  0 0 0 calc(2px + 0px) currentcolor, 0 0 #0000",
  },
  report4: {
    inlineSize: "calc(0.25rem * 6)",
    blockSize: "calc(0.25rem * 6)",
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
