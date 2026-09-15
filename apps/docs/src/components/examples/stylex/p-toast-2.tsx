"use client"

import * as stylex from "@stylexjs/stylex"

import { Button } from "@/components/ui/stylex/button"
import { toastManager } from "@/components/ui/stylex/toast"

export default function Particle() {
  return (
    <div {...stylex.props(exampleStyles.example1)}>
      <Button
        onClick={() => {
          toastManager.add({
            description: "Your changes have been saved.",
            title: "Success!",
            type: "success",
          })
        }}
        variant="outline"
      >
        Success Toast
      </Button>
      <Button
        onClick={() => {
          toastManager.add({
            description: "There was a problem with your request.",
            title: "Uh oh! Something went wrong.",
            type: "error",
          })
        }}
        variant="outline"
      >
        Error Toast
      </Button>
      <Button
        onClick={() => {
          toastManager.add({
            description: "You can add components to your app using the cli.",
            title: "Heads up!",
            type: "info",
          })
        }}
        variant="outline"
      >
        Info Toast
      </Button>
      <Button
        onClick={() => {
          toastManager.add({
            description: "Your session is about to expire.",
            title: "Warning!",
            type: "warning",
          })
        }}
        variant="outline"
      >
        Warning Toast
      </Button>
    </div>
  )
}

const exampleStyles = stylex.create({
  example1: {
    display: "flex",
    flexWrap: "wrap",
    gap: "calc(0.25rem * 2)",
  },
})
