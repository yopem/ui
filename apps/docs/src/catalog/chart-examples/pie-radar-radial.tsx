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
import { defineChart } from "@tanstack/charts"
import {
  angleGrid,
  pie,
  polar,
  radialArc,
  radialArea,
  radialDot,
  radialGrid,
  radialLine,
  radialText,
} from "@tanstack/charts/polar"
import { scaleLinear } from "@tanstack/charts/scales/linear"
import { scalePoint } from "@tanstack/charts/scales/point"
import { tooltip } from "@tanstack/charts/tooltip"
import { arc, curveLinearClosed } from "d3-shape"
import {
  GaugeIcon,
  GlobeIcon,
  HeadphonesIcon,
  RepeatIcon,
  ShieldCheckIcon,
} from "lucide-react"
import { useState } from "react"

import { decorativeMark } from "@/catalog/chart-examples/decorative-mark"
import { ChartUsage } from "@/catalog/chart-examples/usage"

const styles = stylex.create({
  grid: {
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      "@media (min-width: 900px)": "repeat(2, minmax(0, 1fr))",
    },
    gap: "1rem",
  },
  control: { maxInlineSize: "14rem" },
})

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

const sources = [
  { name: "Search", value: 42 },
  { name: "Direct", value: 26 },
  { name: "Referral", value: 16 },
  { name: "Social", value: 10 },
  { name: "Other", value: 6 },
]

const config = {
  Search: { label: "Search", color: colors[0] },
  Direct: { label: "Direct", color: colors[1] },
  Referral: { label: "Referral", color: colors[2] },
  Social: { label: "Social", color: colors[3] },
  Other: { label: "Other", color: colors[4] },
  Current: { label: "Current", color: colors[0] },
  Previous: { label: "Previous", color: colors[1] },
}

const sourceColor = { domain: sources.map((row) => row.name), range: colors }

const sourceLegend = sources.map(({ name }) => ({ name }))

const profile = [
  { category: "Speed", score: 80, previous: 60 },
  { category: "Quality", score: 65, previous: 76 },
  { category: "Reach", score: 90, previous: 65 },
  { category: "Retention", score: 72, previous: 58 },
  { category: "Support", score: 85, previous: 70 },
]

const radarIconConfig = {
  ...config,
  Speed: { label: "Speed", icon: GaugeIcon },
  Quality: { label: "Quality", icon: ShieldCheckIcon },
  Reach: { label: "Reach", icon: GlobeIcon },
  Retention: { label: "Retention", icon: RepeatIcon },
  Support: { label: "Support", icon: HeadphonesIcon },
}

const radarLegend = profile.map(({ category }) => ({ name: category }))

const pieVariants = [
  "Pie",
  "Donut",
  "Center text",
  "Active",
  "Labels",
  "Custom labels",
  "Legend",
  "No separator",
  "Stacked",
  "Interactive",
] as const

const radarVariants = [
  "Default",
  "Dots",
  "Multiple",
  "Lines",
  "Labels",
  "Custom labels",
  "Circle grid",
  "Filled grid",
  "No grid",
  "Icons",
  "Legend",
] as const

const radialVariants = [
  "Default",
  "Grid",
  "Label",
  "Shape",
  "Stacked",
  "Concentric",
  "Text",
] as const

type PieVariant = (typeof pieVariants)[number]

type RadarVariant = (typeof radarVariants)[number]

type RadialVariant = (typeof radialVariants)[number]

function renderTooltip(context: ChartTooltipBodyRenderContext<unknown>) {
  return <ChartTooltipContent context={context} labelKey="category" />
}

function renderNamedTooltip(context: ChartTooltipBodyRenderContext<unknown>) {
  return <ChartTooltipContent context={context} nameKey="name" />
}

