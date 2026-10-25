"use client"

import type { EditorAiConfig } from "@yopem-ui/editor/ai/client"
import type { FormEvent } from "react"

import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Field, FieldLabel } from "@registry/components/ui/field"
import { Form } from "@registry/components/ui/form"
import { Input } from "@registry/components/ui/input"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import {
  EditorAiRoot,
  EditorHistoryButton,
  EditorRoot,
  EditorToolbar,
} from "@yopem-ui/editor"
import { validateEditorAiConfig } from "@yopem-ui/editor/ai/client"
import {
  EditorAiMenuContent,
  EditorAiMenuPanel,
  EditorAiMenuRoot,
  EditorAiMenuTrigger,
} from "@yopem-ui/editor/ai/menu"
import { useId, useState } from "react"
import { z } from "zod"

const hostSetupSchema = z.strictObject({
  endpoint: z.string().min(1).max(2048),
  documentId: z.string().min(1).max(256),
  csrfToken: z
    .string()
    .min(1)
    .max(16384)
    .refine((value) => value.trim().length > 0),
})

const initialState = JSON.stringify({
  root: {
    type: "root",
    version: 1,
    direction: null,
    format: "",
    indent: 0,
    children: [
      {
        type: "paragraph",
        version: 1,
        direction: null,
        format: "",
        indent: 0,
        children: [
          {
            type: "text",
            version: 1,
            text: "Select this sentence, then open the AI menu.",
            format: 0,
            detail: 0,
            mode: "normal",
            style: "",
          },
        ],
      },
    ],
  },
})

export function EditorAiMenuComposition() {
  const fieldId = useId()
  const [config, setConfig] = useState<EditorAiConfig>()
  const [error, setError] = useState("")

  function configure(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const values = new FormData(event.currentTarget)

    const parsed = hostSetupSchema.safeParse({
      endpoint: values.get("endpoint"),
      documentId: values.get("documentId"),
      csrfToken: values.get("csrfToken"),
    })

    if (!parsed.success) {
      setError(
        "Enter a same-origin endpoint, document ID, and current CSRF token.",
      )

      return
    }

    const { endpoint, documentId, csrfToken } = parsed.data

    const next: EditorAiConfig = {
      endpoint,
      documentId,
      headers: () => ({ "x-csrf-token": csrfToken }),
    }

    try {
      validateEditorAiConfig(next, window.location.origin)
    } catch {
      setError("Use a valid same-origin endpoint, document ID, and CSRF token.")

      return
    }

    event.currentTarget.reset()
    setConfig(next)
    setError("")
  }

  return (
    <Box render={<section aria-label="AI menu host setup" />}>
      <Stack>
        <Text>
          No endpoint or credential is prefilled. Setup sends no AI request.
          Your host must authenticate and authorize each request.
        </Text>
        {config ? (
          <>
            <Box render={<output />}>
              Host settings are configured. Choose a command to start a request.
            </Box>
            <EditorRoot ariaLabel="AI menu editor" initialState={initialState}>
              <EditorAiRoot config={config}>
                <EditorAiMenuRoot>
                  <Stack>
                    <EditorToolbar aria-label="AI menu history">
                      <EditorAiMenuTrigger />
                      <EditorHistoryButton action="undo" />
                      <EditorHistoryButton action="redo" />
                    </EditorToolbar>
                    <EditorAiMenuPanel />
                    <EditorAiMenuContent
                      aria-label="AI menu editor"
                      placeholder="Select text, then open the AI menu."
                    />
                  </Stack>
                </EditorAiMenuRoot>
              </EditorAiRoot>
            </EditorRoot>
          </>
        ) : (
          <>
            <Form onSubmit={configure}>
              <Stack>
                <Field name="endpoint">
                  <FieldLabel htmlFor={`${fieldId}-endpoint`}>
                    Host endpoint
                  </FieldLabel>
                  <Input
                    id={`${fieldId}-endpoint`}
                    name="endpoint"
                    autoComplete="off"
                    required
                  />
                </Field>
                <Field name="documentId">
                  <FieldLabel htmlFor={`${fieldId}-document`}>
                    Host document ID
                  </FieldLabel>
                  <Input
                    id={`${fieldId}-document`}
                    name="documentId"
                    autoComplete="off"
                    required
                  />
                </Field>
                <Field name="csrfToken">
                  <FieldLabel htmlFor={`${fieldId}-csrf`}>
                    Host CSRF token
                  </FieldLabel>
                  <Input
                    id={`${fieldId}-csrf`}
                    name="csrfToken"
                    type="password"
                    autoComplete="off"
                    required
                  />
                </Field>
                <Button type="submit">Configure AI</Button>
                {error ? <Text role="alert">{error}</Text> : null}
              </Stack>
            </Form>
            <Text>Configure the host before opening the editor.</Text>
          </>
        )}
      </Stack>
    </Box>
  )
}
