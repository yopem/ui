# @yopem-ui/oxlint-plugin

## 0.1.1

### Patch Changes

- [#219](https://github.com/yopem/ui/pull/219)
  [`4949ada`](https://github.com/yopem/ui/commit/4949adacf3e8f2ad462ef3464b6f37bfde6a4eea)
  Thanks [@karyanayandi](https://github.com/karyanayandi)! - feat: expands
  design-system-first lint rules

## 0.1.0

### Minor Changes

- [`a25fcec`](https://github.com/yopem/ui/commit/a25fceccb5581fe5db072fa7b926348f198e99b5)
  Thanks [@karyanayandi](https://github.com/karyanayandi)! - feat(oxlint): add
  no-unused-stylex-styles rule

  Introduce `no-unused-stylex-styles` rule to detect unused top-level keys in
  `stylex.create` declarations. Tracks lexical scope, import aliases, and
  dynamic style functions. Skips exports, escaping objects, and declarations
  with spreads or computed keys. Rule is opt-in and disabled by default.

## 0.0.2

### Patch Changes

- [`723ba50`](https://github.com/yopem/ui/commit/723ba502fa98e8a47e9ee7b9bd9f710c3c0e896c)
  Thanks [@karyanayandi](https://github.com/karyanayandi)! - Prepare CLI and
  Oxlint plugin for automated npm releases.
