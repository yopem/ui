import * as stylex from "@stylexjs/stylex"

import { Switch } from "@/components/ui/stylex/switch"

export default function Particle() {
  return <Switch {...stylex.props(demoStyles.report1Manual)} />
}

const demoStyles = stylex.create({
  report1Manual: {
    "--thumb-size": {
      default: "1rem",
      "@media (min-width: 640px)": "0.75rem",
    },
  },
})
