import { Avatar, AvatarFallback, AvatarImage } from "@yopem-ui/react"

const avatarComponent = {
  name: "Avatar",
  description:
    "A component for displaying user avatars with image and fallback support.",
  code: `
    <Avatar>
      <AvatarImage
        src="https://github.com/karyanayandi.png"
        alt="@karyanayandi"
      />
      <AvatarFallback>KY</AvatarFallback>
    </Avatar>
  `,
  preview: (
    <Avatar>
      <AvatarImage
        src="https://github.com/karyanayandi.png"
        alt="@karyanayandi"
      />
      <AvatarFallback>KY</AvatarFallback>
    </Avatar>
  ),
}

export default avatarComponent
