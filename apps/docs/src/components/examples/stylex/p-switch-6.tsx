import * as stylex from "@stylexjs/stylex"

import { Switch } from "@/components/ui/stylex/switch"

export default function Example() {
  return (
    <Switch
      aria-label="Notifications"
      {...stylex.props(exampleStyles.report1Manual)}
    />
  )
}

const exampleStyles = stylex.create({
  report1Manual: {
    "--thumb-size": {
      default: "1rem",
      "@media (min-width: 640px)": "0.75rem",
    },
  },
})
