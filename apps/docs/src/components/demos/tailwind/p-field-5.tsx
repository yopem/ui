"use client"

import {
  Field,
  FieldLabel,
  FieldValidity,
} from "@/components/ui/tailwind/field"
import { Input } from "@/components/ui/tailwind/input"

export default function FieldWithValidityDemo() {
  return (
    <Field>
      <FieldLabel>Email</FieldLabel>
      <Input placeholder="Enter your email" required type="email" />
      <FieldValidity>
        {(validity) => (
          <div className="flex w-full flex-col gap-2">
            {validity.error && (
              <p className="text-destructive-foreground text-xs">
                {validity.error}
              </p>
            )}
            <div className="bg-muted w-full rounded-md p-2">
              <pre className="max-h-60 [scrollbar-width:none] overflow-y-auto font-mono text-xs">
                {JSON.stringify(validity, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </FieldValidity>
    </Field>
  )
}
