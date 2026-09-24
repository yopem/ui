"use client"

import * as stylex from "@stylexjs/stylex"
import { UserRoundPlusIcon, UsersRoundIcon } from "lucide-react"
import { useEffect, useState } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Box } from "@/components/ui/box"
import { Button } from "@/components/ui/button"
import { Flex } from "@/components/ui/flex"
import { Heading } from "@/components/ui/heading"
import { Skeleton } from "@/components/ui/skeleton"
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  if (!isLoaded) {
    return <UserCardSkeleton />
  }

  return (
    <>
      <Avatar
        inlineSize={"calc(0.25rem * 10)"}
        blockSize={"calc(0.25rem * 10)"}
      >
        <AvatarImage alt={user.name} src={user.image} />
        <AvatarFallback>{user.fallback}</AvatarFallback>
      </Avatar>
      <Flex
        minInlineSize={"0px"}
        flex={"1"}
        flexDirection={"column"}
        gap={"0.25rem"}
      >
        <Heading
          as="h4"
          overflow={"hidden"}
          display={"-webkit-box"}
          WebkitBoxOrient={"vertical"}
          WebkitLineClamp={"1"}
          fontSize={"0.875rem"}
          lineHeight={"calc(1.25 / 0.875)"}
          fontWeight={"500"}
        >
          {user.name}
        </Heading>
        <Flex
          alignItems={"center"}
          gap={"calc(0.25rem * 3)"}
          fontSize={"0.75rem"}
          lineHeight={"calc(1 / 0.75)"}
          color={"var(--muted-foreground)"}
        >
          <Box
            as="span"
            overflow={"hidden"}
            textOverflow={"ellipsis"}
            whiteSpace={"nowrap"}
          >
            {user.role}
          </Box>
          <Flex minInlineSize={"0px"} alignItems={"center"} gap={"0.25rem"}>
            <UsersRoundIcon {...stylex.props(previewStyles.preview7)} />
            <Box
              as="span"
              overflow={"hidden"}
              textOverflow={"ellipsis"}
              whiteSpace={"nowrap"}
            >
              {user.followers}
              <Box as="span" mdDown={{ display: "none" }}>
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
      <Skeleton
        inlineSize={"calc(0.25rem * 10)"}
        blockSize={"calc(0.25rem * 10)"}
        borderRadius={"calc(infinity * 1px)"}
      />
      <Flex flex={"1"} flexDirection={"column"}>
        <Skeleton
          marginBlock={"calc(0.25rem * 0.5)"}
          blockSize={"calc(0.25rem * 4)"}
          maxInlineSize={"calc(0.25rem * 54)"}
        />
        <Flex
          maxInlineSize={"calc(0.25rem * 54)"}
          alignItems={"center"}
          gap={"0.25rem"}
        >
          <Skeleton
            marginBlock={"calc(0.25rem * 0.5)"}
            blockSize={"calc(0.25rem * 4)"}
            inlineSize={"calc(1 / 2 * 100%)"}
          />
          <Skeleton
            marginBlock={"calc(0.25rem * 0.5)"}
            blockSize={"calc(0.25rem * 4)"}
            inlineSize={"calc(1 / 2 * 100%)"}
          />
        </Flex>
      </Flex>
      <Skeleton
        blockSize={"calc(0.25rem * 7)"}
        inlineSize={"calc(0.25rem * 19)"}
        md={{
          blockSize: "calc(0.25rem * 6)",
          inlineSize: "calc(0.25rem * 17)",
        }}
      />
    </>
  )
}

export function Preview() {
  return (
    <Flex
      inlineSize={"100%"}
      maxInlineSize={"calc(0.25rem * 92)"}
      flexDirection={"column"}
      gap={"calc(0.25rem * 6)"}
    >
      {users.map((user) => (
        <Flex
          alignItems={"center"}
          gap={"calc(0.25rem * 4)"}
          key={user.fallback}
        >
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
