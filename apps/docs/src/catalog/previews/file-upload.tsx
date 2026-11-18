"use client"

import { Button } from "@registry/components/ui/button"
import { FileUpload } from "@registry/components/ui/file-upload"
import { Stack } from "@registry/components/ui/stack"
import { useEventCallback } from "@registry/hooks/use-event-callback"
import * as stylex from "@stylexjs/stylex"
import { useState } from "react"

export function Preview({ embedded = false }: { embedded?: boolean }) {
  const [files, setFiles] = useState<File[]>([])

  const resetSelection = useEventCallback(() => setFiles([]))

  const main = (
    <FileUpload
      accept=".txt,.pdf"
      label="Attachments"
      maxFiles={3}
      maxSize={1048576}
      multiple
      xstyle={styles.upload}
    >
      Drop text or PDF files here. Select up to 3 files, 1 MiB each.
    </FileUpload>
  )

  if (embedded) return main

  return (
    <Stack xstyle={styles.upload}>
      {main}
      <FileUpload disabled label="Disabled upload" />
      <FileUpload accept="image/*" label="Profile image" />
      <FileUpload
        label="Controlled upload"
        onValueChange={setFiles}
        value={files}
      />
      <Button onClick={resetSelection} variant="outline">
        Reset selection
      </Button>
    </Stack>
  )
}

const styles = stylex.create({
  upload: {
    inlineSize: "100%",
    maxInlineSize: "24rem",
  },
})