function ExampleCard({
  family,
  name,
  description,
  children,
}: {
  family: "Pie" | "Radar" | "Radial"
  name: string
  description: string
  children: ReactNode
}) {
  return (
    <Box render={<section />} aria-label={`${family} ${name}`}>
      <Card>
        <CardHeader>
          <CardTitle>{name}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardPanel>{children}</CardPanel>
      </Card>
    </Box>
  )
}

function PieExample({ variant }: { variant: PieVariant }) {
  const [selected, setSelected] = useState(
    variant === "Interactive" ? "Search" : "",
  )

  const donut =
    variant !== "Pie" &&
    variant !== "Labels" &&
    variant !== "Custom labels" &&
    variant !== "No separator"

  const slices = pie(sources, {
    value: "value",
    gapAngle: variant === "No separator" ? 0 : 0.025,
  })

  const center = variant === "Center text" || variant === "Interactive"
  const labels = variant === "Labels" || variant === "Custom labels"
  const selectedSource = sources.find((row) => row.name === selected)

  const definition = defineChart({
    marks: [
      polar({
        radiusRatio: 0.75,
        scales: {
          angle: null,
          radius: null,
          labelAngle: {
            channel: "angle",
            scale: scaleLinear().domain([0, Math.PI * 2]),
          },
          labelRadius: {
            channel: "radius",
            scale: scaleLinear().domain([0, 1]),
          },
        },
        marks: [
          radialArc(slices, {
            innerRadius: ({ radius }) => radius * (donut ? 0.55 : 0),
            outerRadius: ({ radius }) =>
              radius * (variant === "Stacked" ? 0.72 : 1),
            color: "name",
            key: "name",
            stroke: (row) =>
              row.name === selected ? tokens["--foreground"] : "transparent",
            strokeWidth: 3,
          }),
          ...(variant === "Stacked"
            ? [
                radialArc(slices, {
                  innerRadius: ({ radius }) => radius * 0.78,
                  outerRadius: ({ radius }) => radius,
                  color: "name",
                  key: "name",
                  fillOpacity: 0.55,
                }),
              ]
            : []),
          ...(labels
            ? [
                decorativeMark(
                  radialText(slices, {
                    angleScale: "labelAngle",
                    radiusScale: "labelRadius",
                    angle: "angle",
                    radius: 0.7,
                    key: "name",
                    text: (row) =>
                      variant === "Labels"
                        ? `${row.value}%`
                        : `${row.name} ${row.value}%`,
                    fill: (row) =>
                      labelColors[
                        sources.findIndex((source) => source.name === row.name)
                      ] ?? tokens["--chart-1-foreground"],
                    fontSize: variant === "Labels" ? 12 : 9,
                    fontWeight: 600,
                    anchor: "middle",
                    baseline: "middle",
                  }),
                ),
              ]
            : []),
          ...(center
            ? [
                decorativeMark(
                  radialText(
                    [
                      {
                        label: selectedSource
                          ? `${selectedSource.value}%`
                          : "100%",
                      },
                    ],
                    {
                      angleScale: "labelAngle",
                      radiusScale: "labelRadius",
                      angle: 0,
                      radius: 0,
                      text: "label",
                      fill: tokens["--foreground"],
                      fontSize: 20,
                      fontWeight: 600,
                      anchor: "middle",
                      baseline: "middle",
                    },
                  ),
                ),
              ]
            : []),
        ],
      }),
    ],
    scales: { x: null, y: null },
    color: sourceColor,
    tooltip: { use: tooltip, items: [{ field: "value", label: "name" }] },
  })

  return (
    <ExampleCard
      family="Pie"
      name={variant}
      description={
        variant === "Pie"
          ? "Show each source as a share of the total."
          : variant === "Donut"
            ? "Leave space in the center of the chart."
            : variant === "Center text"
              ? "Place the total inside the ring."
              : variant === "Active"
                ? "Select a slice with the pointer or keyboard."
                : variant === "Labels"
                  ? "Show percentages on the slices."
                  : variant === "Custom labels"
                    ? "Show the source and value on each slice."
                    : variant === "Legend"
                      ? "Identify each source in a legend."
                      : variant === "No separator"
                        ? "Join the slices without gaps."
                        : variant === "Stacked"
                          ? "Compare the same shares in concentric rings."
                          : "Choose a source to highlight its slice."
      }
    >
      <ChartContainer config={config}>
        {variant === "Interactive" && (
          <Stack xstyle={styles.control}>
            <Label htmlFor="chart-source">Source</Label>
            <Select
              items={sources.map(({ name }) => ({ label: name, value: name }))}
              value={selected}
              onValueChange={(value) => {
                if (value !== null) setSelected(value)
              }}
            >
              <SelectTrigger id="chart-source">
                <SelectValue />
              </SelectTrigger>
              <SelectPopup>
                {sources.map(({ name }) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>
          </Stack>
        )}
        <Chart
          ariaLabel={`${variant} pie chart`}
          definition={definition}
          height={260}
          renderTooltipBody={renderNamedTooltip}
          onSelect={
            variant === "Active"
              ? (point) => {
                  if (point && "name" in point.datum)
                    setSelected(point.datum.name)
                }
              : undefined
          }
        />
        {variant === "Active" && (
          <Text data-slot="chart-selection" aria-live="polite">
            {selected ? `${selected}: ${selectedSource?.value}%` : ""}
          </Text>
        )}
        {variant === "Legend" && <ChartLegendContent items={sourceLegend} />}
      </ChartContainer>
    </ExampleCard>
  )
}

function RadarExample({ variant }: { variant: RadarVariant }) {
  const multiple = variant === "Multiple" || variant === "Legend"

  const definition = defineChart({
    marks: [
      polar({
        radiusRatio: 0.62,
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
          ...(variant === "No grid"
            ? []
            : [
                radialGrid({
                  values: [25, 50, 75, 100],
                  // oxlint-disable-next-line quality/no-shape-in-symbol-names -- The polar grid API requires this option.
                  shape: variant === "Circle grid" ? "circle" : "polygon",
                  fill: variant === "Filled grid" ? tokens["--muted"] : "none",
                  fillOpacity: 0.6,
                }),
              ]),
          ...(variant === "No grid"
            ? []
            : [
                angleGrid({
                  labels: variant !== "Custom labels",
                }),
              ]),
        ],
        marks: [
          ...(variant === "Lines"
            ? []
            : [
                decorativeMark(
                  radialArea(profile, {
                    angle: "category",
                    radius: "score",
                    curve: curveLinearClosed,
                    fill: colors[0],
                    fillOpacity: 0.25,
                  }),
                ),
              ]),
          radialLine(profile, {
            angle: "category",
            radius: "score",
            key: "category",
            curve: curveLinearClosed,
            stroke: colors[0],
            strokeWidth: 2,
          }),
          ...(multiple
            ? [
                decorativeMark(
                  radialArea(profile, {
                    angle: "category",
                    radius: "previous",
                    curve: curveLinearClosed,
                    fill: colors[1],
                    fillOpacity: 0.2,
                  }),
                ),
                radialLine(profile, {
                  angle: "category",
                  radius: "previous",
                  key: "category",
                  curve: curveLinearClosed,
                  stroke: colors[1],
                  strokeWidth: 2,
                }),
              ]
            : []),
          ...(variant === "Dots"
            ? [
                decorativeMark(
                  radialDot(profile, {
                    angle: "category",
                    radius: "score",
                    key: "category",
                    r: 4,
                    fill: colors[0],
                  }),
                ),
              ]
            : []),
          ...(variant === "Labels"
            ? [
                decorativeMark(
                  radialText(profile, {
                    angle: "category",
                    radius: "score",
                    text: "score",
                    radiusOffset: 12,
                    fill: tokens["--foreground"],
                    fontSize: 11,
                    anchor: "middle",
                  }),
                ),
              ]
            : []),
          ...(variant === "Custom labels"
            ? [
                decorativeMark(
                  radialText(profile, {
                    angle: "category",
                    radius: 100,
                    radiusOffset: 20,
                    text: (row) => `${row.category} · ${row.score}`,
                    fill: tokens["--foreground"],
                    fontSize: 10,
                    anchor: "middle",
                    baseline: "middle",
                  }),
                ),
              ]
            : []),
        ],
      }),
    ],
    scales: { x: null, y: null },
    tooltip: {
      use: tooltip,
      items: multiple
        ? [
            { field: "score", label: "Current" },
            { field: "previous", label: "Previous" },
          ]
        : [{ field: "score", label: "Score" }],
    },
  })

  const descriptions: Record<RadarVariant, string> = {
    Default: "Compare scores across five measures.",
    Dots: "Mark each observed score with a dot.",
    Multiple: "Compare current and previous scores.",
    Lines: "Use an outline without a filled area.",
    Labels: "Show the score at each point.",
    "Custom labels": "Add values to the measure labels.",
    "Circle grid": "Use circular reference rings.",
    "Filled grid": "Fill the reference grid.",
    "No grid": "Show the profile without reference guides.",
    Icons: "Identify the measures with icons in the legend.",
    Legend: "Identify each profile in a legend.",
  }

  return (
    <ExampleCard
      family="Radar"
      name={variant}
      description={descriptions[variant]}
    >
      <ChartContainer config={variant === "Icons" ? radarIconConfig : config}>
        <Chart
          ariaLabel={`${variant} radar chart`}
          definition={definition}
          height={260}
          renderTooltipBody={renderTooltip}
        />
        {variant === "Legend" && (
          <ChartLegendContent
            items={[{ name: "Current" }, { name: "Previous" }]}
          />
        )}
        {variant === "Icons" && <ChartLegendContent items={radarLegend} />}
      </ChartContainer>
    </ExampleCard>
  )
}

function RadialExample({ variant }: { variant: RadialVariant }) {
  const progress =
    variant === "Stacked"
      ? pie(
          [
            { name: "Search", value: 72 },
            { name: "Direct", value: 28 },
          ],
          {
            value: "value",
            startAngle: -Math.PI / 2,
            endAngle: Math.PI / 2,
          },
        )
      : [
          {
            name: "Search",
            value: 72,
            startAngle: 0,
            endAngle: Math.PI * 2 * 0.72,
          },
        ]

  const track = [
    {
      name: "Track",
      startAngle: variant === "Stacked" ? -Math.PI / 2 : 0,
      endAngle: variant === "Stacked" ? Math.PI / 2 : Math.PI * 2,
    },
  ]

  const definition = defineChart({
    marks: [
      polar({
        radiusRatio: 0.78,
        scales: {
          angle: null,
          radius: null,
          guideAngle: {
            channel: "angle",
            scale: scaleLinear().domain([0, Math.PI * 2]),
          },
          guideRadius: {
            channel: "radius",
            scale: scaleLinear().domain([0, 1]),
          },
        },
        guides:
          variant === "Grid"
            ? [
                radialGrid({
                  scale: "guideRadius",
                  values: [0.45, 0.6, 0.75, 0.9],
                }),
                angleGrid({
                  scale: "guideAngle",
                  values: [0, Math.PI / 2, Math.PI, Math.PI * 1.5],
                }),
              ]
            : [],
        marks: [
          decorativeMark(
            radialArc(track, {
              innerRadius: ({ radius }) => radius * 0.65,
              fill: tokens["--muted"],
              key: "name",
            }),
          ),
          radialArc(progress, {
            innerRadius: ({ radius }) => radius * 0.65,
            key: "name",
            fill: (row) => (row.name === "Direct" ? colors[1] : colors[0]),
            cornerRadius: variant === "Shape" ? 0 : 8,
            generator:
              variant === "Shape"
                ? ({ radius }) =>
                    arc<(typeof progress)[number]>()
                      .innerRadius(radius * 0.45)
                      .outerRadius(radius)
                      .cornerRadius(2)
                : undefined,
          }),
          ...(variant === "Concentric"
            ? [
                decorativeMark(
                  radialArc(track, {
                    innerRadius: ({ radius }) => radius * 0.4,
                    outerRadius: ({ radius }) => radius * 0.58,
                    fill: tokens["--muted"],
                    key: "name",
                  }),
                ),
                radialArc(
                  [
                    {
                      name: "Direct",
                      value: 55,
                      startAngle: 0,
                      endAngle: Math.PI * 1.1,
                    },
                  ],
                  {
                    innerRadius: ({ radius }) => radius * 0.4,
                    outerRadius: ({ radius }) => radius * 0.58,
                    fill: colors[1],
                    cornerRadius: 8,
                    key: "name",
                  },
                ),
              ]
            : []),
          ...(variant === "Text" || variant === "Label"
            ? [
                decorativeMark(
                  radialText(
                    [{ label: variant === "Text" ? "72% complete" : "72%" }],
                    {
                      angleScale: "guideAngle",
                      radiusScale: "guideRadius",
                      angle: 0,
                      radius: 0,
                      text: "label",
                      fill: tokens["--foreground"],
                      fontSize: variant === "Text" ? 16 : 22,
                      fontWeight: 600,
                      anchor: "middle",
                      baseline: "middle",
                    },
                  ),
                ),
              ]
            : []),
        ],
      }),
    ],
    scales: { x: null, y: null },
    tooltip: { use: tooltip, items: [{ field: "value", label: "name" }] },
  })

  const descriptions: Record<RadialVariant, string> = {
    Default: "Show progress as an arc over a track.",
    Grid: "Add circular and angular guides.",
    Label: "Show the value at the center.",
    // oxlint-disable-next-line quality/no-shape-in-symbol-names -- The variant name is a public example label.
    Shape: "Use a custom arc generator for a wider shape.",
    Stacked: "Stack source values within one arc.",
    Concentric: "Compare progress in separate concentric arcs.",
    Text: "Add a descriptive center label.",
  }

  return (
    <ExampleCard
      family="Radial"
      name={variant}
      description={descriptions[variant]}
    >
      <ChartContainer config={config}>
        <Chart
          ariaLabel={`${variant} radial chart`}
          definition={definition}
          height={260}
          renderTooltipBody={renderNamedTooltip}
        />
      </ChartContainer>
    </ExampleCard>
  )
}

export function PieRadarRadialExamples() {
  return (
    <Stack>
      <Box render={<section />} aria-label="Pie examples">
        <Stack>
          <Heading>Pie examples</Heading>
          <Text>Compare parts of a whole with pie and donut charts.</Text>
          <Grid xstyle={styles.grid}>
            {pieVariants.map((variant) => (
              <PieExample key={variant} variant={variant} />
            ))}
          </Grid>
          <ChartUsage type="pie" />
        </Stack>
      </Box>
      <Box render={<section />} aria-label="Radar examples">
        <Stack>
          <Heading>Radar examples</Heading>
          <Text>Compare measures across a shared radial scale.</Text>
          <Grid xstyle={styles.grid}>
            {radarVariants.map((variant) => (
              <RadarExample key={variant} variant={variant} />
            ))}
          </Grid>
          <ChartUsage type="radar" />
        </Stack>
      </Box>
      <Box render={<section />} aria-label="Radial examples">
        <Stack>
          <Heading>Radial examples</Heading>
          <Text>Show progress with angle-encoded arcs.</Text>
          <Grid xstyle={styles.grid}>
            {radialVariants.map((variant) => (
              <RadialExample key={variant} variant={variant} />
            ))}
          </Grid>
          <ChartUsage type="radial" />
        </Stack>
      </Box>
    </Stack>
  )
}
