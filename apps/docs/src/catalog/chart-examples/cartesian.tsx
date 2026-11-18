"use client"

import type { ChartTooltipBodyRenderContext } from "@tanstack/charts/react/tooltip"
import type { ReactNode } from "react"

import { Box } from "@registry/components/ui/box"
import {
  Card,
  CardDescription,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@registry/components/ui/card"
import {
  Chart,
  ChartContainer,
  ChartLegendContent,
  ChartTooltipContent,
} from "@registry/components/ui/chart"
import { Grid } from "@registry/components/ui/grid"
import { Heading } from "@registry/components/ui/heading"
import { Label } from "@registry/components/ui/label"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@registry/components/ui/select"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import {
  areaY,
  barX,
  barY,
  defineChart,
  dot,
  group,
  lineY,
  stack,
  text,
} from "@tanstack/charts"
import { d3Curve } from "@tanstack/charts/d3/shape"
import { scaleBand } from "@tanstack/charts/scales/band"
import { scaleLinear } from "@tanstack/charts/scales/linear"
import { scalePoint } from "@tanstack/charts/scales/point"
import { tooltip } from "@tanstack/charts/tooltip"
import { curveLinear, curveMonotoneX, curveStep } from "d3-shape"
import { MonitorIcon, SmartphoneIcon } from "lucide-react"
import { useState } from "react"

import { decorativeCartesianMark } from "@/catalog/chart-examples/decorative-mark"
import { ChartUsage } from "@/catalog/chart-examples/usage"

const styles = stylex.create({
  grid: {
    inlineSize: "100%",
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      "@media (min-width: 900px)": "repeat(2, minmax(0, 1fr))",
    },
    gap: "1rem",
  },
  panel: { minInlineSize: 0 },
  control: { maxInlineSize: "14rem", gap: "0.5rem" },
  icon: { inlineSize: "0.75rem", blockSize: "0.75rem" },
})

function DesktopIcon() {
  return <MonitorIcon aria-hidden="true" {...stylex.props(styles.icon)} />
}

function MobileIcon() {
  return <SmartphoneIcon aria-hidden="true" {...stylex.props(styles.icon)} />
}

const config = {
  Desktop: { label: "Desktop", color: tokens["--chart-1"], icon: DesktopIcon },
  Mobile: { label: "Mobile", color: tokens["--chart-2"], icon: MobileIcon },
}

const color = {
  domain: ["Desktop", "Mobile"],
  range: [tokens["--chart-1"], tokens["--chart-2"]],
}

const legend = [{ name: "Desktop" }, { name: "Mobile" }]

const rows = [
  { month: "Jan", series: "Desktop", visits: 186 },
  { month: "Jan", series: "Mobile", visits: 80 },
  { month: "Feb", series: "Desktop", visits: 205 },
  { month: "Feb", series: "Mobile", visits: 120 },
  { month: "Mar", series: "Desktop", visits: 165 },
  { month: "Mar", series: "Mobile", visits: 130 },
  { month: "Apr", series: "Desktop", visits: 230 },
  { month: "Apr", series: "Mobile", visits: 160 },
  { month: "May", series: "Desktop", visits: 240 },
  { month: "May", series: "Mobile", visits: 180 },
  { month: "Jun", series: "Desktop", visits: 280 },
  { month: "Jun", series: "Mobile", visits: 210 },
]

const single = rows.filter((row) => row.series === "Desktop")

const negative = single.map((row, index) => ({
  ...row,
  visits: index % 2 ? -row.visits : row.visits,
}))

const seriesItems = [
  { label: "All devices", value: "all" },
  { label: "Desktop", value: "Desktop" },
  { label: "Mobile", value: "Mobile" },
]

