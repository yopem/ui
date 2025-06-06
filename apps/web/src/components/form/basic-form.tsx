"use client"

import { Button, useAppForm } from "@yopem-ui/react"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  acceptTerms: z.literal(true).refine(Boolean, {
    message: "You must accept the terms",
  }),
  gender: z.enum(["Male", "Female", "Other"], {
    errorMap: () => ({ message: "Select a gender" }),
  }),
  framework: z.enum(["react", "solid", "vue", "svelte"]),
  pin: z
    .array(z.string().length(1))
    .length(6, "PIN must be 6 digits")
    .refine((val) => val.every((char) => /^\d$/.test(char)), {
      message: "PIN must be numbers only",
    }),
  bio: z.string().max(500, "Bio too long"),
})

export default function ProfileForm() {
  const form = useAppForm({
    defaultValues: {
      name: "",
      email: "",
      acceptTerms: false,
      gender: "",
      pin: Array(6).fill(""),
      bio: "",
      framework: "",
    },
    validators: {
      onChange: schema,
    },
    onSubmit: ({ value }) => {
      alert("Success! " + JSON.stringify(value, null, 2))
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
      className="max-w-md space-y-6"
    >
      <form.AppField name="name">
        {(field) => (
          <form.FormItem>
            <form.FormLabel>Name</form.FormLabel>
            <field.BaseField placeholder="Your name" />
            <form.FormMessage />
          </form.FormItem>
        )}
      </form.AppField>

      <form.AppField name="email">
        {(field) => (
          <form.FormItem>
            <form.FormLabel>Email</form.FormLabel>
            <field.BaseField type="email" placeholder="you@example.com" />
            <form.FormMessage />
          </form.FormItem>
        )}
      </form.AppField>

      <form.AppField name="gender">
        {(field) => (
          <form.FormItem>
            <form.FormLabel>Gender</form.FormLabel>
            <field.RadioGroupField options={["Male", "Female", "Other"]} />
            <form.FormMessage />
          </form.FormItem>
        )}
      </form.AppField>
      <form.AppField name="framework">
        {(field) => (
          <form.FormItem>
            <form.FormLabel>Framework</form.FormLabel>
            <field.SelectField
              options={[
                { label: "React", value: "react" },
                { label: "Vue", value: "vue" },
                { label: "Svelte", value: "svelte", disabled: true },
              ]}
              placeholder="Pilih framework"
            />
            <form.FormMessage />
          </form.FormItem>
        )}
      </form.AppField>
      <form.AppField name="pin">
        {(field) => (
          <form.FormItem>
            <form.FormLabel>PIN Code</form.FormLabel>
            <field.PinInputField label="Enter 6-digit PIN" />
            <form.FormMessage />
          </form.FormItem>
        )}
      </form.AppField>
      <form.AppField name="bio">
        {(field) => (
          <form.FormItem>
            <form.FormLabel>Bio</form.FormLabel>
            <field.TextareaField placeholder="Tell us about yourself..." />
            <form.FormMessage />
          </form.FormItem>
        )}
      </form.AppField>
      <form.AppField name="acceptTerms">
        {(field) => (
          <form.FormItem>
            <field.CheckboxField label="I accept the terms" />
            <form.FormMessage />
          </form.FormItem>
        )}
      </form.AppField>
      <form.FormItem>
        <Button type="submit">Submit</Button>
      </form.FormItem>
    </form>
  )
}
