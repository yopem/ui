import * as stylex from "@stylexjs/stylex"

import { Skeleton } from "@/components/ui/stylex/skeleton"

export default function Particle() {
  return (
    <div {...stylex.props(exampleStyles.example1)}>
      <Skeleton {...stylex.props(exampleStyles.example2)} />
      <div {...stylex.props(exampleStyles.example3)}>
        <Skeleton {...stylex.props(exampleStyles.example4)} />
        <div {...stylex.props(exampleStyles.example5)}>
          <Skeleton {...stylex.props(exampleStyles.example6)} />
          <Skeleton {...stylex.props(exampleStyles.example6)} />
        </div>
      </div>
      <Skeleton {...stylex.props(exampleStyles.example7)} />
    </div>
  )
}

const exampleStyles = stylex.create({
  example1: {
    display: "flex",
    inlineSize: "100%",
    maxInlineSize: "calc(0.25rem * 92)",
    alignItems: "center",
    gap: "calc(0.25rem * 4)",
  },
  example2: {
    inlineSize: "calc(0.25rem * 10)",
    blockSize: "calc(0.25rem * 10)",
    borderRadius: "calc(infinity * 1px)",
  },
  example3: {
    display: "flex",
    flex: "1",
    flexDirection: "column",
  },
  example4: {
    marginBlock: "calc(0.25rem * 0.5)",
    blockSize: "calc(0.25rem * 4)",
    maxInlineSize: "calc(0.25rem * 54)",
  },
  example5: {
    display: "flex",
    maxInlineSize: "calc(0.25rem * 54)",
    alignItems: "center",
    gap: "0.25rem",
  },
  example6: {
    marginBlock: "calc(0.25rem * 0.5)",
    blockSize: "calc(0.25rem * 4)",
    inlineSize: "calc(1 / 2 * 100%)",
  },
  example7: {
    blockSize: "calc(0.25rem * 6)",
    inlineSize: "calc(0.25rem * 17)",
  },
})
