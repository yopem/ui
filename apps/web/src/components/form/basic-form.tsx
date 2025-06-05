"use client"

import { Button, useAppForm } from "@yopem-ui/react"
import { z } from "zod"

export default function BasicForm() {
  const form = useAppForm({
    defaultValues: {
      firstName: "",
      email: "",
    },
    validators: {
      onChange: z.object({
        firstName: z.string().min(1, "Nama wajib diisi"),
        email: z.string().email("Email tidak valid"),
      }),
    },
    onSubmit: ({ value }) => {
      alert(JSON.stringify(value, null, 2))
    },
  })

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        await form.handleSubmit()
      }}
      className="mx-auto max-w-md space-y-6"
    >
      <form.AppField name="firstName">
        {(field) => (
          <form.FormItem>
            <field.TextField label="Nama" />
            <form.FormMessage />
          </form.FormItem>
        )}
      </form.AppField>

      <form.AppField name="email">
        {(field) => (
          <form.FormItem>
            <field.TextField label="Email" />
            <form.FormMessage />
          </form.FormItem>
        )}
      </form.AppField>

      <form.AppForm>
        <Button type="submit">Submit</Button>
      </form.AppForm>
    </form>
  )
}
