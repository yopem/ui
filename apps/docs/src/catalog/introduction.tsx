"use client"

import type { FormEvent } from "react"

import { AspectRatio } from "@registry/components/ui/aspect-ratio"
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
    paddingBlockEnd: "4rem",
  },
  hero: {
    display: "flex",
    flexDirection: "column",
    paddingBlock: {
      default: "6rem",
      "@media (max-width: 639.98px)": "3rem",
    },
    gap: "1.5rem",
    alignItems: "flex-start",
  },
  title: {
    maxInlineSize: "22ch",
    fontFamily: tokens["--font-heading"],
    fontSize: { default: "4.5rem", "@media (max-width: 639.98px)": "2.75rem" },
    fontWeight: 400,
    letterSpacing: "-0.04em",
    lineHeight: 1.05,
    textWrap: "balance",
  },
  actions: { gap: "0.75rem", marginBlockStart: "1rem" },
  action: { minBlockSize: "3rem", paddingInline: "1.5rem" },
  sections: { gap: "4rem" },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
    scrollMarginBlockStart: "5rem",
  },
  sectionTitle: {
    fontSize: "1.875rem",
    fontWeight: 400,
    letterSpacing: "-0.02em",
  },
  sectionLinks: { gap: "0.5rem", paddingBlockEnd: "3rem" },
  sectionLink: {
    borderColor: tokens["--border"],
    borderStyle: "solid",
    borderWidth: 1,
    borderRadius: tokens["--radius"],
    color: tokens["--muted-foreground"],
    fontSize: "0.875rem",
    paddingBlock: "0.625rem",
    paddingInline: "1rem",
    textDecoration: "none",
    ":hover": {
      backgroundColor: tokens["--accent"],
      color: tokens["--accent-foreground"],
    },
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
    gap: "2rem",
    alignItems: "stretch",
  },
  card: {
    color: tokens["--foreground"],
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  previewFrame: {
    backgroundColor: tokens["--muted"],
    borderColor: tokens["--card-border"],
    borderStyle: "solid",
    borderWidth: 1,
    borderRadius: tokens["--radius"],
    overflow: "hidden",
  },
  previewScroll: { blockSize: "100%" },
  preview: {
    padding: { default: "1.5rem", "@media (max-width: 639.98px)": "1rem" },
    alignItems: "safe center",
    justifyContent: "safe center",
    minBlockSize: "100%",
    gap: "1rem",
  },
  loading: { blockSize: "9rem", inlineSize: "100%" },
  caption: { gap: "0.25rem" },
  cardTitle: { fontSize: "1.25rem", fontWeight: 400, lineHeight: 1.4 },
  cardDescription: {
    color: tokens["--muted-foreground"],
    fontSize: "1rem",
    lineHeight: 1.5,
  },
  link: {
    alignItems: "center",
    alignSelf: "flex-start",
    color: {
      default: tokens["--foreground"],
      ":hover": tokens["--muted-foreground"],
    },
    display: "inline-flex",
    fontSize: "1rem",
    gap: "0.5rem",
    marginBlockStart: "0.5rem",
    textDecorationLine: "none",
    borderRadius: tokens["--radius-sm"],
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

export function ShowcaseCard({ item }: { item: ShowcaseItem }) {
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
      xstyle={styles.card}
    >
      <AspectRatio ratio={1} xstyle={styles.previewFrame}>
        <ScrollArea
          aria-label={`${item.title} live preview`}
          clampContentMinWidth={false}
          fill
          overscrollContain
          xstyle={styles.previewScroll}
        >
          <Stack data-testid="homepage-preview" xstyle={styles.preview}>
            <Suspense
              fallback={
                <Box
                  render={
                    <output aria-label={`Loading ${item.title} preview`} />
                  }
                >
                  <Skeleton xstyle={styles.loading} />
                </Box>
              }
            >
              {visible ? (
                <HomepagePreview item={item} />
              ) : (
                <Box
                  render={
                    <output aria-label={`Loading ${item.title} preview`} />
                  }
                >
                  <Skeleton xstyle={styles.loading} />
                </Box>
              )}
            </Suspense>
          </Stack>
        </ScrollArea>
      </AspectRatio>
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
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </Stack>
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
                {group.items.map((item) => (
                  <ShowcaseCard key={item.slug} item={item} />
                ))}
              </Grid>
            </Box>
          ))}
        </Stack>
      </Box>
    </DocumentationLayout>
  )
}
