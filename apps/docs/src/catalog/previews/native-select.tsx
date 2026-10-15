"use client"

import { Field } from "@registry/components/ui/field"
import { Label } from "@registry/components/ui/label"
import { NativeSelect } from "@registry/components/ui/native-select"
import { Stack } from "@registry/components/ui/stack"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  fields: { inlineSize: "20rem", maxInlineSize: "100%" },
})

export function Preview() {
  return (
    <Stack xstyle={styles.fields}>
      <Field>
        <Label htmlFor="native-select-theme">Theme</Label>
        <NativeSelect id="native-select-theme" defaultValue="system">
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </NativeSelect>
      </Field>
      <Field disabled>
        <Label htmlFor="native-select-disabled-theme">Disabled theme</Label>
        <NativeSelect
          id="native-select-disabled-theme"
          disabled
          defaultValue="system"
        >
          <option value="system">System</option>
        </NativeSelect>
      </Field>
    </Stack>
  )
}
