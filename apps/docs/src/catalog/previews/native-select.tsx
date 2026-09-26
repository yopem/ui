"use client"

import { NativeSelect } from "@registry/components/ui/native-select"

export function Preview() {
  return (
    <>
      <label>
        Theme{" "}
        <NativeSelect defaultValue="system">
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </NativeSelect>
      </label>
      <label>
        Disabled theme{" "}
        <NativeSelect disabled defaultValue="system">
          <option value="system">System</option>
        </NativeSelect>
      </label>
    </>
  )
}
