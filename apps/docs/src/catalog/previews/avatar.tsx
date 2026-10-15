import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@registry/components/ui/avatar"

export function Preview() {
  return (
    <Avatar>
      <AvatarImage
        alt="Nora Ellis"
        src="https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=128&h=128&dpr=2&q=80"
      />
      <AvatarFallback>NE</AvatarFallback>
    </Avatar>
  )
}
