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

const aliasesSchema = z.object({
  components: z.string(),
  hooks: z.string(),
  lib: z.string(),
  styles: z.string(),
  ui: z.string(),
})

export const configSchema = z.object({
  $schema: z.url().optional(),
  aliases: aliasesSchema,
  css: z.string(),
  framework: z.enum([
    "next-app",
    "next-pages",
    "tanstack-start",
    "unknown",
    "vite",
  ]),
  paths: aliasesSchema,
  registry: z.url().default("https://ui.yopem.com/r"),
})

export const lockSchema = z.object({
  items: z.record(
    z.string(),
    z.object({
      dependencies: z.array(z.string()),
      files: z.record(z.string(), z.string()),
      registryDependencies: z.array(z.string()),
      version: z.string().optional(),
    }),
  ),
  version: z.literal(1),
})

export type Config = z.infer<typeof configSchema>
export type Lock = z.infer<typeof lockSchema>
export type Registry = z.infer<typeof registrySchema>
export type RegistryItem = z.infer<typeof registryItemSchema>
