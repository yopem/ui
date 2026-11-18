import { Box } from "@registry/components/ui/box"
import { Heading } from "@registry/components/ui/heading"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"

import { CopyableCode } from "@/catalog/code-block"

export const chartUsageSources = {
  area: `"use client"

import { Chart, ChartContainer, ChartLegendContent, ChartTooltipContent } from "@/components/ui/chart"
import { tokens } from "@/styles/tokens.stylex"
import { areaY, defineChart, stack } from "@tanstack/charts"
import { scaleLinear } from "@tanstack/charts/scales/linear"
import { scalePoint } from "@tanstack/charts/scales/point"
import { tooltip } from "@tanstack/charts/tooltip"

const data = [
  { month: "Jan", series: "Desktop", visits: 186 },
  { month: "Jan", series: "Mobile", visits: 80 },
  { month: "Feb", series: "Desktop", visits: 205 },
  { month: "Feb", series: "Mobile", visits: 120 },
  { month: "Mar", series: "Desktop", visits: 165 },
  { month: "Mar", series: "Mobile", visits: 130 },
]
const config = {
  Desktop: { label: "Desktop", color: tokens["--chart-1"] },
  Mobile: { label: "Mobile", color: tokens["--chart-2"] },
}
const definition = defineChart({
  marks: [areaY(data, {
    x: "month", y: "visits", color: "series",
    layout: stack({ order: ["Desktop", "Mobile"] }), fillOpacity: 0.5,
  })],
  scales: {
    x: { scale: () => scalePoint<string>().padding(0.15) },
    y: { scale: scaleLinear, grid: true },
  },
  color: { domain: ["Desktop", "Mobile"], range: [tokens["--chart-1"], tokens["--chart-2"]] },
  focus: "group-x",
  tooltip: { use: tooltip, items: [{ field: "visits", label: "visits" }] },
})

export function AreaChartExample() {
  return (
    <ChartContainer config={config}>
      <Chart ariaLabel="Monthly visits by device" definition={definition} height={280}
        renderTooltipBody={(context) => <ChartTooltipContent context={context} nameKey="series" labelKey="month" />} />
      <ChartLegendContent items={[{ name: "Desktop" }, { name: "Mobile" }]} />
    </ChartContainer>
  )
}
`,
  bar: `"use client"

import { Chart, ChartContainer, ChartLegendContent, ChartTooltipContent } from "@/components/ui/chart"
import { tokens } from "@/styles/tokens.stylex"
import { barY, defineChart, group } from "@tanstack/charts"
import { scaleBand } from "@tanstack/charts/scales/band"
import { scaleLinear } from "@tanstack/charts/scales/linear"
import { tooltip } from "@tanstack/charts/tooltip"

const data = [
  { month: "Jan", series: "Desktop", visits: 186 },
  { month: "Jan", series: "Mobile", visits: 80 },
  { month: "Feb", series: "Desktop", visits: 205 },
  { month: "Feb", series: "Mobile", visits: 120 },
]
const config = {
  Desktop: { label: "Desktop", color: tokens["--chart-1"] },
  Mobile: { label: "Mobile", color: tokens["--chart-2"] },
}
const definition = defineChart({
  marks: [barY(data, { x: "month", y: "visits", color: "series", layout: group(), inset: 2 })],
  scales: {
    x: { scale: () => scaleBand<string>().padding(0.2) },
    y: { scale: scaleLinear, grid: true },
  },
  color: { domain: ["Desktop", "Mobile"], range: [tokens["--chart-1"], tokens["--chart-2"]] },
  focus: "group-x",
  tooltip: { use: tooltip, items: [{ field: "visits", label: "visits" }] },
})

export function BarChartExample() {
  return (
    <ChartContainer config={config}>
      <Chart ariaLabel="Monthly visits by device" definition={definition} height={280}
        renderTooltipBody={(context) => <ChartTooltipContent context={context} nameKey="series" labelKey="month" />} />
      <ChartLegendContent items={[{ name: "Desktop" }, { name: "Mobile" }]} />
    </ChartContainer>
  )
}
`,
  line: `"use client"

import { Chart, ChartContainer, ChartLegendContent, ChartTooltipContent } from "@/components/ui/chart"
import { tokens } from "@/styles/tokens.stylex"
import { defineChart, lineY } from "@tanstack/charts"
import { scaleLinear } from "@tanstack/charts/scales/linear"
import { scalePoint } from "@tanstack/charts/scales/point"
import { tooltip } from "@tanstack/charts/tooltip"

const data = [
  { month: "Jan", series: "Desktop", visits: 186 },
  { month: "Jan", series: "Mobile", visits: 80 },
  { month: "Feb", series: "Desktop", visits: 205 },
  { month: "Feb", series: "Mobile", visits: 120 },
  { month: "Mar", series: "Desktop", visits: 165 },
  { month: "Mar", series: "Mobile", visits: 130 },
]
const config = {
  Desktop: { label: "Desktop", color: tokens["--chart-1"] },
  Mobile: { label: "Mobile", color: tokens["--chart-2"] },
}
const definition = defineChart({
  marks: [lineY(data, { x: "month", y: "visits", z: "series", color: "series", strokeWidth: 2, points: true })],
  scales: {
    x: { scale: () => scalePoint<string>().padding(0.15) },
    y: { scale: scaleLinear, grid: true },
  },
  color: { domain: ["Desktop", "Mobile"], range: [tokens["--chart-1"], tokens["--chart-2"]] },
  focus: "group-x",
  tooltip: { use: tooltip, items: [{ field: "visits", label: "visits" }] },
})

export function LineChartExample() {
  return (
    <ChartContainer config={config}>
      <Chart ariaLabel="Monthly visits by device" definition={definition} height={280}
        renderTooltipBody={(context) => <ChartTooltipContent context={context} nameKey="series" labelKey="month" />} />
      <ChartLegendContent items={[{ name: "Desktop" }, { name: "Mobile" }]} />
    </ChartContainer>
  )
}
`,
  pie: `"use client"

import type { ChartValue, SceneNode } from "@tanstack/charts"
import type { PolarMark } from "@tanstack/charts/polar"

import { Chart, ChartContainer, ChartLegendContent, ChartTooltipContent } from "@/components/ui/chart"
import { tokens } from "@/styles/tokens.stylex"
import { defineChart } from "@tanstack/charts"
import { pie, polar, radialArc, radialText } from "@tanstack/charts/polar"
import { scaleLinear } from "@tanstack/charts/scales/linear"
import { tooltip } from "@tanstack/charts/tooltip"

const data = [
  { name: "Search", value: 60 },
  { name: "Direct", value: 25 },
  { name: "Referral", value: 15 },
]
const config = {
  Search: { label: "Search", color: tokens["--chart-1"] },
  Direct: { label: "Direct", color: tokens["--chart-2"] },
  Referral: { label: "Referral", color: tokens["--chart-3"] },
}
function withoutInteraction(node: SceneNode): SceneNode {
  if (node.kind === "group") {
    return { ...node, children: node.children.map(withoutInteraction) }
  }
  if (node.kind === "label") return node
  const decorative = { ...node }
  delete decorative.interaction
  return decorative
}

function decorativeMark<Datum, Angle extends ChartValue, Radius extends ChartValue, AngleScale extends string, RadiusScale extends string>(
  mark: PolarMark<Datum, Angle, Radius, AngleScale, RadiusScale>,
): PolarMark<never, Angle, Radius, AngleScale, RadiusScale> {
  return {
    ...mark,
    __datum: undefined,
    initialize(context) {
      const initialized = mark.initialize(context)
      return {
        ...initialized,
        render(renderContext) {
          const rendered = initialized.render(renderContext)
          return { ...rendered, nodes: rendered.nodes.map(withoutInteraction), points: [] }
        },
      }
    },
  }
}

const definition = defineChart({
  marks: [polar({
    radiusRatio: 0.75,
    scales: {
      angle: { scale: scaleLinear().domain([0, Math.PI * 2]) },
      radius: { scale: scaleLinear().domain([0, 1]) },
    },
    marks: [
      radialArc(pie(data, { value: "value", gapAngle: 0.025 }), {
        innerRadius: ({ radius }) => radius * 0.55, color: "name", key: "name",
      }),
      decorativeMark(radialText(data.slice(0, 1), { angle: 0, radius: 0, text: () => "Visits", fill: tokens["--foreground"], anchor: "middle", baseline: "middle" })),
    ],
  })],
  scales: { x: null, y: null },
  color: { domain: ["Search", "Direct", "Referral"], range: [tokens["--chart-1"], tokens["--chart-2"], tokens["--chart-3"]] },
  tooltip: { use: tooltip, items: [{ field: "value", label: "name" }] },
})

export function PieChartExample() {
  return (
    <ChartContainer config={config}>
      <Chart ariaLabel="Visits by source" definition={definition} height={280}
        renderTooltipBody={(context) => <ChartTooltipContent context={context} nameKey="name" />} />
      <ChartLegendContent items={[{ name: "Search" }, { name: "Direct" }, { name: "Referral" }]} />
    </ChartContainer>
  )
}
`,
  radar: `"use client"

import type { ChartValue, SceneNode } from "@tanstack/charts"
import type { PolarMark } from "@tanstack/charts/polar"

import { Chart, ChartContainer, ChartLegendContent, ChartTooltipContent } from "@/components/ui/chart"
import { tokens } from "@/styles/tokens.stylex"
import { defineChart } from "@tanstack/charts"
import { angleGrid, polar, radialArea, radialDot, radialGrid } from "@tanstack/charts/polar"
import { scaleLinear } from "@tanstack/charts/scales/linear"
import { scalePoint } from "@tanstack/charts/scales/point"
import { tooltip } from "@tanstack/charts/tooltip"

const data = [
  { category: "Speed", score: 80 },
  { category: "Quality", score: 65 },
  { category: "Reach", score: 90 },
  { category: "Support", score: 75 },
]
const first = data[0]
const closedProfile = first ? [...data, first] : data

function withoutInteraction(node: SceneNode): SceneNode {
  if (node.kind === "group") {
    return { ...node, children: node.children.map(withoutInteraction) }
  }
  if (node.kind === "label") return node
  const decorative = { ...node }
  delete decorative.interaction
  return decorative
}

function decorativeMark<Datum, Angle extends ChartValue, Radius extends ChartValue, AngleScale extends string, RadiusScale extends string>(
  mark: PolarMark<Datum, Angle, Radius, AngleScale, RadiusScale>,
): PolarMark<never, Angle, Radius, AngleScale, RadiusScale> {
  return {
    ...mark,
    __datum: undefined,
    initialize(context) {
      const initialized = mark.initialize(context)
      return {
        ...initialized,
        render(renderContext) {
          const rendered = initialized.render(renderContext)
          return { ...rendered, nodes: rendered.nodes.map(withoutInteraction), points: [] }
        },
      }
    },
  }
}

const config = { Score: { label: "Score", color: tokens["--chart-1"] } }
const definition = defineChart({
  marks: [polar({
    radiusRatio: 0.62,
    scales: {
      angle: { scale: scalePoint<string>().domain(data.map((row) => row.category)), wrap: true },
      radius: { scale: scaleLinear().domain([0, 100]) },
    },
    guides: [radialGrid({ values: [25, 50, 75, 100] }), angleGrid({ labels: true })],
    marks: [
      decorativeMark(radialArea(closedProfile, { angle: "category", radius: "score", fill: tokens["--chart-1"], fillOpacity: 0.25 })),
      radialDot(data, { angle: "category", radius: "score", key: "category", r: 4, fill: tokens["--chart-1"] }),
    ],
  })],
  scales: { x: null, y: null },
  tooltip: { use: tooltip, items: [{ field: "score", label: "Score" }] },
})

export function RadarChartExample() {
  return (
    <ChartContainer config={config}>
      <Chart ariaLabel="Scores by category" definition={definition} height={280}
        renderTooltipBody={(context) => <ChartTooltipContent context={context} labelKey="category" />} />
      <ChartLegendContent items={[{ name: "Score" }]} />
    </ChartContainer>
  )
}
`,
  radial: `"use client"

import type { ChartValue, SceneNode } from "@tanstack/charts"
import type { PolarMark } from "@tanstack/charts/polar"

import { Chart, ChartContainer, ChartLegendContent, ChartTooltipContent } from "@/components/ui/chart"
import { tokens } from "@/styles/tokens.stylex"
import { defineChart } from "@tanstack/charts"
import { polar, radialArc, radialText } from "@tanstack/charts/polar"
import { scaleLinear } from "@tanstack/charts/scales/linear"
import { tooltip } from "@tanstack/charts/tooltip"

const progress = [{ name: "Complete", value: 72, startAngle: 0, endAngle: Math.PI * 2 * 0.72 }]
const track = [{ name: "Track", startAngle: 0, endAngle: Math.PI * 2 }]
const config = { Complete: { label: "Complete", color: tokens["--chart-1"] } }
function withoutInteraction(node: SceneNode): SceneNode {
  if (node.kind === "group") {
    return { ...node, children: node.children.map(withoutInteraction) }
  }
  if (node.kind === "label") return node
  const decorative = { ...node }
  delete decorative.interaction
  return decorative
}

function decorativeMark<Datum, Angle extends ChartValue, Radius extends ChartValue, AngleScale extends string, RadiusScale extends string>(
  mark: PolarMark<Datum, Angle, Radius, AngleScale, RadiusScale>,
): PolarMark<never, Angle, Radius, AngleScale, RadiusScale> {
  return {
    ...mark,
    __datum: undefined,
    initialize(context) {
      const initialized = mark.initialize(context)
      return {
        ...initialized,
        render(renderContext) {
          const rendered = initialized.render(renderContext)
          return { ...rendered, nodes: rendered.nodes.map(withoutInteraction), points: [] }
        },
      }
    },
  }
}

const definition = defineChart({
  marks: [polar({
    radiusRatio: 0.78,
    scales: {
      angle: { scale: scaleLinear().domain([0, Math.PI * 2]) },
      radius: { scale: scaleLinear().domain([0, 1]) },
    },
    marks: [
      decorativeMark(radialArc(track, { innerRadius: ({ radius }) => radius * 0.65, fill: tokens["--muted"], key: "name" })),
      radialArc(progress, { innerRadius: ({ radius }) => radius * 0.65, fill: tokens["--chart-1"], key: "name", cornerRadius: 8 }),
      decorativeMark(radialText([{ label: "72%" }], { angle: 0, radius: 0, text: "label", fill: tokens["--foreground"], fontSize: 20, anchor: "middle", baseline: "middle" })),
    ],
  })],
  scales: { x: null, y: null },
  tooltip: { use: tooltip, items: [{ field: "value", label: "name" }] },
})

export function RadialChartExample() {
  return (
    <ChartContainer config={config}>
      <Chart ariaLabel="Completion: 72 percent" definition={definition} height={280}
        renderTooltipBody={(context) => <ChartTooltipContent context={context} nameKey="name" />} />
      <ChartLegendContent items={[{ name: "Complete" }]} />
    </ChartContainer>
  )
}
`,
  tooltip: `"use client"

import { Chart, ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { tokens } from "@/styles/tokens.stylex"
import { barY, defineChart, group } from "@tanstack/charts"
import { scaleBand } from "@tanstack/charts/scales/band"
import { scaleLinear } from "@tanstack/charts/scales/linear"
import { tooltip } from "@tanstack/charts/tooltip"

const data = [
  { month: "Jan", series: "Desktop", visits: 186 },
  { month: "Jan", series: "Mobile", visits: 80 },
  { month: "Feb", series: "Desktop", visits: 205 },
  { month: "Feb", series: "Mobile", visits: 120 },
]
const config = {
  Desktop: { label: "Desktop", color: tokens["--chart-1"] },
  Mobile: { label: "Mobile", color: tokens["--chart-2"] },
}
const definition = defineChart({
  marks: [barY(data, { x: "month", y: "visits", color: "series", layout: group(), inset: 2 })],
  scales: {
    x: { scale: () => scaleBand<string>().padding(0.2) },
    y: { scale: scaleLinear, grid: true },
  },
  color: { domain: ["Desktop", "Mobile"], range: [tokens["--chart-1"], tokens["--chart-2"]] },
  focus: "group-x",
  tooltip: { use: tooltip, items: [{ field: "visits", label: "visits" }] },
})

export function TooltipChartExample() {
  return (
    <ChartContainer config={config}>
      <Chart ariaLabel="Monthly visits by device" definition={definition} height={280}
        renderTooltipBody={(context) => (
          <ChartTooltipContent context={context} labelKey="month" nameKey="series"
            formatter={(value, name, index, raw) => (
              name + ": " + value + " visits (" + raw.points.length + " points, row " + (index + 1) + ")"
            )} />
        )} />
    </ChartContainer>
  )
}
`,
} as const

