import { z } from "zod"

export const registryItemTypeSchema = z.enum([
  "registry:base",
  "registry:hook",
  "registry:lib",
  "registry:style",
  "registry:ui",
])

export const registryItemFileSchema = z.object({
  content: z.string().optional(),
  integrity: z.string().optional(),
  path: z.string().min(1),
  target: z.string().min(1),
  type: registryItemTypeSchema,
})

export const registryItemSchema = z.object({
  $schema: z.url().optional(),
  categories: z.array(z.string()).default([]),
  dependencies: z.array(z.string()).default([]),
  description: z.string(),
  devDependencies: z.array(z.string()).default([]),
  docs: z
    .object({
      api: z.array(z.string()).default([]),
      usage: z.string().default(""),
    })
    .optional(),
  files: z.array(registryItemFileSchema).min(1),
  name: z.string().regex(/^[a-z0-9-]+$/),
  peerDependencies: z.array(z.string()).default([]),
  registryDependencies: z.array(z.string()).default([]),
  registryVersion: z.string(),
  schemaVersion: z.literal(1),
  title: z.string(),
  type: registryItemTypeSchema,
})

export const registrySchema = z.object({
  $schema: z.url().optional(),
  homepage: z.url(),
  items: z.array(
    registryItemSchema.omit({
      $schema: true,
      registryVersion: true,
      schemaVersion: true,
    }),
  ),
  name: z.string(),
  schemaVersion: z.literal(1),
  version: z.string(),
})

export type Registry = z.infer<typeof registrySchema>
export type RegistryItem = z.infer<typeof registryItemSchema>
