"use client"

import * as stylex from "@stylexjs/stylex"
import { useState } from "react"

import { Button } from "@/components/ui/stylex/button"

export function Example() {
  const [activations, setActivations] = useState(0)

  return (
    <section aria-label="Style props playground" {...stylex.props(styles.root)}>
      <h2>Style props</h2>
      <p>Numbers use the spacing scale; CSS strings keep their units.</p>
      <div {...stylex.props(styles.row)}>
        <Button p={4}>Numeric padding</Button>
        <Button p="13px">Raw padding</Button>
        <Button p={[2, null, 6]}>Responsive array</Button>
        <Button p={{ base: 2, md: 4, lg: 6 }}>Responsive object</Button>
        <Button p={{ base: 2, mdToLg: 5 }}>Responsive range</Button>
      </div>
      <p>
        Logical spacing follows writing direction, including negative margins.
      </p>
      <div dir="ltr" {...stylex.props(styles.row)}>
        <Button ps={6} pe={2} ms={-2}>
          Logical LTR
        </Button>
      </div>
      <div dir="rtl" {...stylex.props(styles.row)}>
        <Button ps={6} pe={2} ms={-2}>
          Logical RTL
        </Button>
      </div>
      <Button gap={3}>
        <span>Scaled</span>
        <span>space</span>
      </Button>
      <Button gap={0} spaceX={-2}>
        <span {...stylex.props(styles.spaceItem)}>Negative</span>
        <span {...stylex.props(styles.spaceItem)}>space</span>
      </Button>
      <p>Hover, keyboard focus, and disabled states keep native behavior.</p>
      <div {...stylex.props(styles.row)}>
        <Button
          p={4}
          _hover={{ p: 6 }}
          _focusVisible={{
            outlineStyle: "solid",
            outlineWidth: "2px",
            outlineOffset: "6px",
          }}
          onClick={() => setActivations((count) => count + 1)}
        >
          Interactive styles
        </Button>
        <Button disabled p={4} _disabled={{ opacity: 0.4 }}>
          Disabled styles
        </Button>
        <Button>After disabled</Button>
      </div>
      <output aria-live="polite">Activations: {activations}</output>
      <p>
        Explicit xstyle overrides style props. Inline CSS keeps native
        precedence; className is preserved.
      </p>
      <div {...stylex.props(styles.row)}>
        <Button p={4} xstyle={styles.override}>
          Xstyle precedence
        </Button>
        <Button p={4} xstyle={styles.override}>
          Inline precedence
        </Button>
        <Button
          p={4}
          xstyle={styles.override}
          className={stylex.props(styles.consumerClass).className}
        >
          Consumer class
        </Button>
      </div>
    </section>
  )
}

const styles = stylex.create({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
    maxInlineSize: "64rem",
    minInlineSize: 0,
    padding: "1rem",
  },
  row: {
    display: "flex",
    flexWrap: "wrap",
    gap: "1.5rem",
  },
  spaceItem: { paddingInline: "0.75rem" },
  override: { padding: "28px" },
  consumerClass: { borderTopWidth: "5px" },
})
