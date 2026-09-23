import { styleProps } from "@yopem-ui/compiler/unplugin"
import { expect, test } from "bun:test"

const created = styleProps.vite()
const plugin = Array.isArray(created) ? created[0] : created

test("Vite compiler runs before StyleX on TSX and preserves static styles", async () => {
  expect(plugin?.enforce).toBe("pre")
  const transform = plugin?.transform
  if (!transform) throw new Error("Missing unplugin transform")
  const source =
    'import { Box } from "@registry/components/ui/box"; <Box p={2} />'
  const handler =
    typeof transform === "function" ? transform : transform.handler
  const result: unknown = await Reflect.apply(handler, {}, [
    source,
    "/app/src/view.tsx",
  ])
  expect(result).toBeTruthy()
  expect(result).toHaveProperty(
    "code",
    expect.stringContaining("stylex.create"),
  )
  expect(result).toHaveProperty("code", expect.not.stringContaining(" p="))
  expect(result).toHaveProperty("map")
  expect(
    await Reflect.apply(handler, {}, [
      'import { Box } from "@yopem-ui/registry/components/ui/box"; <Box p={2} />',
      "/app/src/view.tsx",
    ]),
  ).toHaveProperty("code", expect.stringContaining("stylex.create"))
  expect(
    await Reflect.apply(handler, {}, [
      "const view = <div />",
      "/app/src/view.tsx",
    ]),
  ).toBeNull()
  expect(() =>
    Reflect.apply(handler, {}, [
      'import { Box } from "@registry/components/ui/box"; <Box p={size} />',
      "/app/src/view.tsx",
    ]),
  ).toThrow("Style props require static JSX literals")
})

test("unplugin compiles conditions, composition, and TypeScript source", async () => {
  const transform = plugin?.transform
  if (!transform) throw new Error("Missing unplugin transform")
  const handler =
    typeof transform === "function" ? transform : transform.handler
  const result: unknown = await Reflect.apply(handler, {}, [
    `import { Box } from "@registry/components/ui/box";
    import { tokens } from "@registry/styles/tokens.stylex";
    const view: JSX.Element = <Box css={{ color: "red" }} p={[2, null, 4]} _hover={{ color: tokens["--foreground"] }} xstyle={extra} />`,
    "/app/src/view.tsx",
  ])
  expect(result).toHaveProperty(
    "code",
    expect.stringContaining("stylex.create"),
  )
  expect(result).toHaveProperty(
    "code",
    expect.stringContaining("@media (min-width: 768px)"),
  )
  expect(result).toHaveProperty("code", expect.stringContaining("--foreground"))
  expect(result).toHaveProperty("code", expect.stringContaining("extra"))
  expect(result).toHaveProperty("code", expect.not.stringContaining(" p={"))
})
