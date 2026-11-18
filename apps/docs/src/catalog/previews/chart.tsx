"use client"

import type { ChartConfig } from "@registry/components/ui/chart"
import type { ChartTooltipBodyRenderContext } from "@tanstack/charts/react/tooltip"

import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
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
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@registry/components/ui/collapsible"
import { Empty, EmptyHeader, EmptyTitle } from "@registry/components/ui/empty"
import { Grid } from "@registry/components/ui/grid"
import { Label } from "@registry/components/ui/label"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@registry/components/ui/select"
import { Stack } from "@registry/components/ui/stack"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@registry/components/ui/table"
import { Wrap } from "@registry/components/ui/wrap"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { areaY, barY, defineChart, lineY, stack } from "@tanstack/charts"
import { d3Curve } from "@tanstack/charts/d3/shape"
import {
  angleGrid,
  pie,
  polar,
  radialArc,
  radialArea,
  radialBarRadius,
  radialGrid,
  radialLine,
  radialText,
} from "@tanstack/charts/polar"
import { scaleBand } from "@tanstack/charts/scales/band"
import { scaleLinear } from "@tanstack/charts/scales/linear"
import { scalePoint } from "@tanstack/charts/scales/point"
import { tooltip } from "@tanstack/charts/tooltip"
import { curveLinearClosed, curveMonotoneX } from "d3-shape"
import { MonitorIcon, SmartphoneIcon } from "lucide-react"
import { useState, type ReactNode } from "react"

import { CartesianExamples } from "@/catalog/chart-examples/cartesian"
import { decorativeMark } from "@/catalog/chart-examples/decorative-mark"
import { PieRadarRadialExamples } from "@/catalog/chart-examples/pie-radar-radial"
import { TooltipExamples } from "@/catalog/chart-examples/tooltip"

const styles = stylex.create({
  preview: { containerType: "inline-size", inlineSize: "100%" },
  grid: {
    inlineSize: "100%",
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      "@media (min-width: 900px)": "repeat(2, minmax(0, 1fr))",
    },
    gap: "1rem",
  },
  panel: { minInlineSize: 0 },
  controls: { gap: "0.5rem", maxInlineSize: "14rem" },
  icon: { inlineSize: "0.75rem", blockSize: "0.75rem" },
})

function DesktopIcon() {
  return <MonitorIcon aria-hidden="true" {...stylex.props(styles.icon)} />
}

function MobileIcon() {
  return <SmartphoneIcon aria-hidden="true" {...stylex.props(styles.icon)} />
}

const config: ChartConfig = {
  Desktop: { label: "Desktop visits", color: tokens["--chart-1"] },
  Mobile: { label: "Mobile visits", color: tokens["--chart-2"] },
  Search: { label: "Search", color: tokens["--chart-1"] },
  Direct: { label: "Direct", color: tokens["--chart-2"] },
  Referral: { label: "Referral", color: tokens["--chart-3"] },
  Social: { label: "Social", color: tokens["--chart-4"] },
  Other: { label: "Other", color: tokens["--chart-5"] },
}

const iconConfig = {
  ...config,
  Desktop: {
    label: "Desktop visits",
    theme: { light: tokens["--chart-1"], dark: tokens["--chart-1"] },
    icon: DesktopIcon,
  },
  Mobile: { ...config.Mobile, icon: MobileIcon },
}

const colors = [
  tokens["--chart-1"],
  tokens["--chart-2"],
  tokens["--chart-3"],
  tokens["--chart-4"],
  tokens["--chart-5"],
]

const labelColors = [
  tokens["--chart-1-foreground"],
  tokens["--chart-2-foreground"],
  tokens["--chart-3-foreground"],
  tokens["--chart-4-foreground"],
  tokens["--chart-5-foreground"],
]