const descriptions = {
  area: "Use one row for each month and series. Stack the series to show their combined total. Group focus shows all values for the same month.",
  bar: "Use one row for each category and series. A band scale places categories on the horizontal axis. Group bars to compare series side by side.",
  line: "Use one row for each month and series. The z channel keeps each series in its own line. Keep rows in chronological order.",
  pie: "Use one nonnegative value for each part of the whole. Pie computes slice angles; radialArc draws a donut. The legend names each source without relying on color.",
  radar:
    "Use one row for each category and a numeric score on a common scale. A wrapped point scale sets the angles; a linear radius scale sets the values.",
  radial:
    "Convert a bounded fraction to an end angle in radians. Draw the progress arc over a full track, and show the value as text. This is angle-based progress, not a radial-radius bar.",
  tooltip:
    "Group focus shows the values at one category. The formatter receives the native context as its fourth argument. Use pointer movement or arrow keys to inspect the values.",
} as const

export function ChartUsage({ type }: { type: keyof typeof chartUsageSources }) {
  const label = type[0].toUpperCase() + type.slice(1)

  return (
    <Box render={<section />} aria-label={`${label} usage`}>
      <Stack>
        <Heading render={<h3>{label} usage</h3>} />
        <Text>{descriptions[type]}</Text>
        <Text>
          The chart tokens keep the same series colors in light and dark themes.
          Surfaces, labels, and grid lines follow the theme. Give each chart an
          accessible name and check its keyboard interaction.
        </Text>
        <Text>
          Use pointer movement or arrow keys to inspect points. Press Escape to
          dismiss the tooltip. Keep persistent selection in caller state.
        </Text>
        <CopyableCode
          code={chartUsageSources[type]}
          language="tsx"
          title={`${label} usage`}
        />
      </Stack>
    </Box>
  )
}
