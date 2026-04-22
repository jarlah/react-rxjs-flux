# react-rxjs-flux

> **This project is deprecated and no longer maintained.**

A small library for creating applications based on unidirectional flux-like
data flow with RxJS.

## Why deprecated

- **No longer maintained.** No releases or commits since early 2023.
- **The React ecosystem has moved on.** React 18+ with hooks, plus modern
  state libraries (Zustand, Redux Toolkit, Jotai) and data-fetching tools
  (React Query, SWR), cover these use cases with far more mainstream
  support and better TypeScript ergonomics.
- **RxJS-based state for React turned out to be a niche.** The
  `react-rxjs` ecosystem this was built on has itself stagnated.
- **Security debt.** Years of unmerged Dependabot bumps mean the dev
  toolchain is full of known vulnerabilities that won't be fixed.

## If you still need something like this

Consider one of:
- [Zustand](https://github.com/pmndrs/zustand) — tiny, hooks-native state store
- [Jotai](https://github.com/pmndrs/jotai) — atomic state with a similar spirit
- [RxJS + `useSyncExternalStore`](https://react.dev/reference/react/useSyncExternalStore) — roll-your-own if you really want RxJS as the source of truth; the React-side plumbing is a ~10-line hook now

## Archive

The repo is archived, meaning it's read-only. Existing installs of
`react-rxjs-flux` will keep working on npm — the published package is
untouched — but no new releases will be made.
