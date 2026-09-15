import * as stylex from "@stylexjs/stylex"

import { ScrollArea } from "@/components/ui/stylex/scroll-area"

export default function Example() {
  return (
    <ScrollArea {...stylex.props(exampleStyles.example1)}>
      <p {...stylex.props(exampleStyles.example2)}>
        Just as suddenly as it had begun, the sensation stopped, leaving Alice
        feeling slightly disoriented. She looked around and realized that the
        room hadn't changed at all - it was she who had grown smaller, shrinking
        down to a fraction of her previous size. Alice felt herself growing
        larger and larger, filling up the entire room until she feared she might
        burst. The sensation was both thrilling and terrifying, as if she were
        expanding beyond the confines of her own body. She wondered if this was
        what it felt like to be a balloon, swelling with air until it could hold
        no more. Alice peered into the mirror, her reflection staring back at
        her with an air of mischief. She wondered what it would be like to step
        through the glass and into the world beyond, where everything seemed to
        be topsy-turvy and nothing was quite as it seemed. It's no use going
        back to yesterday, because I was a different person then, reflected
        Alice.
      </p>
    </ScrollArea>
  )
}

const exampleStyles = stylex.create({
  example1: {
    blockSize: "calc(0.25rem * 80)",
    maxInlineSize: "calc(0.25rem * 80)",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
  },
  example2: {
    minInlineSize: "calc(0.25rem * 100)",
    padding: "calc(0.25rem * 4)",
  },
})
