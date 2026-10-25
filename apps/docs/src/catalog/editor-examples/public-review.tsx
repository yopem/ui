"use client"

import { Button } from "@registry/components/ui/button"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { Wrap } from "@registry/components/ui/wrap"
import { useEventCallback } from "@registry/hooks/use-event-callback"
import {
  EditorReviewPreset,
  makeReviewRichContent,
  parseReviewDocument,
  type EditorReviewAction,
  type EditorReviewHost,
} from "@yopem-ui/editor/review"
import { useState } from "react"

const anchorId = "public-review-anchor"

const seedAuthor = { id: "fixture-writer", name: "Casey Writer" }

const profiles = {
  reviewer: { id: "fixture-reviewer", name: "Morgan Reviewer" },
  observer: { id: "fixture-observer", name: "Riley Observer" },
}

const documentContent = makeReviewRichContent(
  "Anchor this discussion to the sample paragraph. Select text to add another comment.",
)

function reviewerCan(
  action: EditorReviewAction,
  targetId: string | undefined,
  viewer: Parameters<EditorReviewHost["can"]>[2],
) {
  return (
    viewer.id === profiles.reviewer.id &&
    (action === "create" ||
      action === "suggest" ||
      action === "undo" ||
      action === "redo" ||
      targetId !== undefined)
  )
}

const reviewerHost: EditorReviewHost = {
  viewer: profiles.reviewer,
  visible: true,
  replyWhileReadonly: false,
  can: reviewerCan,
}

const observerHost: EditorReviewHost = {
  viewer: profiles.observer,
  visible: true,
  replyWhileReadonly: false,
  can: () => false,
}

const initialState = JSON.stringify(
  parseReviewDocument(
    {
      root: {
        ...documentContent.root,
        children: documentContent.root.children.map((paragraph) => ({
          ...paragraph,
          children: [
            {
              type: "mark",
              version: 1,
              direction: null,
              format: "",
              indent: 0,
              ids: [anchorId],
              children: paragraph.children,
            },
          ],
        })),
        $: {
          yopemReview: {
            version: 1,
            threads: [
              {
                id: anchorId,
                resolved: false,
                comments: [
                  {
                    id: "public-review-comment",
                    author: seedAuthor,
                    text: "The selected paragraph remains attached to this thread.",
                    createdAt: 1,
                    updatedAt: 1,
                  },
                ],
              },
            ],
          },
        },
      },
    },
    true,
  ),
)

export function PublicReviewExample() {
  const [profile, setProfile] = useState<"reviewer" | "observer">("reviewer")
  const [editable, setEditable] = useState(true)
  const host = profile === "reviewer" ? reviewerHost : observerHost

  function toggleProfile() {
    setProfile((current) => (current === "reviewer" ? "observer" : "reviewer"))
  }

  function toggleEditable() {
    setEditable((current) => !current)
  }

  const onProfileClick = useEventCallback(toggleProfile)
  const onEditableClick = useEventCallback(toggleEditable)

  return (
    <Stack>
      <Wrap>
        <Text>
          Local fixture profile:{" "}
          {profile === "reviewer" ? "Reviewer" : "Observer"}
        </Text>
        <Button type="button" onClick={onProfileClick}>
          {profile === "reviewer"
            ? "Use observer profile"
            : "Use reviewer profile"}
        </Button>
        <Button
          type="button"
          aria-pressed={!editable}
          onClick={onEditableClick}
        >
          {editable ? "Set document read-only" : "Enable document editing"}
        </Button>
      </Wrap>
      <Text>
        Fixture profiles are local examples, not authentication. Verify each
        user and authorize every review action on your server. Suggestions
        support inline text only. Review paste accepts plain text only and
        rejects rich HTML. Keep higher-priority host clipboard handlers so hosts
        can veto paste. This example uses Lexical state, not Plate JSON.
      </Text>
      <EditorReviewPreset
        ariaLabel="Public review document"
        editable={editable}
        host={host}
        initialState={initialState}
      />
    </Stack>
  )
}
