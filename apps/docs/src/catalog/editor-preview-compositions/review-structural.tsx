"use client"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { HStack } from "@registry/components/ui/hstack"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import * as stylex from "@stylexjs/stylex"
import {
  EditorContent,
  EditorHistoryButton,
  EditorRoot,
  EditorToolbar,
  useEditor,
} from "@yopem-ui/editor"
import {
  createEditorReview,
  EditorReviewProvider,
  EditorReviewStructuralChangeList,
  EditorReviewStructuralDecisionControls,
  EditorReviewStructuralProposal,
  EditorReviewStructuralProposals,
  EditorReviewThread,
  makeReviewRichContent,
  parseReviewDocument,
  useEditorReview,
  type EditorReviewAction,
  type EditorReviewHost,
} from "@yopem-ui/editor/review"
import { useState } from "react"

const styles = stylex.create({ actions: { flexWrap: "wrap" } })

const anchorContent = makeReviewRichContent("Anchor remains unique.")

const author = { id: "structural-reviewer", name: "Structural reviewer" }

const initialState = JSON.stringify(
  parseReviewDocument(
    {
      root: {
        ...anchorContent.root,
        children: [
          ...anchorContent.root.children.map((paragraph) => ({
            ...paragraph,
            children: [
              {
                type: "mark",
                version: 1,
                direction: null,
                format: "",
                indent: 0,
                ids: ["structural-thread"],
                children: paragraph.children,
              },
            ],
          })),
          ...makeReviewRichContent("Draft section").root.children,
        ],
        $: {
          yopemReview: {
            version: 1,
            threads: [
              {
                id: "structural-thread",
                resolved: false,
                comments: [
                  {
                    id: "structural-comment",
                    author,
                    text: "Keep this anchor when moving its paragraph.",
                    content: makeReviewRichContent(
                      "Keep this anchor when moving its paragraph.",
                    ),
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

const proposedDocument = {
  root: {
    ...anchorContent.root,
    children: [
      ...makeReviewRichContent("Reviewed section").root.children.map(
        (paragraph) => ({
          ...paragraph,
          type: "heading",
          tag: "h2",
        }),
      ),
      ...makeReviewRichContent("Moved review context").root.children.map(
        (paragraph) => ({
          ...paragraph,
          type: "quote",
        }),
      ),
      ...anchorContent.root.children,
    ],
  },
}

function allowAction() {
  return true
}

function denyDecisions(action: EditorReviewAction) {
  return action !== "accept" && action !== "reject"
}

const allowedHost: EditorReviewHost = {
  viewer: author,
  visible: true,
  replyWhileReadonly: false,
  can: allowAction,
}

const deniedHost: EditorReviewHost = { ...allowedHost, can: denyDecisions }

type StructuralPart = "proposals" | "proposal" | "changes" | "decisions"

function StructuralReviewControls({ part }: { part: StructuralPart }) {
  const editor = useEditor()
  const review = useEditorReview()
  const view = review.getView()
  const proposal = view.structuralProposals[0]
  const [error, setError] = useState("")

  const propose = useStableCallback(function propose() {
    setError("")
    editor.update(
      () => {
        try {
          review.$suggestDocumentTree(proposedDocument)
        } catch (cause) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Structural proposal failed.",
          )
        }
      },
      { discrete: true },
    )
  })

  return (
    <Stack>
      <Button onClick={propose} disabled={!review.available("suggest")}>
        Propose structural changes
      </Button>
      <Box
        render={
          <output aria-label="Structural review status" aria-live="polite" />
        }
      >
        {error || view.diagnostic}
      </Box>
      {part === "proposals" ? (
        <EditorReviewStructuralProposals />
      ) : proposal ? (
        part === "proposal" ? (
          <EditorReviewStructuralProposal id={proposal.id} />
        ) : (
          <Stack>
            <EditorReviewStructuralChangeList id={proposal.id} />
            <EditorReviewStructuralDecisionControls id={proposal.id} />
          </Stack>
        )
      ) : null}
      <EditorReviewThread id="structural-thread" />
    </Stack>
  )
}

export function StructuralReviewExample({
  part = "proposals",
}: {
  part?: StructuralPart
}) {
  const [controller] = useState(createEditorReview)
  const [extensions] = useState(() => [controller.extension])
  const [editable, setEditable] = useState(true)
  const [allowDecisions, setAllowDecisions] = useState(true)

  const toggleEditable = useStableCallback(function toggleEditable() {
    setEditable((current) => !current)
  })

  const togglePermission = useStableCallback(function togglePermission() {
    setAllowDecisions((current) => !current)
  })

  return (
    <EditorRoot
      initialState={initialState}
      extensions={extensions}
      editable={editable}
      ariaLabel="Structural review document"
    >
      <EditorReviewProvider
        controller={controller}
        host={allowDecisions ? allowedHost : deniedHost}
      >
        <Stack>
          <Text>
            Local policies demonstrate review controls. Supply verified host
            policies in production.
          </Text>
          <HStack xstyle={styles.actions}>
            <Button onClick={toggleEditable}>
              {editable
                ? "Make structural editor read-only"
                : "Enable structural editing"}
            </Button>
            <Button onClick={togglePermission}>
              {allowDecisions
                ? "Revoke decision permission"
                : "Allow decision permission"}
            </Button>
          </HStack>
          <EditorToolbar>
            <EditorHistoryButton action="undo" />
            <EditorHistoryButton action="redo" />
          </EditorToolbar>
          <EditorContent />
          <StructuralReviewControls part={part} />
        </Stack>
      </EditorReviewProvider>
    </EditorRoot>
  )
}
