# @yopem-ui/oxlint-plugin

## 0.1.2

### Patch Changes

- [`9611fe7`](https://github.com/yopem/ui/commit/9611fe756705586ebd8b820f364d4c786bf9e091)
  Thanks [@karyanayandi](https://github.com/karyanayandi)! -
  feat(oxlint-plugin): update layout primitives to use `render`

  Updated layout primitives to use `render` prop for native elements. Added test
  cases to ensure compatibility with render composition.

- [`feea63c`](https://github.com/yopem/ui/commit/feea63c423ee976cd75a8f3eac98f3a30f90ed27)
  Thanks [@karyanayandi](https://github.com/karyanayandi)! - chore: update
  README docs

- [`6ca39eb`](https://github.com/yopem/ui/commit/6ca39eb907044aaa9ce5f975ee282f97bd099513)
  Thanks [@karyanayandi](https://github.com/karyanayandi)! -
  refactor(oxlint-plugin): remove unused rule and update docs

  - Removed the "valid-polymorphic-as" rule from the plugin.
  - Updated the README to include a detailed table of supported rules.
  - Adjusted tests to reflect the removal of the "valid-polymorphic-as" rule.
  - Ensured the plugin exposes only the current supported rules.

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
