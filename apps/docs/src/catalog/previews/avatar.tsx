import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@registry/components/ui/avatar"

export function Preview() {
  return (
    <Avatar>
      <AvatarImage
        alt="Casey Blake"
        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&auto=format&fit=crop"
      />
      <AvatarFallback>CB</AvatarFallback>
    </Avatar>
  )
}
