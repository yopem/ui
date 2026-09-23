import * as stylex from "@stylexjs/stylex"

import { Box } from "@/components/ui/box"
import { Button } from "@/components/ui/button"
export default function Example() {
  return (
    <Button variant="outline">
      <Box
        as="span"
        aria-hidden="true"
        {...stylex.props(exampleStyles.report1)}
      />
      Online
    </Button>
  )
}

const ping = stylex.keyframes({
  "75%, 100%": { opacity: 0, transform: "scale(2)" },
})

const exampleStyles = stylex.create({
  report1: {
    position: "relative",
    inlineSize: "calc(0.25rem * 2)",
    blockSize: "calc(0.25rem * 2)",
    borderRadius: "calc(infinity * 1px)",
    backgroundColor: "oklch(69.6% 0.17 162.48)",
    "::before": {
      content: '""',
      position: "absolute",
      inset: "0px",
      borderRadius: "calc(infinity * 1px)",
      backgroundColor: "oklch(76.5% 0.177 163.223)",
      animation: `${ping} 1s cubic-bezier(0, 0, 0.2, 1) infinite`,
      opacity: "75%",
    },
  },
})
