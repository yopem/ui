"use client"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@registry/components/ui/avatar"
import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Clipboard } from "@registry/components/ui/clipboard"
import { Heading } from "@registry/components/ui/heading"
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
} from "@registry/components/ui/message"
import { Spinner } from "@registry/components/ui/spinner"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { useEventCallback } from "@registry/hooks/use-event-callback"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import {
  CopyIcon,
  RefreshCcwIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "lucide-react"
import { useState } from "react"

const photos = {
  CB: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=96&h=96&fit=crop",
  YO: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=96&h=96&fit=crop",
}

const response = "I can send the notes this afternoon."

const styles = stylex.create({
  examples: { inlineSize: "100%", maxInlineSize: "36rem", gap: "2rem" },
  section: { display: "flex", flexDirection: "column", gap: "1rem" },
  title: { fontSize: "1rem", fontWeight: 600 },
  bubble: {
    backgroundColor: tokens["--muted"],
    borderRadius: tokens["--radius"],
    color: tokens["--foreground"],
    paddingBlock: "0.625rem",
    paddingInline: "0.875rem",
  },
  reply: {
    backgroundColor: tokens["--accent-solid"],
    color: tokens["--accent-solid-foreground"],
  },
  fallback: {
    backgroundColor: tokens["--accent-solid"],
    color: tokens["--accent-solid-foreground"],
  },
  text: { color: "inherit", fontSize: "0.875rem", lineHeight: 1.5 },
  media: {
    aspectRatio: "16 / 9",
    borderRadius: tokens["--radius-sm"],
    display: "block",
    inlineSize: "100%",
    maxInlineSize: "16rem",
    objectFit: "cover",
  },
  link: {
    color: tokens["--foreground"],
    fontSize: "0.875rem",
    textDecoration: "underline",
    textUnderlineOffset: "0.2em",
    ":focus-visible": {
      outlineColor: tokens["--ring"],
      outlineStyle: "solid",
      outlineWidth: 2,
      outlineOffset: 2,
    },
  },
  thumbnail: { inlineSize: "100%", maxInlineSize: "16rem", gap: "0.75rem" },
})

function MessagePortrait({ initials }: { initials: keyof typeof photos }) {
  return (
    <MessageAvatar aria-hidden="true">
      <Avatar>
        <AvatarImage alt="" src={photos[initials]} />
        <AvatarFallback xstyle={styles.fallback}>{initials}</AvatarFallback>
      </Avatar>
    </MessageAvatar>
  )
}

function MessageActions() {
  const [reaction, setReaction] = useState<"like" | "dislike" | null>(null)
  const [sent, setSent] = useState(false)

  const handleLike = useEventCallback(() => {
    setReaction((current) => (current === "like" ? null : "like"))
  })

  const handleDislike = useEventCallback(() => {
    setReaction((current) => (current === "dislike" ? null : "dislike"))
  })

  const handleRetry = useEventCallback(() => {
    setSent(true)
  })

  return (
    <>
      <Message>
        <MessageContent>
          <Box xstyle={styles.bubble}>
            <Text xstyle={styles.text}>{response}</Text>
          </Box>
          <MessageFooter>
            <Clipboard aria-label="Copy message" value={response}>
              <CopyIcon size={16} aria-hidden="true" />
            </Clipboard>
            <Button
              aria-label="Like message"
              aria-pressed={reaction === "like"}
              onClick={handleLike}
              size="icon"
              variant={reaction === "like" ? "secondary" : "ghost"}
            >
              <ThumbsUpIcon size={16} aria-hidden="true" />
            </Button>
            <Button
              aria-label="Dislike message"
              aria-pressed={reaction === "dislike"}
              onClick={handleDislike}
              size="icon"
              variant={reaction === "dislike" ? "secondary" : "ghost"}
            >
              <ThumbsDownIcon size={16} aria-hidden="true" />
            </Button>
          </MessageFooter>
        </MessageContent>
      </Message>
      <Message align="end">
        <MessageContent>
          <Box xstyle={[styles.bubble, styles.reply]}>
            <Text xstyle={styles.text}>Please send them to the team.</Text>
          </Box>
          <MessageFooter>
            <output>{sent ? "Sent" : "Failed to send"}</output>
            <Button
              aria-disabled={sent}
              aria-label="Retry send"
              onClick={handleRetry}
              size="icon"
              variant="ghost"
            >
              <RefreshCcwIcon size={16} aria-hidden="true" />
            </Button>
          </MessageFooter>
        </MessageContent>
      </Message>
    </>
  )
}

export function MessageThumbnail() {
  return (
    <Stack xstyle={styles.thumbnail}>
      <Message>
        <MessagePortrait initials="CB" />
        <MessageContent>
          <Box xstyle={styles.bubble}>
            <Text xstyle={styles.text}>Are the notes ready?</Text>
          </Box>
        </MessageContent>
      </Message>
      <Message align="end">
        <MessagePortrait initials="YO" />
        <MessageContent>
          <Box xstyle={[styles.bubble, styles.reply]}>
            <Text xstyle={styles.text}>I’ll send them shortly.</Text>
          </Box>
        </MessageContent>
      </Message>
    </Stack>
  )
}

export function Preview() {
  return (
    <Stack xstyle={styles.examples}>
      <Box render={<section />} xstyle={styles.section}>
        <Heading render={<h3>Basic conversation</h3>} xstyle={styles.title} />
        <MessageThumbnail />
      </Box>
      <Box render={<section />} xstyle={styles.section}>
        <Heading render={<h3>Avatar</h3>} xstyle={styles.title} />
        <Message>
          <MessagePortrait initials="CB" />
          <MessageContent>
            <MessageHeader>Casey</MessageHeader>
            <Box xstyle={styles.bubble}>
              <Text xstyle={styles.text}>Hello from the field station.</Text>
            </Box>
          </MessageContent>
        </Message>
        <Message align="end">
          <MessagePortrait initials="YO" />
          <MessageContent>
            <MessageHeader>You</MessageHeader>
            <Box xstyle={[styles.bubble, styles.reply]}>
              <Text xstyle={styles.text}>Good to hear from you.</Text>
            </Box>
          </MessageContent>
        </Message>
      </Box>
      <Box render={<section />} xstyle={styles.section}>
        <Heading render={<h3>Group</h3>} xstyle={styles.title} />
        <MessageGroup>
          <Message>
            <MessageAvatar aria-hidden="true" />
            <MessageContent>
              <MessageHeader>Casey</MessageHeader>
              <Box xstyle={styles.bubble}>
                <Text xstyle={styles.text}>The survey is complete.</Text>
              </Box>
            </MessageContent>
          </Message>
          <Message>
            <MessagePortrait initials="CB" />
            <MessageContent>
              <Box xstyle={styles.bubble}>
                <Text xstyle={styles.text}>I’ll share the results today.</Text>
              </Box>
            </MessageContent>
          </Message>
        </MessageGroup>
      </Box>
      <Box render={<section />} xstyle={styles.section}>
        <Heading render={<h3>Header and footer</h3>} xstyle={styles.title} />
        <Message>
          <MessageContent>
            <MessageHeader>
              Casey · <time dateTime="2026-01-15T09:30">9:30 AM</time>
            </MessageHeader>
            <Box xstyle={styles.bubble}>
              <Text xstyle={styles.text}>
                The meeting starts in ten minutes.
              </Text>
            </Box>
            <MessageFooter>Delivered</MessageFooter>
          </MessageContent>
        </Message>
      </Box>
      <Box render={<section />} xstyle={styles.section}>
        <Heading render={<h3>Actions</h3>} xstyle={styles.title} />
        <MessageActions />
      </Box>
      <Box render={<section />} xstyle={styles.section}>
        <Heading render={<h3>Attachment</h3>} xstyle={styles.title} />
        <Message align="end">
          <MessageContent>
            <img
              alt="Desks in the team workspace"
              height={144}
              loading="lazy"
              src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=512&auto=format&fit=crop&q=80"
              width={256}
              {...stylex.props(styles.media)}
            />
            <Box xstyle={[styles.bubble, styles.reply]}>
              <Text xstyle={styles.text}>
                Please add this photo to the report.
              </Text>
            </Box>
          </MessageContent>
        </Message>
        <Message>
          <MessageContent>
            <Box xstyle={styles.bubble}>
              <Text xstyle={styles.text}>Here are the meeting notes.</Text>
              <a
                download="Meeting notes.txt"
                href="data:text/plain;charset=utf-8,Meeting%20notes%0A"
                {...stylex.props(styles.link)}
              >
                Meeting notes.txt
              </a>
            </Box>
          </MessageContent>
        </Message>
      </Box>
      <Box render={<section />} xstyle={styles.section}>
        <Heading render={<h3>Status updates</h3>} xstyle={styles.title} />
        <Message>
          <MessageContent>
            <MessageFooter>
              <Spinner aria-label="Checking the logs" size={16} />
              <Box render={<span aria-hidden="true" />}>Checking the logs…</Box>
            </MessageFooter>
          </MessageContent>
        </Message>
      </Box>
    </Stack>
  )
}
