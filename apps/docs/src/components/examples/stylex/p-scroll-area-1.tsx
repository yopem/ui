import * as stylex from "@stylexjs/stylex"

import { ScrollArea } from "@/components/ui/stylex/scroll-area"

const tags = Array.from({ length: 50 }, (_, i) => `v1.0.0-alpha.${i}`)

export default function Example() {
  return (
    <ScrollArea {...stylex.props(exampleStyles.example1)}>
      <div {...stylex.props(exampleStyles.example2)}>
        <h4 {...stylex.props(exampleStyles.example3)}>Tags</h4>
        <div {...stylex.props(exampleStyles.example4)}>
          {tags.map((tag) => (
            <div {...stylex.props(exampleStyles.example5)} key={tag}>
              {tag}
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  )
}

const exampleStyles = stylex.create({
  example1: {
    blockSize: "calc(0.25rem * 64)",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
  },
  example2: {
    paddingInline: "calc(0.25rem * 4)",
    paddingBlock: "calc(0.25rem * 2)",
  },
  example3: {
    marginBlockEnd: "calc(0.25rem * 2)",
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: "500",
  },
  example4: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  example5: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
  },
})
