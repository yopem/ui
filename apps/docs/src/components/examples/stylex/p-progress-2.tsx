import * as stylex from "@stylexjs/stylex"

import { Flex } from "@/components/ui/stylex/flex"
import {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
} from "@/components/ui/stylex/progress"
export default function Example() {
  return (
    <Progress value={60}>
      <Flex {...stylex.props(exampleStyles.example1)}>
        <ProgressLabel>Export data</ProgressLabel>
        <ProgressValue />
      </Flex>
      <ProgressTrack>
        <ProgressIndicator />
      </ProgressTrack>
    </Progress>
  )
}

const exampleStyles = stylex.create({
  example1: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "calc(0.25rem * 2)",
  },
})
