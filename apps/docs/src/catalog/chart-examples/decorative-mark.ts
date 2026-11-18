import type {
  ChartMark,
  ChartValue,
  MarkScene,
  SceneNode,
} from "@tanstack/charts"
import type { PolarMark } from "@tanstack/charts/polar"

function withoutInteraction(node: SceneNode): SceneNode {
  if (node.kind === "group") {
    return { ...node, children: node.children.map(withoutInteraction) }
  }

  if (node.kind === "label") return node
  const decorative = { ...node }
  delete decorative.interaction

  return decorative
}

export function decorativeMark<
  Datum,
  Angle extends ChartValue,
  Radius extends ChartValue,
  AngleScale extends string,
  RadiusScale extends string,
>(
  mark: PolarMark<Datum, Angle, Radius, AngleScale, RadiusScale>,
): PolarMark<never, Angle, Radius, AngleScale, RadiusScale> {
  return {
    ...mark,
    __datum: undefined,
    initialize(context) {
      const initialized = mark.initialize(context)

      return {
        ...initialized,
        render(renderContext) {
          const rendered = initialized.render(renderContext)

          return {
            ...rendered,
            nodes: rendered.nodes.map(withoutInteraction),
            points: [],
          }
        },
      }
    },
  }
}

export function decorativeCartesianMark<
  Datum,
  X extends ChartValue,
  Y extends ChartValue,
  XDomain extends ChartValue,
  YDomain extends ChartValue,
  XScale extends string,
  YScale extends string,
>(
  mark: ChartMark<Datum, X, Y, XDomain, YDomain, XScale, YScale>,
): ChartMark<Datum, X, Y, XDomain, YDomain, XScale, YScale> {
  return {
    ...mark,
    initialize(context) {
      const initialized = mark.initialize(context)

      const decorated = {
        ...initialized,
        postDomain(scene: MarkScene<Datum, X, Y>) {
          const rendered = initialized.postDomain?.(scene) ?? scene

          return {
            ...rendered,
            nodes: rendered.nodes.map(withoutInteraction),
            points: [],
          }
        },
      }

      if (initialized.resolveLayout) {
        const resolveLayout = initialized.resolveLayout
        decorated.resolveLayout = function resolveDecorativeLayout(
          layoutContext,
        ) {
          const resolved = resolveLayout(layoutContext)
          const postDomain = resolved.postDomain ?? initialized.postDomain

          return {
            ...resolved,
            postDomain(scene: MarkScene<Datum, X, Y>) {
              const rendered = postDomain?.(scene) ?? scene

              return {
                ...rendered,
                nodes: rendered.nodes.map(withoutInteraction),
                points: [],
              }
            },
          }
        }
      }

      return decorated
    },
  }
}
