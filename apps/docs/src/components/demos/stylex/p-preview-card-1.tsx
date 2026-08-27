import * as stylex from "@stylexjs/stylex"
import { CornerUpLeftIcon, StarIcon } from "lucide-react"

import { Button } from "@/components/ui/stylex/button"
import {
  PreviewCard,
  PreviewCardPopup,
  PreviewCardTrigger,
} from "@/components/ui/stylex/preview-card"

export default function Particle() {
  return (
    <PreviewCard>
      <PreviewCardTrigger render={<Button variant="ghost" />}>
        coss.com/ui
      </PreviewCardTrigger>
      <PreviewCardPopup>
        <div {...stylex.props(demoStyles.demo1)}>
          <div {...stylex.props(demoStyles.demo2)}>
            <h4 {...stylex.props(demoStyles.demo3)}>coss.com/ui</h4>
            <p {...stylex.props(demoStyles.demo4)}>
              Beautifully designed components that you can copy and paste into
              your apps.
            </p>
          </div>
          <div {...stylex.props(demoStyles.demo5)}>
            <div {...stylex.props(demoStyles.demo6)}>
              <span aria-hidden="true" {...stylex.props(demoStyles.demo7)} />
              <span>TypeScript</span>
            </div>
            <div {...stylex.props(demoStyles.demo6)}>
              <StarIcon {...stylex.props(demoStyles.demo8)} />
              <span>58.2k</span>
            </div>
            <div {...stylex.props(demoStyles.demo6)}>
              <CornerUpLeftIcon {...stylex.props(demoStyles.demo8)} />
              <span>5.1k</span>
            </div>
          </div>
        </div>
      </PreviewCardPopup>
    </PreviewCard>
  )
}

const demoStyles = stylex.create({
  demo1: {
    display: "flex",
    flexDirection: "column",
    gap: "calc(0.25rem * 4)",
  },
  demo2: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  demo3: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: "500",
  },
  demo4: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    color: "var(--muted-foreground)",
  },
  demo5: {
    display: "flex",
    alignItems: "center",
    gap: "calc(0.25rem * 4)",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--muted-foreground)",
  },
  demo6: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
  },
  demo7: {
    inlineSize: "calc(0.25rem * 2)",
    blockSize: "calc(0.25rem * 2)",
    borderRadius: "calc(infinity * 1px)",
    backgroundColor: "oklch(62.3% 0.214 259.815)",
  },
  demo8: {
    inlineSize: "calc(0.25rem * 3)",
    blockSize: "calc(0.25rem * 3)",
  },
})
