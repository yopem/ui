"use client"

import type { FormEvent } from "react"

import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Grid } from "@registry/components/ui/grid"
import { Heading } from "@registry/components/ui/heading"
import { ScrollArea } from "@registry/components/ui/scroll-area"
import { Skeleton } from "@registry/components/ui/skeleton"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { Wrap } from "@registry/components/ui/wrap"
import { useEventCallback } from "@registry/hooks/use-event-callback"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { Link } from "@tanstack/react-router"
import { ArrowRight } from "lucide-react"
import { Suspense, useRef, useState } from "react"

import type { CatalogItem } from "./components"

import { catalog } from "./components"
import { DocumentationLayout } from "./docs-layout"
import { HomepagePreview } from "./homepage-preview"
import { navigationGroups } from "./navigation"

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
      default: "3.5rem",
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
  sections: { gap: "3rem" },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
    scrollMarginBlockStart: "5rem",
  },
  sectionTitle: { fontSize: "1.5rem" },
  sectionLinks: { gap: "0.5rem", paddingBlockEnd: "2rem" },
  sectionLink: {
    borderColor: tokens["--border"],
    borderStyle: "solid",
    borderWidth: 1,
    borderRadius: tokens["--radius-md"],
    color: tokens["--foreground"],
    fontSize: "0.875rem",
    paddingBlock: "0.625rem",
    paddingInline: "1rem",
    textDecoration: "none",
    ":hover": { backgroundColor: tokens["--accent"] },
    ":focus-visible": {
      outlineColor: tokens["--ring"],
      outlineStyle: "solid",
      outlineWidth: 2,
      outlineOffset: 4,
    },
  },
  gallery: {
    gridTemplateColumns: {
      default: "repeat(3, minmax(0, 1fr))",
      "@media (max-width: 1199.98px)": "repeat(2, minmax(0, 1fr))",
      "@media (max-width: 767.98px)": "minmax(0, 1fr)",
    },
    gap: "1rem",
    alignItems: "stretch",
  },
  card: {
    backgroundColor: tokens["--card"],
    color: tokens["--card-foreground"],
    borderColor: tokens["--border"],
    borderStyle: "solid",
    borderWidth: 1,
    borderRadius: tokens["--radius-md"],
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  mutedCard: { backgroundColor: tokens["--muted"] },
  previewScroll: { flexGrow: 1, maxBlockSize: "28rem" },
  preview: {
    padding: { default: "1.5rem", "@media (max-width: 639.98px)": "1rem" },
    alignItems: "safe center",
    justifyContent: "safe center",
    minBlockSize: "12rem",
    gap: "1rem",
  },
  loading: { blockSize: "9rem", inlineSize: "100%" },
  caption: { padding: "1.25rem", gap: "0.375rem" },
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
    borderRadius: tokens["--radius-md"],
    ":hover": { textDecorationColor: tokens["--foreground"] },
    ":focus-visible": {
      outlineColor: tokens["--ring"],
      outlineStyle: "solid",
      outlineWidth: 2,
      outlineOffset: 4,
    },
  },
})

type ShowcaseItem = CatalogItem & { params: { name: string } }

const featuredSlugs = new Map(
  ["form", "calendar", "card"].map((slug, index) => [slug, index]),
)

const showcaseGroups = navigationGroups
  .filter((group) =>
    ["Components", "Layout", "Typography"].includes(group.name),
  )
  .map((group) => ({
    title: group.name,
    id: group.name.toLowerCase(),
    items: catalog
      .filter((item) =>
        group.pages.some((page) => page.url === `/components/${item.slug}`),
      )
      .map((item) => ({ ...item, params: { name: item.slug } }))
      .toSorted(
        (left, right) =>
          (featuredSlugs.get(left.slug) ?? featuredSlugs.size) -
          (featuredSlugs.get(right.slug) ?? featuredSlugs.size),
      ),
  }))

export function ShowcaseCard({
  item,
  muted,
}: {
  item: ShowcaseItem
  muted: boolean
}) {
  const id = `showcase-${item.slug}`
  const [submitted, setSubmitted] = useState(false)
  const [visible, setVisible] = useState(() => featuredSlugs.has(item.slug))
  const previewObserver = useRef<IntersectionObserver | null>(null)

  const observePreview = useEventCallback((node: HTMLElement | null) => {
    previewObserver.current?.disconnect()
    previewObserver.current = null

    if (!node || visible) return

    if (!("IntersectionObserver" in window)) {
      setVisible(true)

      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: "400px" },
    )

    previewObserver.current = observer
    observer.observe(node)
  })

  const handleSubmit = useEventCallback((event: FormEvent<HTMLElement>) => {
    if (event.defaultPrevented) return

    event.preventDefault()
    setSubmitted(true)
  })

  return (
    <Box
      render={<section aria-labelledby={id} />}
      onSubmit={handleSubmit}
      ref={observePreview}
      xstyle={[styles.card, muted && styles.mutedCard]}
    >
      <Stack xstyle={styles.caption}>
        <Heading
          render={<h3 id={id}>{item.title}</h3>}
          xstyle={styles.cardTitle}
        />
        <Text xstyle={styles.cardDescription}>
          {item.preview?.title ?? `${item.title} in use`}
        </Text>
        <Link
          to="/components/$name"
          params={item.params}
          {...stylex.props(styles.link)}
        >
          {item.title} source and API
        </Link>
      </Stack>
      <ScrollArea
        aria-label={`${item.title} live preview`}
        clampContentMinWidth={false}
        overscrollContain
        xstyle={styles.previewScroll}
      >
        <Stack data-testid="homepage-preview" xstyle={styles.preview}>
          <Suspense
            fallback={
              <Box
                render={<output aria-label={`Loading ${item.title} preview`} />}
              >
                <Skeleton xstyle={styles.loading} />
              </Box>
            }
          >
            {visible ? (
              <HomepagePreview item={item} />
            ) : (
              <Box
                render={<output aria-label={`Loading ${item.title} preview`} />}
              >
                <Skeleton xstyle={styles.loading} />
              </Box>
            )}
          </Suspense>
        </Stack>
      </ScrollArea>
      {submitted ? (
        <Box
          render={<output />}
          xstyle={[styles.caption, styles.cardDescription]}
        >
          Example submitted. No data was sent.
        </Box>
      ) : null}
    </Box>
  )
}

export function Introduction() {
  return (
    <DocumentationLayout navigation={false}>
      <Box xstyle={styles.page}>
        <Box render={<header />} xstyle={styles.hero}>
          <Heading
            render={<h1>StyleX React components you copy, own, and change.</h1>}
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
        <Box render={<nav aria-label="Homepage sections" />}>
          <Wrap xstyle={styles.sectionLinks}>
            {showcaseGroups.map((group) => (
              <a
                key={group.id}
                href={`#${group.id}`}
                {...stylex.props(styles.sectionLink)}
              >
                {group.title} ({group.items.length})
              </a>
            ))}
          </Wrap>
        </Box>
        <Stack xstyle={styles.sections}>
          {showcaseGroups.map((group) => (
            <Box
              key={group.id}
              render={<section id={group.id} />}
              xstyle={styles.section}
            >
              <Heading
                render={<h2>{group.title}</h2>}
                xstyle={styles.sectionTitle}
              />
              <Grid xstyle={styles.gallery}>
                {group.items.map((item, index) => (
                  <ShowcaseCard
                    key={item.slug}
                    item={item}
                    muted={index % 4 === 0}
                  />
                ))}
              </Grid>
            </Box>
          ))}
        </Stack>
      </Box>
    </DocumentationLayout>
  )
}
