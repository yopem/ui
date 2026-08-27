import * as stylex from "@stylexjs/stylex"

import {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
} from "@/components/ui/stylex/progress"

export default function Particle() {
  return (
    <Progress value={60}>
      <div {...stylex.props(demoStyles.demo1)}>
        <ProgressLabel>Export data</ProgressLabel>
        <ProgressValue />
      </div>
      <ProgressTrack>
        <ProgressIndicator />
      </ProgressTrack>
    </Progress>
  )
}

const demoStyles = stylex.create({
  demo1: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "calc(0.25rem * 2)",
  },
})
