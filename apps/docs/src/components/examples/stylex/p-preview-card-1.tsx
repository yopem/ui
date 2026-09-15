import * as stylex from "@stylexjs/stylex"
import { CornerUpLeftIcon, StarIcon } from "lucide-react"

import { Button } from "@/components/ui/stylex/button"
import {
  PreviewCard,
  PreviewCardPopup,
  PreviewCardTrigger,
} from "@/components/ui/stylex/preview-card"

export default function Example() {
  return (
    <PreviewCard>
      <PreviewCardTrigger render={<Button variant="ghost" />}>
        coss.com/ui
      </PreviewCardTrigger>
      <PreviewCardPopup>
        <div {...stylex.props(exampleStyles.example1)}>
          <div {...stylex.props(exampleStyles.example2)}>
            <h4 {...stylex.props(exampleStyles.example3)}>coss.com/ui</h4>
            <p {...stylex.props(exampleStyles.example4)}>
              Beautifully designed components that you can copy and paste into
              your apps.
            </p>
          </div>
          <div {...stylex.props(exampleStyles.example5)}>
            <div {...stylex.props(exampleStyles.example6)}>
              <span
                aria-hidden="true"
                {...stylex.props(exampleStyles.example7)}
              />
              <span>TypeScript</span>
            </div>
            <div {...stylex.props(exampleStyles.example6)}>
              <StarIcon {...stylex.props(exampleStyles.example8)} />
              <span>58.2k</span>
            </div>
            <div {...stylex.props(exampleStyles.example6)}>
              <CornerUpLeftIcon {...stylex.props(exampleStyles.example8)} />
              <span>5.1k</span>
            </div>
          </div>
        </div>
      </PreviewCardPopup>
    </PreviewCard>
  )
}

const exampleStyles = stylex.create({
  example1: {
    display: "flex",
    flexDirection: "column",
    gap: "calc(0.25rem * 4)",
  },
  example2: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  example3: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: "500",
  },
  example4: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    color: "var(--muted-foreground)",
  },
  example5: {
    display: "flex",
    alignItems: "center",
    gap: "calc(0.25rem * 4)",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--muted-foreground)",
  },
  example6: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
  },
  example7: {
    inlineSize: "calc(0.25rem * 2)",
    blockSize: "calc(0.25rem * 2)",
    borderRadius: "calc(infinity * 1px)",
    backgroundColor: "oklch(62.3% 0.214 259.815)",
  },
  example8: {
    inlineSize: "calc(0.25rem * 3)",
    blockSize: "calc(0.25rem * 3)",
  },
})
