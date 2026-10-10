import type { ReactNode } from "react"

import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Grid } from "@registry/components/ui/grid"
import { Heading } from "@registry/components/ui/heading"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { Wrap } from "@registry/components/ui/wrap"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { Link } from "@tanstack/react-router"
import { ArrowRight } from "lucide-react"

import { DocumentationLayout } from "./docs-layout"
import { Preview as AccordionPreview } from "./previews/accordion"
import { Preview as CalendarPreview } from "./previews/calendar"
import { Preview as FormPreview } from "./previews/form"
import { Preview as MenuPreview } from "./previews/menu"
import { Preview as SelectPreview } from "./previews/select"
import { Preview as SwitchPreview } from "./previews/switch"
import { Preview as ToggleGroupPreview } from "./previews/toggle-group"

const styles = stylex.create({
  page: {
    maxInlineSize: "90rem",
    marginInline: "auto",
    paddingInline: { default: "2rem", "@media (max-width: 639.98px)": "1rem" },
    paddingBlockEnd: "2rem",
  },
  hero: {
    display: "flex",
    flexDirection: "column",
    paddingBlock: {
      default: "4.5rem",
      "@media (max-width: 639.98px)": "2.5rem",
    },
    gap: "1.5rem",
    alignItems: "flex-start",
  },
  title: {
    maxInlineSize: "24ch",
    fontFamily: tokens["--font-heading"],
    fontSize: { default: "3.5rem", "@media (max-width: 639.98px)": "2.5rem" },
    fontWeight: 650,
    letterSpacing: "-0.045em",
    lineHeight: 1.08,
    textWrap: "balance",
  },
  actions: { gap: "0.75rem" },
  action: { minBlockSize: "2.75rem" },
  gallery: {
    gridTemplateColumns: {
      default: "repeat(4, minmax(0, 1fr))",
      "@media (max-width: 1099.98px)": "repeat(2, minmax(0, 1fr))",
      "@media (max-width: 639.98px)": "minmax(0, 1fr)",
    },
    gap: "1rem",
    alignItems: "stretch",
  },
  wide: {
    gridColumn: { default: "span 2", "@media (max-width: 639.98px)": "auto" },
  },
  card: {
    backgroundColor: tokens["--card"],
    color: tokens["--card-foreground"],
    borderColor: tokens["--border"],
    borderStyle: "solid",
    borderWidth: 1,
    borderRadius: tokens["--radius-xl"],
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  mutedCard: { backgroundColor: tokens["--muted"] },
  preview: {
    flexGrow: 1,
    padding: { default: "1.75rem", "@media (max-width: 639.98px)": "1rem" },
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minBlockSize: "9rem",
  },
  calendarPreview: {
    padding: { default: "1.75rem", "@media (max-width: 639.98px)": "0.125rem" },
  },
  caption: {
    padding: "1.25rem",
    borderBlockStartColor: tokens["--border"],
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: 1,
    gap: "0.375rem",
  },
  cardTitle: { fontSize: "0.9375rem", fontWeight: 600, lineHeight: 1.4 },
  cardDescription: {
    color: tokens["--muted-foreground"],
    fontSize: "0.8125rem",
    lineHeight: 1.5,
  },
  link: {
    color: tokens["--foreground"],
    fontSize: "0.8125rem",
    textDecoration: "underline",
    textDecorationColor: tokens["--border"],
    textUnderlineOffset: "0.25em",
    borderRadius: tokens["--radius-sm"],
    ":hover": { textDecorationColor: tokens["--foreground"] },
    ":focus-visible": {
      outlineColor: tokens["--ring"],
      outlineStyle: "solid",
      outlineWidth: 2,
      outlineOffset: 4,
    },
  },
})

const showcaseParams = {
  form: { name: "form" },
  calendar: { name: "calendar" },
  accordion: { name: "accordion" },
  "toggle-group": { name: "toggle-group" },
  select: { name: "select" },
  button: { name: "button" },
  menu: { name: "menu" },
  switch: { name: "switch" },
}

export function ShowcaseCard({
  title,
  slug,
  description,
  wide = false,
  surface = "card",
  children,
}: {
  title: string
  slug: keyof typeof showcaseParams
  description: string
  wide?: boolean
  surface?: "card" | "muted"
  children: ReactNode
}) {
  const id = `showcase-${slug}`

  return (
    <Box
      render={<section />}
      aria-labelledby={id}
      xstyle={[
        styles.card,
        wide && styles.wide,
        surface === "muted" && styles.mutedCard,
      ]}
    >
      <Box
        xstyle={[styles.preview, slug === "calendar" && styles.calendarPreview]}
      >
        {children}
      </Box>
      <Stack xstyle={styles.caption}>
        <Heading render={<h2>{title}</h2>} id={id} xstyle={styles.cardTitle}>
          {title}
        </Heading>
        <Text xstyle={styles.cardDescription}>{description}</Text>
        <Link
          to="/components/$name"
          params={showcaseParams[slug]}
          {...stylex.props(styles.link)}
        >
          {title} source and API
        </Link>
      </Stack>
    </Box>
  )
}

export function Introduction() {
  return (
    <DocumentationLayout navigation={false}>
      <Box xstyle={styles.page}>
        <Box render={<header />} xstyle={styles.hero}>
          <Heading
            render={<h1>Stylex React components you copy, own, and change.</h1>}
            xstyle={styles.title}
          />
          <Wrap xstyle={styles.actions}>
            <Button
              size="lg"
              xstyle={styles.action}
              render={<Link to="/docs/getting-started" />}
            >
              Get started
              <ArrowRight size={16} aria-hidden="true" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              xstyle={styles.action}
              render={<Link to="/components" />}
            >
              Browse components
            </Button>
          </Wrap>
        </Box>
        <Grid xstyle={styles.gallery}>
          <ShowcaseCard
            title="Form validation"
            slug="form"
            description="Inputs, labels, and built-in validation."
            surface="muted"
            wide
          >
            <FormPreview />
          </ShowcaseCard>
          <ShowcaseCard
            title="Calendar"
            slug="calendar"
            description="Choose a date. Change the month."
            wide
          >
            <CalendarPreview />
          </ShowcaseCard>
          <ShowcaseCard
            title="Accordion"
            slug="accordion"
            description="Answers that open when you need them."
            wide
          >
            <AccordionPreview />
          </ShowcaseCard>
          <ShowcaseCard
            title="Text formatting"
            slug="toggle-group"
            description="Choose your text styles."
          >
            <ToggleGroupPreview />
          </ShowcaseCard>
          <ShowcaseCard
            title="Select"
            slug="select"
            description="Choose a framework with pointer or keyboard."
            surface="muted"
          >
            <SelectPreview />
          </ShowcaseCard>
          <ShowcaseCard
            title="Dropdown menu"
            slug="menu"
            description="Open a menu of playback actions and settings."
            surface="muted"
            wide
          >
            <MenuPreview />
          </ShowcaseCard>
          <ShowcaseCard
            title="Buttons"
            slug="button"
            description="Different styles. Clear actions."
          >
            <Stack>
              <Button render={<Link to="/docs/installation" />}>
                Install components
                <ArrowRight size={16} aria-hidden="true" />
              </Button>
              <Button variant="outline" render={<Link to="/docs/styling" />}>
                Explore styles
              </Button>
              <Button
                variant="ghost"
                size="sm"
                render={<Link to="/docs/theming" />}
              >
                Change your theme
              </Button>
            </Stack>
          </ShowcaseCard>
          <ShowcaseCard
            title="Email preferences"
            slug="switch"
            description="Settings you can change with one switch."
          >
            <SwitchPreview />
          </ShowcaseCard>
        </Grid>
      </Box>
    </DocumentationLayout>
  )
}
