"use client"

import * as stylex from "@stylexjs/stylex"

import {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
} from "@/components/ui/stylex/progress"

export default function Example() {
  return (
    <Progress max={512} value={502}>
      <div {...stylex.props(exampleStyles.example1)}>
        <ProgressLabel>Upload</ProgressLabel>
        <ProgressValue>{(_formatted, value) => `${value} / 512`}</ProgressValue>
      </div>
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
