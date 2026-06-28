# Contributing to LangsHub

Thanks for helping make LangsHub better! This guide covers everything you need to start
contributing — code, content, docs, or ideas.

## Ways to contribute

1. **Add content** — Sign in to the live app and use the **Contribute** page to add public words,
   sentences, and reading texts. No code required.
2. **Fix a bug or add a feature** — See [Open issues](../../issues). Issues tagged `good first issue`
   are ideal starting points.
3. **Improve documentation** — README, code comments, in-app copy.
4. **Share your collections** — Mark them public so others can clone them.

## Development setup

```bash
bun install
cp .env.example .env   # fill in your Cloud / Supabase keys
bun run dev
```

## Workflow

1. Fork and create a branch: `git checkout -b feat/spaced-repetition`
2. Commit small, focused changes with a clear message.
3. Run `bun run lint` before opening a PR.
4. Push and open a Pull Request using the template.

## Style guide

- **TypeScript strict** — no `any` unless unavoidable, and add a comment when used.
- **Tailwind v4** — use semantic tokens from `src/styles.css` (`bg-card`, `text-primary`).
  Never hardcode colors (`text-white`, `#fff`).
- **Server logic** belongs in `src/lib/*.functions.ts` (TanStack `createServerFn`). Never run
  privileged DB code in components or loaders.
- **RLS first** — every new table must have policies enabling exactly the access intended.
- **Accessibility** — every interactive element needs a label or visible text. Keyboard shortcuts
  must not trap focus.

## Adding a feature

1. Schema change → add a migration in `supabase/migrations/`. Include GRANTs and RLS in the same file.
2. Server function → add to `src/lib/<area>.functions.ts`. Validate every input with Zod.
3. UI → add or update a route under `src/routes/`. Use TanStack Query for data loading.
4. Update the README features list if user-facing.

## Reporting bugs

Use the bug report template. Include browser, steps to reproduce, expected vs actual, and a
screenshot or screen recording when relevant.

## Code of Conduct

By participating you agree to abide by the [Code of Conduct](./CODE_OF_CONDUCT.md).