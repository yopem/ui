import * as stylex from "@stylexjs/stylex"
import { UserIcon } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/stylex/avatar"

export default function Particle() {
  return (
    <Avatar>
      <AvatarFallback>
        <UserIcon {...stylex.props(demoStyles.demo1)} />
      </AvatarFallback>
    </Avatar>
  )
}

const demoStyles = stylex.create({
  demo1: {
    inlineSize: "calc(0.25rem * 4)",
    blockSize: "calc(0.25rem * 4)",
  },
})
