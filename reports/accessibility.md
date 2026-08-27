# Yopem UI accessibility report

Date: 2026-08-27 Target: WCAG 2.2 AA Status: agent-tested, not independently
certified

## Automated coverage

- Axe scans for one canonical demo from each of 54 component families.
- Light and dark themes in Chromium, 108 full-matrix scans.
- Desktop and mobile checks for Button focus visibility and 24 CSS pixel minimum
  targets.
- Keyboard checks for dialog focus restoration, tabs arrow navigation, and
  checkbox activation.
- Reduced-motion mode enabled during deterministic component checks.
- Persisted light, dark, and system theme behavior.

Current automated result: full axe matrix, interaction checks, and foundation
checks pass with no detected violations.

## Fixes made during audit

- Raised dark muted foreground contrast.
- Added accessible names to icon triggers and standalone controls.
- Added labels to meter, progress, slider, number, OTP, checkbox, radio, switch,
  select, combobox, and toolbar examples.
- Made scroll-area viewports keyboard focusable and named.
- Restored visible focus behavior and minimum pointer targets.

## Limits

VoiceOver and NVDA checks require human assistive-technology testing and remain
pending. This report must not be presented as third-party WCAG certification.
