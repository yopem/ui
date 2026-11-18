import { defineChartExampleTests } from "./chart-example-helpers"

defineChartExampleTests([
  {
    name: "Tooltip",
    variants: [
      "Default",
      "Line",
      "Dashed",
      "No indicator",
      "No label",
      "Custom label",
      "Custom formatter",
      "Icons",
      "Advanced",
      "Initial focus",
    ],
  },
])
