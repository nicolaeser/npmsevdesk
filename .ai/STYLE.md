# Presentation and Interface Contract

## Scope

This repository is a Node.js TypeScript SDK, not a user-interface application. It contains no
approved visual theme, CSS system, design tokens, component library, screens, responsive layouts,
motion system, or browser interaction layer. This contract applies to public Markdown and
compile-checked code examples; it must not be used to invent a visual product system.

The current sources of truth are `package.json`, `README.md`, and the TypeScript programs under
`examples/`. Engineering and test formatting rules remain owned by
[quality and testing](instructions/quality-testing.md).

## Documentation presentation

- Markdown must use a coherent heading hierarchy, descriptive link text, fenced code blocks with an
  appropriate language, and tables only when they improve comparison or mapping.
- TypeScript examples must use the package's canonical public imports and method names and must stay
  compile-checkable through the examples configuration.
- Examples should focus on one behavior while preserving necessary safety context, especially for
  credentials, remote writes, taxation, and sensitive output.
- Documentation must remain readable without color, animation, layout assumptions, or image-only
  explanation. Link and heading wording should communicate purpose out of context.

## No-UI boundaries

- Colors, typography scales, spacing tokens, gradients, shadows, breakpoints,
  hover/focus/pressed states, motion, decorative assets, and component variants must not become
  repository conventions without an authorized UI architecture change and current implementation
  evidence.
- UI or styling dependencies must not be added merely to satisfy this document.
- Accessibility requirements for a future interface must be derived from that interface's actual
  platform, semantics, keyboard/touch behavior, contrast, reflow, and reduced-motion support; none
  may be inferred from this SDK-only repository.
- If an authorized change introduces a UI layer, its themes, tokens, global styles, components,
  supported viewports, interaction states, and accessibility behavior must be inspected, and this
  contract must be updated before repeated implementation may be treated as a standard.

## Verification

For Markdown or examples, `npm run typecheck:examples` must run when tooling is available; relative
links and rendered heading, table, and code-block clarity must also be inspected. The stronger
domain checks in the applicable Instructions remain mandatory.
