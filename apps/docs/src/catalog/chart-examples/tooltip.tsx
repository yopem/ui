"use client"

import type { ChartTooltipBodyRenderContext } from "@tanstack/charts/react/tooltip"
import type { ReactNode } from "react"

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
  ChartTooltipContent,
} from "@registry/components/ui/chart"
import { Grid } from "@registry/components/ui/grid"
import { Heading } from "@registry/components/ui/heading"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { barY, defineChart, group } from "@tanstack/charts"
import { scaleBand } from "@tanstack/charts/scales/band"
import { scaleLinear } from "@tanstack/charts/scales/linear"
import { tooltip } from "@tanstack/charts/tooltip"
import { MonitorIcon, SmartphoneIcon } from "lucide-react"
import { useState } from "react"

import { InitialFocusExamples } from "@/catalog/chart-examples/initial-focus"
import { ChartUsage } from "@/catalog/chart-examples/usage"

const styles = stylex.create({
  grid: {
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      "@media (min-width: 900px)": "repeat(2, minmax(0, 1fr))",
    },
    gap: "1rem",
  },
  icon: { inlineSize: "0.75rem", blockSize: "0.75rem" },
  total: {
    borderBlockStart: `1px solid ${tokens["--border"]}`,
    paddingBlockStart: "0.5rem",
  },
})

function DesktopIcon() {
  return <MonitorIcon aria-hidden="true" {...stylex.props(styles.icon)} />
}

function MobileIcon() {
  return <SmartphoneIcon aria-hidden="true" {...stylex.props(styles.icon)} />
}

const config = {
  Desktop: { label: "Desktop", color: tokens["--chart-1"] },
  Mobile: { label: "Mobile", color: tokens["--chart-2"] },
}

const iconConfig = {
  Desktop: { ...config.Desktop, icon: DesktopIcon },
  Mobile: { ...config.Mobile, icon: MobileIcon },
}

const traffic = [
  { date: "Jan 2026", series: "Desktop", visits: 186 },
  { date: "Jan 2026", series: "Mobile", visits: 80 },
  { date: "Feb 2026", series: "Desktop", visits: 205 },
  { date: "Feb 2026", series: "Mobile", visits: 120 },
  { date: "Mar 2026", series: "Desktop", visits: 165 },
  { date: "Mar 2026", series: "Mobile", visits: 130 },
]

type Traffic = (typeof traffic)[number]

type TooltipContext = ChartTooltipBodyRenderContext<Traffic>

const definition = defineChart({
  marks: [
    barY(traffic, {
      x: "date",
      y: "visits",
      color: "series",
      layout: group(),
      inset: 2,
    }),
  ],
  scales: {
    x: { scale: () => scaleBand<string>().padding(0.2) },
    y: { scale: scaleLinear, grid: true },
  },
  color: {
    domain: ["Desktop", "Mobile"],
    range: [tokens["--chart-1"], tokens["--chart-2"]],
  },
  focus: "group-x",
  tooltip: { use: tooltip, items: [{ field: "visits", label: "visits" }] },
})

const variants = [
  { name: "Default", description: "Show the date and series values." },
  { name: "Line", description: "Use a line for each series indicator." },
  { name: "Dashed", description: "Use dashed series indicators." },
  { name: "No indicator", description: "Hide the series indicators." },
  { name: "No label", description: "Hide the tooltip heading." },
  { name: "Custom label", description: "Format the tooltip heading." },
  { name: "Custom formatter", description: "Format values with their units." },
  { name: "Icons", description: "Use device icons for the series." },
  { name: "Advanced", description: "Show grouped values and their total." },
  {
    name: "Initial focus",
    description: "Open a tooltip on demand at an initial point.",
  },
] as const

type Variant = (typeof variants)[number]["name"]

function formatLabel(label: ReactNode) {
  return <>Visits for {label}</>
}

function formatVisits(value: string, name: string) {
  return (
    <>
      {name}: {value} visits
    </>
  )
}

function renderContent(context: TooltipContext, variant: Variant) {
  const content = (
    <ChartTooltipContent
      context={context}
      indicator={
        variant === "Line" ? "line" : variant === "Dashed" ? "dashed" : "dot"
      }
      hideIndicator={variant === "No indicator"}
      hideLabel={variant === "No label"}
      labelKey="date"
      nameKey="series"
      labelFormatter={
        variant === "Custom label" || variant === "Advanced"
          ? formatLabel
          : undefined
      }
      formatter={
        variant === "Custom formatter" || variant === "Advanced"
          ? formatVisits
          : undefined
      }
    />
  )

  if (variant !== "Advanced") return content

  const total = context.points.reduce(
    (sum, point) => sum + point.datum.visits,
    0,
  )

  return (
    <Box>
      {content}
      <Text data-slot="chart-tooltip-total" xstyle={styles.total}>
        Total: {total} visits
      </Text>
    </Box>
  )
}

function TooltipExample({ variant }: { variant: (typeof variants)[number] }) {
  const [focusVersion, setFocusVersion] = useState(0)

  function handleShowFocus() {
    setFocusVersion((version) => version + 1)
  }

  function renderTooltip(context: TooltipContext) {
    return renderContent(context, variant.name)
  }

  return (
    <Box render={<section />} aria-label={`Tooltip ${variant.name}`}>
      <Card>
        <CardHeader>
          <CardTitle>{variant.name}</CardTitle>
          <CardDescription>{variant.description}</CardDescription>
        </CardHeader>
        <CardPanel>
          <ChartContainer
            config={
              variant.name === "Icons" || variant.name === "Advanced"
                ? iconConfig
                : config
            }
          >
            <Chart
              key={focusVersion}
              ariaLabel={`${variant.name} tooltip chart`}
              definition={definition}
              height={220}
              defaultIndex={
                variant.name === "Initial focus" && focusVersion > 0
                  ? 1
                  : undefined
              }
              renderTooltipBody={renderTooltip}
            />
          </ChartContainer>
          {variant.name === "Initial focus" ? (
            <Button onClick={handleShowFocus}>Show initial focus</Button>
          ) : null}
        </CardPanel>
      </Card>
    </Box>
  )
}

export function TooltipExamples() {
  return (
    <Box render={<section />} aria-label="Tooltip examples">
      <Stack>
        <Heading>Tooltip examples</Heading>
        <Text>Use keyboard arrows or the pointer to inspect each chart.</Text>
        <Grid xstyle={styles.grid}>
          {variants.map((variant) => (
            <TooltipExample key={variant.name} variant={variant} />
          ))}
        </Grid>
        <InitialFocusExamples />
        <ChartUsage type="tooltip" />
      </Stack>
    </Box>
  )
}
