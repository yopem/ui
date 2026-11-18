import { Chart, ChartContainer } from "@registry/components/ui/chart"
import { tokens } from "@registry/styles/tokens.stylex"
import { defineChart, lineY } from "@tanstack/charts"
import { scaleLinear } from "@tanstack/charts/scales/linear"
import { scalePoint } from "@tanstack/charts/scales/point"

const rows = [
  { month: "Jan", desktop: 186, mobile: 80 },
  { month: "Feb", desktop: 205, mobile: 120 },
  { month: "Mar", desktop: 165, mobile: 130 },
  { month: "Apr", desktop: 230, mobile: 160 },
  { month: "May", desktop: 240, mobile: 180 },
  { month: "Jun", desktop: 280, mobile: 210 },
]

const config = {
  Desktop: { label: "Desktop", color: tokens["--chart-1"] },
  Mobile: { label: "Mobile", color: tokens["--chart-2"] },
}

const definition = defineChart({
  marks: [
    lineY(rows, {
      x: "month",
      y: "desktop",
      stroke: tokens["--chart-1"],
      strokeWidth: 2,
    }),
    lineY(rows, {
      x: "month",
      y: "mobile",
      stroke: tokens["--chart-2"],
      strokeWidth: 2,
    }),
  ],
  scales: {
    x: { scale: () => scalePoint<string>().padding(0.1), axis: false },
    y: { scale: scaleLinear, axis: false },
  },
  focus: false,
  tooltip: false,
})

export function ChartThumbnail() {
  return (
    <ChartContainer config={config}>
      <Chart
        ariaLabel="Monthly visits by device"
        definition={definition}
        height={200}
      />
    </ChartContainer>
  )
}
