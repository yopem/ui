"use client"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@registry/components/ui/avatar"
import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Flex } from "@registry/components/ui/flex"
import { Heading } from "@registry/components/ui/heading"
import { Skeleton } from "@registry/components/ui/skeleton"
import * as stylex from "@stylexjs/stylex"
import { UserRoundPlusIcon, UsersRoundIcon } from "lucide-react"
import { useLayoutEffect, useState } from "react"

const styles = stylex.create({
  avatar: { inlineSize: "calc(0.25rem * 10)", blockSize: "calc(0.25rem * 10)" },
  flex: {
    minInlineSize: "0px",
    flex: "1",
    flexDirection: "column",
    gap: "0.25rem",
  },
  h4: {
    overflow: "hidden",
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: "1",
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: "500",
  },
  flex2: {
    alignItems: "center",
    gap: "calc(0.25rem * 3)",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--muted-foreground)",
  },
  span: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  flex3: { minInlineSize: "0px", alignItems: "center", gap: "0.25rem" },
  span2: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  span3: { display: { "@media (max-width: 767.98px)": "none" } },
  skeleton: {
    inlineSize: "calc(0.25rem * 10)",
    blockSize: "calc(0.25rem * 10)",
    borderRadius: "calc(infinity * 1px)",
  },
  flex4: { flex: "1", flexDirection: "column" },
  skeleton2: {
    marginBlock: "calc(0.25rem * 0.5)",
    blockSize: "calc(0.25rem * 4)",
    maxInlineSize: "calc(0.25rem * 54)",
  },
  flex5: {
    maxInlineSize: "calc(0.25rem * 54)",
    alignItems: "center",
    gap: "0.25rem",
  },
  skeleton3: {
    marginBlock: "calc(0.25rem * 0.5)",
    blockSize: "calc(0.25rem * 4)",
    inlineSize: "calc(1 / 2 * 100%)",
  },
  skeleton4: {
    marginBlock: "calc(0.25rem * 0.5)",
    blockSize: "calc(0.25rem * 4)",
    inlineSize: "calc(1 / 2 * 100%)",
  },
  skeleton5: {
    blockSize: {
      default: "calc(0.25rem * 7)",
      "@media (min-width: 768px)": "calc(0.25rem * 6)",
    },
    inlineSize: {
      default: "calc(0.25rem * 19)",
      "@media (min-width: 768px)": "calc(0.25rem * 17)",
    },
  },
  flex6: {
    inlineSize: "100%",
    maxInlineSize: "calc(0.25rem * 92)",
    flexDirection: "column",
    gap: "calc(0.25rem * 6)",
  },
  flex7: { alignItems: "center", gap: "calc(0.25rem * 4)" },
})

const users = [
  {
    delay: 3000,
    fallback: "SJ",
    followers: "15k",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&dpr=2&q=80",
    name: "Sarah Johnson",
    role: "Design Engineer",
  },
  {
    delay: 4000,
    fallback: "MA",
    followers: "8k",
    image:
      "https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=80&h=80&dpr=2&q=80",
    name: "Mark Bennett Andersson",
    role: "Product Designer",
  },
  {
    delay: 3400,
    fallback: "AR",
    followers: "12k",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&dpr=2&q=80",
    name: "Alex Rivera",
    role: "UI/UX Designer",
  },
]

function UserCard({ delay, user }: { delay: number; user: (typeof users)[0] }) {
  const [isLoaded, setIsLoaded] = useState(false)

  useLayoutEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), delay)

    return () => clearTimeout(timer)
  }, [delay])

  if (!isLoaded) {
    return <UserCardSkeleton />
  }

  return (
    <>
      <Avatar xstyle={styles.avatar}>
        <AvatarImage alt={user.name} src={user.image} />
        <AvatarFallback>{user.fallback}</AvatarFallback>
      </Avatar>
      <Flex xstyle={styles.flex}>
        <Heading as="h4" xstyle={styles.h4}>
          {user.name}
        </Heading>
        <Flex xstyle={styles.flex2}>
          <Box as="span" xstyle={styles.span}>
            {user.role}
          </Box>
          <Flex xstyle={styles.flex3}>
            <UsersRoundIcon {...stylex.props(previewStyles.preview7)} />
            <Box as="span" xstyle={styles.span2}>
              {user.followers}
              <Box as="span" xstyle={styles.span3}>
                {" "}
                followers
              </Box>
            </Box>
          </Flex>
        </Flex>
      </Flex>
      <Button size="xs">
        <UserRoundPlusIcon {...stylex.props(previewStyles.icon)} />
        Follow
      </Button>
    </>
  )
}

function UserCardSkeleton() {
  return (
    <>
      <Skeleton xstyle={styles.skeleton} />
      <Flex xstyle={styles.flex4}>
        <Skeleton xstyle={styles.skeleton2} />
        <Flex xstyle={styles.flex5}>
          <Skeleton xstyle={styles.skeleton3} />
          <Skeleton xstyle={styles.skeleton4} />
        </Flex>
      </Flex>
      <Skeleton xstyle={styles.skeleton5} />
    </>
  )
}

export function Preview() {
  return (
    <Flex xstyle={styles.flex6}>
      {users.map((user) => (
        <Flex xstyle={styles.flex7} key={user.fallback}>
          <UserCard delay={user.delay} user={user} />
        </Flex>
      ))}
    </Flex>
  )
}

const previewStyles = stylex.create({
  icon: {
    blockSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    inlineSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
    marginInline: "-0.125rem",
  },
  preview7: {
    inlineSize: "calc(0.25rem * 3)",
    blockSize: "calc(0.25rem * 3)",
    flexShrink: "0",
  },
})
