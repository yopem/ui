import { Box } from "@registry/components/ui/box"
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@registry/components/ui/collapsible"
import * as stylex from "@stylexjs/stylex"
import { ChevronDownIcon } from "lucide-react"

const styles = stylex.create({
  collapsibleTrigger: {
    display: "inline-flex",
    alignItems: "center",
    gap: "calc(0.25rem * 2)",
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: 500,
  },
  ul: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    paddingBlock: "calc(0.25rem * 2)",
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    color: "var(--muted-foreground)",
  },
  li: {
    borderRadius: "calc(var(--radius) - 4px)",
    backgroundColor: "var(--muted)",
    paddingInline: "calc(0.25rem * 2)",
    paddingBlock: "0.25rem",
    fontFamily: '"Geist Mono", ui-monospace, monospace',
  },
  li2: {
    borderRadius: "calc(var(--radius) - 4px)",
    backgroundColor: "var(--muted)",
    paddingInline: "calc(0.25rem * 2)",
    paddingBlock: "0.25rem",
    fontFamily: '"Geist Mono", ui-monospace, monospace',
  },
  li3: {
    borderRadius: "calc(var(--radius) - 4px)",
    backgroundColor: "var(--muted)",
    paddingInline: "calc(0.25rem * 2)",
    paddingBlock: "0.25rem",
    fontFamily: '"Geist Mono", ui-monospace, monospace',
  },
})
export function Preview() {
  return (
    <Collapsible>
      <CollapsibleTrigger xstyle={styles.collapsibleTrigger}>
        Show recovery keys
        <ChevronDownIcon
          {...stylex.props(previewStyles.preview1, previewStyles.chevron)}
        />
      </CollapsibleTrigger>
      <CollapsiblePanel>
        <Box as="ul" xstyle={styles.ul}>
          <Box as="li" xstyle={styles.li}>
            4829-1735-6621
          </Box>
          <Box as="li" xstyle={styles.li2}>
            9182-6407-5532
          </Box>
          <Box as="li" xstyle={styles.li3}>
            3051-7924-9018
          </Box>
        </Box>
      </CollapsiblePanel>
    </Collapsible>
  )
}

const previewStyles = stylex.create({
  preview1: {
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
})
