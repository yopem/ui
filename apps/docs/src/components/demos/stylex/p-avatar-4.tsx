import * as stylex from "@stylexjs/stylex"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/stylex/avatar"

export default function Particle() {
  return (
    <div {...stylex.props(demoStyles.demo1)}>
      <Avatar {...stylex.props(demoStyles.demo2)}>
        <AvatarImage
          alt="User"
          src="https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=128&h=128&dpr=2&q=80"
        />
        <AvatarFallback>AV</AvatarFallback>
      </Avatar>
      <Avatar {...stylex.props(demoStyles.demo3)}>
        <AvatarImage
          alt="User"
          src="https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=128&h=128&dpr=2&q=80"
        />
        <AvatarFallback>AV</AvatarFallback>
      </Avatar>
      <Avatar {...stylex.props(demoStyles.demo4)}>
        <AvatarImage
          alt="User"
          src="https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=128&h=128&dpr=2&q=80"
        />
        <AvatarFallback>AV</AvatarFallback>
      </Avatar>
    </div>
  )
}

const demoStyles = stylex.create({
  demo1: {
    display: "flex",
    alignItems: "center",
    gap: "calc(0.25rem * 4)",
  },
  demo2: {
    borderRadius: "calc(var(--radius) - 2px)",
  },
  demo3: {
    borderRadius: "calc(var(--radius) + 4px)",
  },
  demo4: {
    borderRadius: "calc(infinity * 1px)",
  },
})
