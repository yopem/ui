import * as stylex from "@stylexjs/stylex"
import { ChevronDownIcon } from "lucide-react"

import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/components/ui/stylex/collapsible"

export default function Particle() {
  return (
    <Collapsible>
      <CollapsibleTrigger
        {...stylex.props(demoStyles.report1, stylex.defaultMarker())}
      >
        Show recovery keys
        <ChevronDownIcon
          {...stylex.props(demoStyles.demo1, demoStyles.chevron)}
        />
      </CollapsibleTrigger>
      <CollapsiblePanel>
        <ul {...stylex.props(demoStyles.demo2)}>
          <li {...stylex.props(demoStyles.demo3)}>4829-1735-6621</li>
          <li {...stylex.props(demoStyles.demo3)}>9182-6407-5532</li>
          <li {...stylex.props(demoStyles.demo3)}>3051-7924-9018</li>
        </ul>
      </CollapsiblePanel>
    </Collapsible>
  )
}

const demoStyles = stylex.create({
  demo1: {
    inlineSize: "calc(0.25rem * 4)",
    blockSize: "calc(0.25rem * 4)",
  },
  chevron: {
    transform: {
      default: "rotate(0deg)",
      [stylex.when.ancestor("[data-panel-open]")]: "rotate(180deg)",
    },
    transition: "transform 150ms",
  },
  demo2: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    paddingBlock: "calc(0.25rem * 2)",
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    color: "var(--muted-foreground)",
  },
  demo3: {
    borderRadius: "calc(var(--radius) - 4px)",
    backgroundColor: "var(--muted)",
    paddingInline: "calc(0.25rem * 2)",
    paddingBlock: "0.25rem",
    fontFamily: '"Geist Mono", ui-monospace, monospace',
  },
  report1: {
    display: "inline-flex",
    alignItems: "center",
    gap: "calc(0.25rem * 2)",
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: "500",
  },
})