const descriptions: Record<"Area" | "Bar" | "Line", Record<string, string>> = {
  Area: {
    Default:
      "Fill the space below a smooth series to show its change over time.",
    Linear:
      "Join observations with straight segments. Use this when interpolation must stay linear.",
    Step: "Hold each value until the next observation. Use this for discrete changes.",
    Stacked:
      "Place series on top of each other to compare their contribution and combined total.",
    Expanded:
      "Normalize each total to one. Compare the share of each series rather than absolute values.",
    Gradient: "Fade the fill while keeping the series boundary visible.",
    Axes: "Show both axes to compare each observation against the numeric scale.",
    Legend:
      "Name each series beside its color indicator. Hide configured icons for a compact legend.",
    Icons: "Identify series with configured icons and labels in the legend.",
    Interactive:
      "Filter the series with Select. The chart and tooltip use the same filtered rows.",
  },
  Bar: {
    Default: "Compare one measurement across categories on a shared scale.",
    Horizontal:
      "Put category names on the vertical axis. This gives long labels more space.",
    Grouped:
      "Place series beside each other to compare values within each category.",
    Stacked: "Stack series within each category to show their combined total.",
    Mixed: "Use a different series color to distinguish one category.",
    Negative:
      "Draw positive and negative values around the same zero baseline.",
    Labels:
      "Show the numeric value at each bar so readers can inspect exact values.",
    "Custom labels":
      "Combine category and value labels with a native text mark.",
    Active:
      "Select a bar with a pointer or Enter. Its highlight stays after tooltip dismissal.",
    Interactive:
      "Choose a device with Select. Only matching rows remain in the chart.",
  },
  Line: {
    Default: "Use a smooth path to show the direction of a series over time.",
    Linear:
      "Join data points with straight segments without curved interpolation.",
    Step: "Show values as discrete steps between observations.",
    Multiple:
      "Compare series on shared axes and identify each series in the legend.",
    Dots: "Show a marker at each observation while retaining the line between observations.",
    "Custom dots":
      "Compose a separate marker mark to change the point appearance.",
    Labels: "Display the value beside each observation.",
    "Custom labels": "Use a custom text mark to add units to each value.",
    Interactive:
      "Filter the visible series with Select without changing the shared data model.",
  },
}

const pointScale = { scale: () => scalePoint<string>().padding(0.15) }

const bandScale = { scale: () => scaleBand<string>().padding(0.2) }

const valueScale = { scale: scaleLinear, grid: true }

function renderTooltip(context: ChartTooltipBodyRenderContext<unknown>) {
  return (
    <ChartTooltipContent context={context} nameKey="series" labelKey="month" />
  )
}

function ChartExample({
  family,
  variant,
  children,
}: {
  family: "Area" | "Bar" | "Line"
  variant: string
  children: ReactNode
}) {
  return (
    <Box render={<section />} aria-label={`${family} ${variant}`}>
      <Card>
        <CardHeader>
          <CardTitle>{variant}</CardTitle>
          <CardDescription>{descriptions[family][variant]}</CardDescription>
        </CardHeader>
        <CardPanel xstyle={styles.panel}>{children}</CardPanel>
      </Card>
    </Box>
  )
}

