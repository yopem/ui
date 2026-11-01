"use client"

import type { MouseEvent } from "react"

import { Clipboard } from "@registry/components/ui/clipboard"
import { Wrap } from "@registry/components/ui/wrap"

function cancelCopy(event: MouseEvent<HTMLButtonElement>) {
  event.preventDefault()
}

function CustomLabel() {
  return <>Copy custom</>
}

function EmptyLabel() {
  return null
}

export function Preview() {
  return (
    <Wrap>
      <Clipboard value="https://example.com/field-notes">Copy link</Clipboard>
      <Clipboard value="Default clipboard text" />
      <Clipboard
        aria-label="Copy source"
        value={'const message = "Clipboard example"'}
      />
      <Clipboard aria-label="Copy icon example" value="Icon clipboard text">
        {""}
      </Clipboard>
      <Clipboard title="" value="Default icon clipboard text">
        {""}
      </Clipboard>
      <Clipboard id="clipboard-false" title="" value="clipboard-false">
        {false}
      </Clipboard>
      <Clipboard
        id="clipboard-whitespace"
        title=""
        value="clipboard-whitespace"
      >
        {"   "}
      </Clipboard>
      <Clipboard id="clipboard-fragment" title="" value="clipboard-fragment">
        <></>
      </Clipboard>
      <Clipboard
        id="clipboard-nested-fragment"
        title=""
        value="clipboard-nested-fragment"
      >
        <>
          {false}
          <>{"  "}</>
        </>
      </Clipboard>
      <Clipboard id="clipboard-fragment-text" title="" value="report">
        <>Copy report</>
      </Clipboard>
      <Clipboard id="clipboard-custom-text" title="" value="custom">
        <CustomLabel />
      </Clipboard>
      <Clipboard
        aria-label="Copy custom empty"
        id="clipboard-custom-empty"
        title=""
        value="custom empty"
      >
        <EmptyLabel />
      </Clipboard>
      <Clipboard
        aria-label="Duplicate"
        id="clipboard-other-label"
        value="other"
      />
      <Clipboard
        id="clipboard-cancel-label"
        onClick={cancelCopy}
        value="not copied"
      >
        Cancel copy
      </Clipboard>
      <Clipboard
        aria-labelledby="clipboard-cancel-label"
        title=""
        value="Labelled clipboard text"
      >
        {""}
      </Clipboard>
      <Clipboard aria-label="Disabled copy" disabled value="not copied">
        Disabled copy
      </Clipboard>
    </Wrap>
  )
}