const traffic = [
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

const sources = [
  { name: "Search", value: 42 },
  { name: "Direct", value: 26 },
  { name: "Referral", value: 16 },
  { name: "Social", value: 10 },
  { name: "Other", value: 6 },
]

const profile = [
  { category: "Speed", score: 80 },
  { category: "Quality", score: 65 },
  { category: "Reach", score: 90 },
  { category: "Retention", score: 72 },
  { category: "Support", score: 85 },
]

const rangeItems = [
  { label: "Six months", value: "all" },
  { label: "Last three months", value: "recent" },
]

const seriesItems = [
  { label: "All devices", value: "all" },
  { label: "Desktop", value: "Desktop" },
  { label: "Mobile", value: "Mobile" },
]

const seriesLegend = [
  { name: "Desktop", payload: { series: "Desktop" } },
  { name: "Mobile", payload: { series: "Mobile" } },
]

const sourceLegend = sources.map(({ name }) => ({ name }))

const color = { domain: ["Desktop", "Mobile"], range: colors.slice(0, 2) }

const sourceColor = { domain: sources.map((row) => row.name), range: colors }

const slices = pie(sources, { value: "value" })

const emptyRows: typeof traffic = []

const emptyChart = defineChart({
  marks: [barY(emptyRows, { x: "month", y: "visits" })],
  scales: {
    x: { scale: () => scaleBand<string>().padding(0.2) },
    y: { scale: scaleLinear, grid: true },
  },
})

const pieChart = defineChart({
  marks: [
    polar({
      radiusRatio: 0.8,
      scales: {
        angle: { scale: scaleLinear().domain([0, Math.PI * 2]) },
        radius: { scale: scaleLinear().domain([0, 1]) },
      },
      marks: [
        radialArc(slices, {
          innerRadius: ({ radius }) => radius * 0.55,
          cornerRadius: 3,
          color: "name",
          key: "name",
        }),
        decorativeMark(
          radialText(slices, {
            angle: "angle",
            radius: 0.78,
            text: (row) => `${row.value}%`,
            key: "name",
            fill: (row) =>
              labelColors[
                sources.findIndex((source) => source.name === row.name)
              ] ?? tokens["--chart-1-foreground"],
            fontSize: 11,
            fontWeight: 600,
            anchor: "middle",
            baseline: "middle",
          }),
        ),
        decorativeMark(
          radialText([{ label: "100%" }], {
            angle: 0,
            radius: 0,
            text: "label",
            fill: tokens["--foreground"],
            fontSize: 18,
            fontWeight: 600,
            anchor: "middle",
            baseline: "middle",
          }),
        ),
      ],
    }),
  ],
  scales: { x: null, y: null },
  color: sourceColor,
  tooltip: { use: tooltip, items: [{ field: "value", label: "name" }] },
})

const radarChart = defineChart({
  marks: [
    polar({
      radiusRatio: 0.68,
      scales: {
        angle: {
          scale: scalePoint<string>().domain(
            profile.map((row) => row.category),
          ),
          wrap: true,
        },
        radius: { scale: scaleLinear().domain([0, 100]) },
      },
      guides: [
        // oxlint-disable-next-line quality/no-shape-in-symbol-names -- TanStack requires the public shape option for polygon grids.
        radialGrid({ values: [25, 50, 75, 100], shape: "polygon" }),
        angleGrid({ labels: true }),
      ],
      marks: [
        decorativeMark(
          radialArea(profile, {
            curve: curveLinearClosed,
            angle: "category",
            radius: "score",
            fill: tokens["--chart-1"],
            fillOpacity: 0.25,
          }),
        ),
        radialLine(profile, {
          key: "category",
          curve: curveLinearClosed,
          angle: "category",
          radius: "score",
          stroke: tokens["--chart-1"],
          strokeWidth: 2,
        }),
      ],
    }),
  ],
  scales: { x: null, y: null },
  tooltip: { use: tooltip, items: [{ field: "score", label: "Score" }] },
})

const radialChart = defineChart({
  marks: [
    polar({
      radiusRatio: 0.8,
      scales: {
        angle: { scale: () => scaleBand<string>().padding(0.15) },
        radius: {
          scale: scaleLinear().domain([0, 50]),
          range: [({ radius }) => radius * 0.25, ({ radius }) => radius],
        },
      },
      marks: [
        radialBarRadius(sources, {
          angle: "name",
          radius: "value",
          color: "name",
          key: "name",
        }),
      ],
    }),
  ],
  scales: { x: null, y: null },
  color: sourceColor,
  tooltip: { use: tooltip, items: [{ field: "value", label: "name" }] },
})

function formatMonthLabel(label: ReactNode) {
  return <>Month: {label}</>
}

function formatVisits(value: string, name: string) {
  return (
    <>
      {config[name]?.label ?? name}: {value} visits
    </>
  )
}

function renderAreaTooltip(context: ChartTooltipBodyRenderContext<unknown>) {
  return (
    <ChartTooltipContent
      context={context}
      indicator="line"
      nameKey="series"
      labelKey="month"
    />
  )
}

function renderBarTooltip(context: ChartTooltipBodyRenderContext<unknown>) {
  return (
    <ChartTooltipContent
      context={context}
      nameKey="series"
      labelKey="month"
      labelFormatter={formatMonthLabel}
      formatter={formatVisits}
    />
  )
}

function renderLineTooltip(context: ChartTooltipBodyRenderContext<unknown>) {
  return (
    <ChartTooltipContent
      context={context}
      indicator="dashed"
      nameKey="series"
      labelKey="month"
    />
  )
}

function renderPieTooltip(context: ChartTooltipBodyRenderContext<unknown>) {
  return <ChartTooltipContent context={context} hideLabel nameKey="name" />
}

function renderRadarTooltip(context: ChartTooltipBodyRenderContext<unknown>) {
  return (
    <ChartTooltipContent context={context} hideIndicator labelKey="category" />
  )
}

function renderRadialTooltip(context: ChartTooltipBodyRenderContext<unknown>) {
  return (
    <ChartTooltipContent context={context} nameKey="name" labelKey="name" />
  )
}

function ChartOverview() {
  const [range, setRange] = useState("all")
  const [series, setSeries] = useState("all")

  function handleRangeChange(value: string | null) {
    if (value !== null) setRange(value)
  }

  function handleSeriesChange(value: string | null) {
    if (value !== null) setSeries(value)
  }

  const rows = traffic.filter(
    (row, index) =>
      (range === "all" || index >= 6) &&
      (series === "all" || row.series === series),
  )

  function exportData() {
    const csv = [
      "Month,Device,Visits",
      ...rows.map(
        ({ month, series, visits }) => `${month},${series},${visits}`,
      ),
    ].join("\n")

    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    )

    const link = document.createElement("a")
    link.href = url
    link.download = "chart-visits.csv"

    try {
      link.click()
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  const activeLegend = seriesLegend.filter(
    (item) => series === "all" || item.name === series,
  )

  const area = defineChart({
    marks: [
      areaY(rows, {
        x: "month",
        y: "visits",
        color: "series",
        layout: stack({ order: ["Desktop", "Mobile"] }),
        curve: d3Curve(curveMonotoneX),
        fill: (row) => `url(#area-${row.series})`,
        stroke: (row) =>
          row.series === "Desktop" ? tokens["--chart-1"] : tokens["--chart-2"],
        strokeWidth: 1.5,
      }),
    ],
    scales: {
      x: { scale: () => scalePoint<string>().padding(0.15) },
      y: { scale: scaleLinear, grid: true },
    },
    color,
    gradients: [
      {
        id: "area-Desktop",
        x1: 0,
        y1: 1,
        x2: 0,
        y2: 0,
        stops: [
          { offset: 0, color: tokens["--chart-1"], opacity: 0.15 },
          { offset: 1, color: tokens["--chart-1"], opacity: 0.8 },
        ],
      },
      {
        id: "area-Mobile",
        x1: 0,
        y1: 1,
        x2: 0,
        y2: 0,
        stops: [
          { offset: 0, color: tokens["--chart-2"], opacity: 0.15 },
          { offset: 1, color: tokens["--chart-2"], opacity: 0.8 },
        ],
      },
    ],
    focus: "group-x",
    tooltip: { use: tooltip, items: [{ field: "visits", label: "visits" }] },
  })

  const bar = defineChart({
    marks: [
      barY(rows, {
        x: "month",
        y: "visits",
        color: "series",
        layout: stack({ order: ["Desktop", "Mobile"] }),
        inset: 2,
      }),
    ],
    scales: {
      x: { scale: () => scaleBand<string>().padding(0.2) },
      y: { scale: scaleLinear, grid: true },
    },
    color,
    focus: "group-x",
    tooltip: { use: tooltip, items: [{ field: "visits", label: "visits" }] },
  })

  const line = defineChart({
    chart() {
      return {
        marks: [
          lineY(rows, {
            x: "month",
            y: "visits",
            z: "series",
            color: "series",
            points: true,
            curve: d3Curve(curveMonotoneX),
            strokeWidth: 2,
          }),
        ],
        scales: {
          x: { scale: () => scalePoint<string>().padding(0.15) },
          y: { scale: scaleLinear, grid: true },
        },
        color,
      }
    },
    focus: "group-x",
    tooltip: { use: tooltip, items: [{ field: "visits", label: "visits" }] },
  })

  return (
    <ChartContainer config={config}>
      <Stack>
        <Grid xstyle={styles.grid}>
          <Stack xstyle={styles.controls}>
            <Label htmlFor="chart-range">Data range</Label>
            <Select
              items={rangeItems}
              value={range}
              onValueChange={handleRangeChange}
            >
              <SelectTrigger id="chart-range">
                <SelectValue />
              </SelectTrigger>
              <SelectPopup>
                {rangeItems.map(({ label, value }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>
          </Stack>
          <Stack xstyle={styles.controls}>
            <Label htmlFor="chart-series">Series</Label>
            <Select
              items={seriesItems}
              value={series}
              onValueChange={handleSeriesChange}
            >
              <SelectTrigger id="chart-series">
                <SelectValue />
              </SelectTrigger>
              <SelectPopup>
                {seriesItems.map(({ label, value }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>
          </Stack>
        </Grid>
        <Grid xstyle={styles.grid}>
          <Card>
            <CardHeader>
              <CardTitle>Stacked area</CardTitle>
              <CardDescription>Visits by device over time.</CardDescription>
            </CardHeader>
            <CardPanel xstyle={styles.panel}>
              <Box render={<section />} aria-label="Area chart">
                <Chart
                  ariaLabel="Area chart"
                  definition={area}
                  height={240}
                  renderTooltipBody={renderAreaTooltip}
                />
              </Box>
              <ChartLegendContent items={activeLegend} nameKey="series" />
            </CardPanel>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Stacked bar</CardTitle>
              <CardDescription>Monthly visits by device.</CardDescription>
            </CardHeader>
            <CardPanel xstyle={styles.panel}>
              <ChartContainer config={iconConfig}>
                <Box render={<section />} aria-label="Bar chart">
                  <Chart
                    ariaLabel="Bar chart"
                    definition={bar}
                    height={240}
                    renderTooltipBody={renderBarTooltip}
                  />
                </Box>
                <ChartLegendContent items={activeLegend} nameKey="series" />
              </ChartContainer>
            </CardPanel>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Line with points</CardTitle>
              <CardDescription>Compare device trends.</CardDescription>
            </CardHeader>
            <CardPanel xstyle={styles.panel}>
              <Box render={<section />} aria-label="Line chart">
                <Chart
                  ariaLabel="Line chart"
                  definition={line}
                  height={240}
                  renderTooltipBody={renderLineTooltip}
                />
              </Box>
              <ChartLegendContent items={activeLegend} nameKey="series" />
            </CardPanel>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Donut</CardTitle>
              <CardDescription>Share of visits by source.</CardDescription>
            </CardHeader>
            <CardPanel xstyle={styles.panel}>
              <Box render={<section />} aria-label="Pie chart">
                <Chart
                  ariaLabel="Pie chart"
                  definition={pieChart}
                  height={240}
                  renderTooltipBody={renderPieTooltip}
                />
              </Box>
              <ChartLegendContent items={sourceLegend} />
            </CardPanel>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Radar</CardTitle>
              <CardDescription>Scores across five measures.</CardDescription>
            </CardHeader>
            <CardPanel xstyle={styles.panel}>
              <Box render={<section />} aria-label="Radar chart">
                <Chart
                  ariaLabel="Radar chart"
                  definition={radarChart}
                  height={240}
                  renderTooltipBody={renderRadarTooltip}
                />
              </Box>
            </CardPanel>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Radial bars</CardTitle>
              <CardDescription>
                Visits by source, as a percentage.
              </CardDescription>
            </CardHeader>
            <CardPanel xstyle={styles.panel}>
              <Box render={<section />} aria-label="Radial chart">
                <Chart
                  ariaLabel="Radial chart"
                  definition={radialChart}
                  height={240}
                  renderTooltipBody={renderRadialTooltip}
                />
              </Box>
              <ChartLegendContent items={sourceLegend} />
            </CardPanel>
          </Card>
        </Grid>
        <Card>
          <CardHeader>
            <CardTitle>Data access</CardTitle>
            <CardDescription>
              Read or export the filtered values.
            </CardDescription>
          </CardHeader>
          <CardPanel>
            <Collapsible>
              <Wrap>
                <CollapsibleTrigger render={<Button variant="outline" />}>
                  View data table
                </CollapsibleTrigger>
                <Button variant="outline" onClick={exportData}>
                  Export CSV
                </Button>
              </Wrap>
              <CollapsiblePanel>
                <Table aria-label="Chart data">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Visits</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map(({ month, series, visits }) => (
                      <TableRow key={`${month}-${series}`}>
                        <TableCell>{month}</TableCell>
                        <TableCell>{series}</TableCell>
                        <TableCell>{visits}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CollapsiblePanel>
            </Collapsible>
          </CardPanel>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Empty data</CardTitle>
          </CardHeader>
          <CardPanel xstyle={styles.panel}>
            <Box render={<section />} aria-label="Empty chart">
              <Chart
                ariaLabel="Empty chart"
                definition={emptyChart}
                height={160}
              />
              {emptyRows.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyTitle>No chart data</EmptyTitle>
                  </EmptyHeader>
                </Empty>
              ) : null}
            </Box>
          </CardPanel>
        </Card>
      </Stack>
    </ChartContainer>
  )
}

export function Preview() {
  return (
    <Stack xstyle={styles.preview}>
      <ChartOverview />
      <CartesianExamples />
      <PieRadarRadialExamples />
      <TooltipExamples />
    </Stack>
  )
}