function SeriesControl({
  id,
  value,
  onChange,
}: {
  id: string
  value: string
  onChange: (value: string) => void
}) {
  function change(next: string | null) {
    if (next !== null) onChange(next)
  }

  return (
    <Stack xstyle={styles.control}>
      <Label htmlFor={id}>Device</Label>
      <Select items={seriesItems} value={value} onValueChange={change}>
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectPopup>
          {seriesItems.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectPopup>
      </Select>
    </Stack>
  )
}

const areaVariants = [
  "Default",
  "Linear",
  "Step",
  "Stacked",
  "Expanded",
  "Gradient",
  "Axes",
  "Legend",
  "Icons",
  "Interactive",
] as const

const barVariants = [
  "Default",
  "Horizontal",
  "Grouped",
  "Stacked",
  "Mixed",
  "Negative",
  "Labels",
  "Custom labels",
  "Active",
  "Interactive",
] as const

const lineVariants = [
  "Default",
  "Linear",
  "Step",
  "Multiple",
  "Dots",
  "Custom dots",
  "Labels",
  "Custom labels",
  "Interactive",
] as const

type AreaVariant = (typeof areaVariants)[number]

type BarVariant = (typeof barVariants)[number]

type LineVariant = (typeof lineVariants)[number]

function AreaExample({ variant }: { variant: AreaVariant }) {
  const [series, setSeries] = useState("all")

  const multi = [
    "Stacked",
    "Expanded",
    "Legend",
    "Icons",
    "Interactive",
  ].includes(variant)

  const data = multi
    ? rows.filter((row) => series === "all" || row.series === series)
    : single

  const definition = defineChart({
    marks: [
      areaY(data, {
        x: "month",
        y: "visits",
        color: "series",
        layout: multi
          ? stack({
              order: ["Desktop", "Mobile"],
              offset: variant === "Expanded" ? "normalize" : undefined,
            })
          : undefined,
        curve: d3Curve(
          variant === "Linear"
            ? curveLinear
            : variant === "Step"
              ? curveStep
              : curveMonotoneX,
        ),
        fill:
          variant === "Gradient" ? "url(#cartesian-area-gradient)" : undefined,
        fillOpacity: variant === "Gradient" ? 1 : 0.55,
        stroke: (row) =>
          row.series === "Desktop" ? tokens["--chart-1"] : tokens["--chart-2"],
        strokeWidth: 1.5,
      }),
    ],
    scales: {
      x: pointScale,
      y: {
        scale:
          variant === "Expanded"
            ? () => scaleLinear().domain([0, 1])
            : scaleLinear,
        grid: true,
        axis: variant === "Axes" ? {} : false,
      },
    },
    color,
    focus: "group-x",
    tooltip: { use: tooltip, items: [{ field: "visits", label: "visits" }] },
    gradients:
      variant === "Gradient"
        ? [
            {
              id: "cartesian-area-gradient",
              x1: 0,
              y1: 1,
              x2: 0,
              y2: 0,
              stops: [
                { offset: 0, color: tokens["--chart-1"], opacity: 0.1 },
                { offset: 1, color: tokens["--chart-1"], opacity: 0.9 },
              ],
            },
          ]
        : undefined,
  })

  return (
    <ChartExample family="Area" variant={variant}>
      {variant === "Interactive" && (
        <SeriesControl id="area-series" value={series} onChange={setSeries} />
      )}
      <Chart
        ariaLabel={`${variant} area chart`}
        definition={definition}
        height={240}
        renderTooltipBody={renderTooltip}
      />
      {(variant === "Icons" || variant === "Legend") && (
        <ChartLegendContent items={legend} hideIcon={variant === "Legend"} />
      )}
    </ChartExample>
  )
}

function BarExample({ variant }: { variant: BarVariant }) {
  const [series, setSeries] = useState("all")
  const [selected, setSelected] = useState<string | null>(null)
  const multi = ["Grouped", "Stacked", "Mixed", "Interactive"].includes(variant)

  const data =
    variant === "Negative"
      ? negative
      : multi
        ? rows.filter((row) => series === "all" || row.series === series)
        : single

  const bars =
    variant === "Horizontal"
      ? barX(data, { x: "visits", y: "month", color: "series", inset: 2 })
      : barY(data, {
          x: "month",
          y: "visits",
          color: "series",
          inset: 2,
          layout:
            variant === "Stacked"
              ? stack({ order: ["Desktop", "Mobile"] })
              : ["Grouped", "Interactive", "Mixed"].includes(variant)
                ? group()
                : undefined,
          fill: (row) =>
            (variant === "Active" && selected === row.month) ||
            (variant === "Mixed" && row.month === "Mar")
              ? tokens["--chart-3"]
              : row.series === "Desktop"
                ? tokens["--chart-1"]
                : tokens["--chart-2"],
        })

  const definition = defineChart({
    marks: [
      bars,
      ...(["Labels", "Custom labels"].includes(variant)
        ? [
            decorativeCartesianMark(
              text(data, {
                x: "month",
                y: "visits",
                text: (row) =>
                  variant === "Custom labels"
                    ? `${row.visits} visits`
                    : row.visits,
                dy: -10,
                fill:
                  variant === "Custom labels"
                    ? tokens["--chart-3"]
                    : tokens["--foreground"],
                fontSize: 11,
              }),
            ),
          ]
        : []),
    ],
    scales:
      variant === "Horizontal"
        ? { x: valueScale, y: bandScale }
        : { x: bandScale, y: valueScale },
    color,
    tooltip: { use: tooltip, items: [{ field: "visits", label: "visits" }] },
  })

  return (
    <ChartExample family="Bar" variant={variant}>
      {variant === "Interactive" && (
        <SeriesControl id="bar-series" value={series} onChange={setSeries} />
      )}
      <Chart
        ariaLabel={`${variant} bar chart`}
        definition={definition}
        height={240}
        renderTooltipBody={renderTooltip}
        onSelect={
          variant === "Active"
            ? (point) => {
                if (point) setSelected(point.datum.month)
              }
            : undefined
        }
      />
      {(variant === "Grouped" || variant === "Stacked") && (
        <ChartLegendContent items={legend} hideIcon />
      )}
      {variant === "Active" && (
        <Text data-slot="chart-selection" aria-live="polite">
          {selected ? `Selected: ${selected}` : "Select a bar"}
        </Text>
      )}
    </ChartExample>
  )
}

function LineExample({ variant }: { variant: LineVariant }) {
  const [series, setSeries] = useState("all")
  const multi = variant === "Multiple" || variant === "Interactive"

  const data = multi
    ? rows.filter((row) => series === "all" || row.series === series)
    : single

  const definition = defineChart({
    marks: [
      lineY(data, {
        x: "month",
        y: "visits",
        z: "series",
        color: "series",
        curve: d3Curve(
          variant === "Linear"
            ? curveLinear
            : variant === "Step"
              ? curveStep
              : curveMonotoneX,
        ),
        strokeWidth: 2,
        points: variant === "Dots",
      }),
      ...(variant === "Custom dots"
        ? [
            decorativeCartesianMark(
              dot(data, {
                x: "month",
                y: "visits",
                r: 6,
                fill: tokens["--chart-3"],
                stroke: tokens["--background"],
                strokeWidth: 2,
              }),
            ),
          ]
        : []),
      ...(["Labels", "Custom labels"].includes(variant)
        ? [
            decorativeCartesianMark(
              text(data, {
                x: "month",
                y: "visits",
                text: (row) =>
                  variant === "Custom labels"
                    ? `${row.visits} visits`
                    : row.visits,
                dy: -12,
                fill:
                  variant === "Custom labels"
                    ? tokens["--chart-3"]
                    : tokens["--foreground"],
                fontSize: 11,
              }),
            ),
          ]
        : []),
    ],
    scales: { x: pointScale, y: valueScale },
    color,
    focus: "group-x",
    tooltip: { use: tooltip, items: [{ field: "visits", label: "visits" }] },
  })

  return (
    <ChartExample family="Line" variant={variant}>
      {variant === "Interactive" && (
        <SeriesControl id="line-series" value={series} onChange={setSeries} />
      )}
      <Chart
        ariaLabel={`${variant} line chart`}
        definition={definition}
        height={240}
        renderTooltipBody={renderTooltip}
      />
      {variant === "Multiple" && <ChartLegendContent items={legend} />}
    </ChartExample>
  )
}

export function CartesianExamples() {
  return (
    <ChartContainer config={config}>
      <Stack>
        <Box render={<section />} aria-label="Area examples">
          <Stack>
            <Heading>Area examples</Heading>
            <Grid xstyle={styles.grid}>
              {areaVariants.map((variant) => (
                <AreaExample key={variant} variant={variant} />
              ))}
            </Grid>
            <ChartUsage type="area" />
          </Stack>
        </Box>
        <Box render={<section />} aria-label="Bar examples">
          <Stack>
            <Heading>Bar examples</Heading>
            <Grid xstyle={styles.grid}>
              {barVariants.map((variant) => (
                <BarExample key={variant} variant={variant} />
              ))}
            </Grid>
            <ChartUsage type="bar" />
          </Stack>
        </Box>
        <Box render={<section />} aria-label="Line examples">
          <Stack>
            <Heading>Line examples</Heading>
            <Grid xstyle={styles.grid}>
              {lineVariants.map((variant) => (
                <LineExample key={variant} variant={variant} />
              ))}
            </Grid>
            <ChartUsage type="line" />
          </Stack>
        </Box>
      </Stack>
    </ChartContainer>
  )
}
