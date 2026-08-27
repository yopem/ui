import * as stylex from "@stylexjs/stylex"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/stylex/avatar"

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
      <span aria-hidden="true" {...stylex.props(demoStyles.demo2)} />
    </div>
  )
}

const demoStyles = stylex.create({
  demo1: {
    position: "relative",
  },
  demo2: {
    position: "absolute",
    insetInlineEnd: "calc(0.25rem * 0)",
    insetBlockEnd: "0px",
    inlineSize: "calc(0.25rem * 2)",
    blockSize: "calc(0.25rem * 2)",
    borderRadius: "calc(infinity * 1px)",
    backgroundColor: "var(--muted-foreground)",
    outlineStyle: "solid",
    outlineWidth: "2px",
    outlineColor: "var(--background)",
  },
})
