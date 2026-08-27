import * as stylex from "@stylexjs/stylex"

import { ScrollArea } from "@/components/ui/stylex/scroll-area"

const tags = Array.from({ length: 50 }, (_, i) => `v1.0.0-alpha.${i}`)

export default function Particle() {
  return (
    <ScrollArea {...stylex.props(demoStyles.demo1)} scrollFade>
      <div {...stylex.props(demoStyles.demo2)}>
        <h4 {...stylex.props(demoStyles.demo3)}>Tags</h4>
        <div {...stylex.props(demoStyles.demo4)}>
          {tags.map((tag) => (
            <div {...stylex.props(demoStyles.demo5)} key={tag}>
              {tag}
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  )
}

const demoStyles = stylex.create({
  demo1: {
    blockSize: "calc(0.25rem * 64)",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
  },
  demo2: {
    paddingInline: "calc(0.25rem * 4)",
    paddingBlock: "calc(0.25rem * 2)",
  },
  demo3: {
    marginBlockEnd: "calc(0.25rem * 2)",
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: "500",
  },
  demo4: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  demo5: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
  },
})
