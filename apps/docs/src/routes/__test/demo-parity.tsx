import * as stylex from "@stylexjs/stylex"
import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router"
import {
  createElement,
  lazy,
  type ComponentType,
  type LazyExoticComponent,
} from "react"

import {
  CatalogShell,
  catalogStyles,
  catalogStylesheet,
} from "@/catalog/catalog-ui"
import appCss from "@/styles.css?url"

interface DemoModule {
  default: ComponentType
}

const tailwindModules = import.meta.glob<DemoModule>(
  "../../components/demos/tailwind/*.tsx",
)
const stylexModules = import.meta.glob<DemoModule>(
  "../../components/demos/stylex/*.tsx",
)
const tailwindByName = byName(tailwindModules)
const stylexByName = byName(stylexModules)
const names = [
  ...new Set([...tailwindByName.keys(), ...stylexByName.keys()]),
].sort()
const missingStylex = names.filter((name) => !stylexByName.has(name))
const missingTailwind = names.filter((name) => !tailwindByName.has(name))
const pairs = names.filter(
  (name) => tailwindByName.has(name) && stylexByName.has(name),
)

export const Route = createFileRoute("/__test/demo-parity")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    demo: typeof search.demo === "string" ? search.demo : undefined,
  }),
  beforeLoad: () => {
    if (!__YOPEM_TEST_HARNESS__) throw notFound()
  },
  head: () => ({
    links: [
      { href: appCss, rel: "stylesheet" },
      { href: catalogStylesheet, rel: "stylesheet" },
    ],
    meta: [{ title: "Demo parity · Yopem UI" }],
  }),
  component: DemoParityPage,
})

function DemoParityPage() {
  const navigate = useNavigate({ from: Route.fullPath })
  const search = Route.useSearch()
  const selected =
    search.demo && pairs.includes(search.demo) ? search.demo : pairs[0]

  return (
    <CatalogShell>
      <section {...stylex.props(catalogStyles.hero)}>
        <p {...stylex.props(catalogStyles.edition)}>Test-only route</p>
        <h1 {...stylex.props(catalogStyles.title)}>Demo parity</h1>
        <p {...stylex.props(catalogStyles.lead)}>
          {pairs.length} matched demos · {missingStylex.length} missing StyleX ·{" "}
          {missingTailwind.length} missing Tailwind
        </p>
        <label {...stylex.props(styles.selectorLabel)}>
          Demo
          <select
            {...stylex.props(styles.selector)}
            onChange={(event) =>
              void navigate({
                replace: true,
                search: { demo: event.target.value },
                to: Route.fullPath,
              })
            }
            value={selected}
          >
            {pairs.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </section>

      <div {...stylex.props(styles.columns)}>
        <Preview label="Tailwind">
          {createElement(
            selected
              ? (tailwindByName.get(selected) ?? UnavailableLazyDemo)
              : UnavailableLazyDemo,
          )}
        </Preview>
        <Preview label="StyleX">
          {createElement(
            selected
              ? (stylexByName.get(selected) ?? UnavailableLazyDemo)
              : UnavailableLazyDemo,
          )}
        </Preview>
      </div>

      {missingStylex.length > 0 || missingTailwind.length > 0 ? (
        <section {...stylex.props(catalogStyles.section)}>
          <h2 {...stylex.props(catalogStyles.sectionTitle)}>Inventory gaps</h2>
          <pre {...stylex.props(catalogStyles.source)}>
            <code>
              {JSON.stringify({ missingStylex, missingTailwind }, null, 2)}
            </code>
          </pre>
        </section>
      ) : null}
    </CatalogShell>
  )
}

function Preview({
  children,
  label,
}: {
  children: React.ReactNode
  label: string
}) {
  return (
    <section {...stylex.props(styles.preview)}>
      <h2 {...stylex.props(styles.previewTitle)}>{label}</h2>
      <div {...stylex.props(styles.previewBody)}>{children}</div>
    </section>
  )
}

function byName(modules: Record<string, () => Promise<DemoModule>>) {
  return new Map<string, LazyExoticComponent<ComponentType>>(
    Object.entries(modules).map(([path, load]) => [
      path
        .split("/")
        .at(-1)
        ?.replace(/\.tsx$/, "") ?? path,
      lazy(() => load().catch(() => ({ default: UnavailableDemo }))),
    ]),
  )
}

const UnavailableLazyDemo = lazy(() =>
  Promise.resolve({ default: UnavailableDemo }),
)

function UnavailableDemo() {
  return <p>Demo unavailable.</p>
}

const styles = stylex.create({
  columns: {
    display: "grid",
    gap: "1rem",
    gridTemplateColumns: {
      default: "1fr",
      "@media (min-width: 64rem)": "repeat(2, minmax(0, 1fr))",
    },
  },
  preview: {
    borderColor: "var(--border)",
    borderRadius: "0.875rem",
    borderStyle: "solid",
    borderWidth: 1,
    overflow: "clip",
  },
  previewBody: {
    alignItems: "center",
    display: "flex",
    justifyContent: "center",
    minBlockSize: "24rem",
    overflow: "auto",
    padding: "1.5rem",
  },
  previewTitle: {
    backgroundColor: "var(--muted)",
    borderBlockEndColor: "var(--border)",
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: 1,
    fontSize: "0.75rem",
    letterSpacing: "0.08em",
    margin: 0,
    padding: "0.75rem",
    textTransform: "uppercase",
  },
  selector: {
    backgroundColor: "var(--background)",
    borderColor: "var(--input)",
    borderRadius: "0.625rem",
    borderStyle: "solid",
    borderWidth: 1,
    color: "var(--foreground)",
    font: "inherit",
    inlineSize: "100%",
    maxInlineSize: "28rem",
    padding: "0.65rem",
  },
  selectorLabel: {
    display: "grid",
    fontSize: "0.8125rem",
    fontWeight: 650,
    gap: "0.5rem",
  },
})
