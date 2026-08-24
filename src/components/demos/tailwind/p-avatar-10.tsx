import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/tailwind/avatar"
import { Badge } from "@/components/ui/tailwind/badge"

export default function Particle() {
  return (
    <div className="relative">
      <Avatar>
        <AvatarImage
          alt="User"
          src="https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=128&h=128&dpr=2&q=80"
        />
        <AvatarFallback>LT</AvatarFallback>
      </Avatar>
      <Badge
        className="outline-background absolute -end-1 -top-1 rounded-full outline-2 outline-solid"
        size="sm"
      >
        6
      </Badge>
    </div>
  )
}
