"use client"

import { AbsoluteCenter } from "@registry/components/ui/absolute-center"
import { Bleed } from "@registry/components/ui/bleed"
import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Center } from "@registry/components/ui/center"
import { Container } from "@registry/components/ui/container"
import { Flex } from "@registry/components/ui/flex"
import { Float } from "@registry/components/ui/float"
import { Grid } from "@registry/components/ui/grid"
import { Heading } from "@registry/components/ui/heading"
import { HStack } from "@registry/components/ui/hstack"
import { Label } from "@registry/components/ui/label"
import { Link } from "@registry/components/ui/link"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { VStack } from "@registry/components/ui/vstack"
import { Wrap } from "@registry/components/ui/wrap"
import * as stylex from "@stylexjs/stylex"
import { Link as RouterLink } from "@tanstack/react-router"
import { useRef, useState, useCallback } from "react"

const styles = stylex.create({
  layoutRoot: {
    gap: "calc(var(--spacing) * 4)",
    paddingBlock: "calc(var(--spacing) * 4)",
    paddingInline: "calc(var(--spacing) * 4)",
  },
  box: {
    paddingBlock: "calc(var(--spacing) * 2)",
    paddingInline: "calc(var(--spacing) * 2)",
  },
  flex: {
    alignItems: "center",
    flexDirection: "row",
    gap: "calc(var(--spacing) * 3)",
  },
  rtlFlex: { flexDirection: "row", gap: "calc(var(--spacing) * 2)" },
  responsiveTag: {
    display: { default: "block", "@media (min-width: 768px)": "flex" },
  },
  overrideHstack: { gap: "5px", justifyContent: "flex-end" },
  grid: {
    gap: "calc(var(--spacing) * 4)",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  },
  center: { minBlockSize: "4rem" },
  container: { maxInlineSize: "60rem", paddingInline: "24px" },
  positioned: { position: "relative", minBlockSize: "6rem" },
  padded: { paddingInline: "1rem" },
})

export function Preview() {
  const linkRef = useRef<HTMLAnchorElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const textRef = useRef<HTMLParagraphElement>(null)
  const [textTag, setTextTag] = useState("Not inspected")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setSubmitted(true)
    },
    [setSubmitted],
  )

  const focusName = useCallback(() => nameRef.current?.focus(), [nameRef])

  const inspectRefs = useCallback(
    () =>
      setTextTag(
        `${textRef.current?.tagName ?? "missing"} ${linkRef.current?.tagName ?? "missing"}`,
      ),
    [setTextTag, textRef, linkRef],
  )

  return (
    <Stack data-testid="layout-root" xstyle={styles.layoutRoot}>
      <Box as="section" data-testid="box" xstyle={styles.box}>
        <Heading as="h1" data-testid="heading-h1" id="page-title">
          Layout primitives
        </Heading>
        <Heading data-testid="preserved-heading">Semantic content</Heading>
        <Heading as="h3" data-testid="heading-h3">
          Third-level heading
        </Heading>
        <Heading as="h4" data-testid="heading-h4">
          Fourth-level heading
        </Heading>
        <Heading as="h5" data-testid="heading-h5">
          Fifth-level heading
        </Heading>
        <Heading as="h6" data-testid="heading-h6">
          Sixth-level heading
        </Heading>
        <Text ref={textRef} data-testid="text-ref">
          Text content keeps its native p element.
        </Text>
        <Text data-testid="text-secondary">
          Layout primitives keep document semantics explicit.
        </Text>
        <Link ref={linkRef} data-testid="native-link" href="#destination">
          Go to destination
        </Link>
        <Link
          render={<RouterLink to="/docs/installation" />}
          data-testid="router-link"
        >
          Read docs
        </Link>
      </Box>
      <Flex xstyle={styles.flex} data-testid="flex">
        <Box as="span">One</Box>
        <Box as="span">Two</Box>
      </Flex>
      <Flex data-testid="rtl-flex" dir="rtl" xstyle={styles.rtlFlex}>
        <Box as="span">يمين</Box>
        <Box as="span">يسار</Box>
      </Flex>
      <Box data-testid="responsive-tag" xstyle={styles.responsiveTag}>
        Responsive layout
      </Box>
      <VStack data-testid="vstack">
        <Box as="span">Vertical one</Box>
        <Box as="span">Vertical two</Box>
      </VStack>
      <HStack data-testid="hstack">
        <Box as="span">Horizontal one</Box>
        <Box as="span">Horizontal two</Box>
      </HStack>
      <HStack data-testid="override-hstack" xstyle={styles.overrideHstack}>
        <Box as="span">Overridden layout</Box>
      </HStack>
      <Stack data-testid="stack">
        <Box as="span">Stack one</Box>
        <Box as="span">Stack two</Box>
      </Stack>
      <Grid data-testid="grid" xstyle={styles.grid}>
        <Box as="span">Grid one</Box>
        <Box as="span">Grid two</Box>
      </Grid>
      <Center data-testid="center" xstyle={styles.center}>
        <Box as="span">Centered</Box>
      </Center>
      <Container data-testid="container" xstyle={styles.container}>
        Constrained content
      </Container>
      <Container data-testid="fluid-container" fluid>
        Fluid content
      </Container>
      <Box data-testid="positioned-layout" xstyle={styles.positioned}>
        <AbsoluteCenter data-testid="absolute-center">Middle</AbsoluteCenter>
        <Float data-testid="float" placement="top-end">
          Corner
        </Float>
      </Box>
      <Box
        data-testid="rtl-positioned-layout"
        dir="rtl"
        xstyle={styles.positioned}
      >
        <AbsoluteCenter data-testid="rtl-absolute-center">
          RTL middle
        </AbsoluteCenter>
        <Float data-testid="rtl-float" placement="top-center">
          RTL top
        </Float>
      </Box>
      <Box data-testid="padded-layout" xstyle={styles.padded}>
        <Bleed data-testid="bleed">Bleeding content</Bleed>
      </Box>
      <Wrap data-testid="wrap">
        <Box as="span">One</Box>
        <Box as="span">Two</Box>
        <Box as="span">Three</Box>
      </Wrap>
      <Box as="form" data-testid="native-form" onSubmit={handleSubmit}>
        <Label htmlFor="layout-name">Name</Label>
        <Box
          as="input"
          id="layout-name"
          name="name"
          ref={nameRef}
          required
          type="text"
        />
        <Button data-testid="focus-name" onClick={focusName} type="button">
          Focus name
        </Button>
        <Button data-testid="inspect-refs" onClick={inspectRefs} type="button">
          Inspect refs
        </Button>
        <Button data-testid="submit-form" type="submit">
          Submit
        </Button>
      </Box>
      <Text aria-live="polite" data-testid="submit-status">
        {submitted ? "Submitted" : "Not submitted"}
      </Text>
      <Text data-testid="text-ref-status">{textTag}</Text>
      <Box as="div" data-testid="destination" id="destination" tabIndex={-1}>
        Destination
      </Box>
    </Stack>
  )
}
