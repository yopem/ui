import * as stylex from "@stylexjs/stylex"

import { Skeleton } from "@/components/ui/stylex/skeleton"

export default function Particle() {
  return (
    <div {...stylex.props(demoStyles.demo1)}>
      <Skeleton {...stylex.props(demoStyles.demo2)} />
      <div {...stylex.props(demoStyles.demo3)}>
        <Skeleton {...stylex.props(demoStyles.demo4)} />
        <div {...stylex.props(demoStyles.demo5)}>
          <Skeleton {...stylex.props(demoStyles.demo6)} />
          <Skeleton {...stylex.props(demoStyles.demo6)} />
        </div>
      </div>
      <Skeleton {...stylex.props(demoStyles.demo7)} />
    </div>
  )
}

const demoStyles = stylex.create({
  demo1: {
    display: "flex",
    inlineSize: "100%",
    maxInlineSize: "calc(0.25rem * 92)",
    alignItems: "center",
    gap: "calc(0.25rem * 4)",
  },
  demo2: {
    inlineSize: "calc(0.25rem * 10)",
    blockSize: "calc(0.25rem * 10)",
    borderRadius: "calc(infinity * 1px)",
  },
  demo3: {
    display: "flex",
    flex: "1",
    flexDirection: "column",
  },
  demo4: {
    marginBlock: "calc(0.25rem * 0.5)",
    blockSize: "calc(0.25rem * 4)",
    maxInlineSize: "calc(0.25rem * 54)",
  },
  demo5: {
    display: "flex",
    maxInlineSize: "calc(0.25rem * 54)",
    alignItems: "center",
    gap: "0.25rem",
  },
  demo6: {
    marginBlock: "calc(0.25rem * 0.5)",
    blockSize: "calc(0.25rem * 4)",
    inlineSize: "calc(1 / 2 * 100%)",
  },
  demo7: {
    blockSize: "calc(0.25rem * 6)",
    inlineSize: "calc(0.25rem * 17)",
  },
})
