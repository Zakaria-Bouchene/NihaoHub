# LangsHub

**An open-source platform for learning Mandarin Chinese — built in the open, improved by the community.**

LangsHub gives learners deliberate practice tools — three-step flashcards, progressive reading
practice, smart auto-curated decks, and community-contributed content — so anyone can become
fluent without paywalls or dark patterns.

## ✨ Features

- **Flashcards with three-step reveal** — Chinese → +Pinyin → +English (or reverse mode: EN → 中文).
- **Self-evaluation** — `Again` / `Hard` / `Good` / `Easy` with full review history.
- **Smart collections** — Favorites, Difficult words, and an automatically-curated "Struggling" deck.
- **Custom collections** — Build, clone, share, and export decks of words, sentences, and texts.
- **Reading practice** — Lessons and paragraphs with progressive pinyin + translation reveal.
- **Contribute content** — Anyone signed in can submit public words, sentences, and reading texts.
- **Stats** — Track your daily reviews and rating distribution.
- **Light + dark theme** and **keyboard shortcuts** (Space to reveal, 1–4 to rate).
- **Architecture ready for spaced repetition, audio, speech recognition, HSK progression, and leaderboards.**

## 🧱 Tech Stack

**Frontend**: React 19, TypeScript, Vite 7, TanStack Router & Query, Tailwind CSS v4, Zustand, shadcn/ui, Recharts.

**Backend**: Lovable Cloud (Postgres + Row Level Security + Auth + serverless server functions via TanStack Start).

> ℹ️ The platform is deployed on Cloudflare Workers via TanStack Start. The original spec called for
> Express + Prisma + Docker; if you want to mirror that backend, the schema lives in
> `supabase/migrations/` and the API surface is defined by the server functions in
> `src/lib/*.functions.ts` — straightforward to port.

## 🚀 Run locally

```bash
bun install
# Copy .env.example to .env and fill it in (see "Environment" below)
bun run dev
```

Open <http://localhost:8080>.

### Environment

| Variable | Where |
| --- | --- |
| `VITE_SUPABASE_URL` / `SUPABASE_URL` | Postgres + Auth endpoint |
| `VITE_SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_PUBLISHABLE_KEY` | Public/anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only — admin/maintenance |

Database schema lives in `supabase/migrations/`. Apply with the Supabase CLI or paste into the SQL editor.

## 🗂 Project structure

```
src/
├── components/       # SiteHeader, Flashcard, FlagButtons, shadcn/ui primitives
├── lib/              # *.functions.ts (server RPCs), Zustand store, utils
├── routes/           # File-based routing (TanStack Router)
│   ├── _authenticated/   # Auth-gated subtree (study, reading, collections, contribute, stats)
│   └── *.tsx             # Public routes (/, /auth, /browse)
├── integrations/     # Auto-generated Supabase + Lovable auth clients (do not edit)
└── styles.css        # Design tokens (Tailwind v4 @theme)
supabase/
└── migrations/       # Database schema
```

## 🤝 Contributing

We love contributions! Read **[CONTRIBUTING.md](./CONTRIBUTING.md)** and our **[Code of Conduct](./CODE_OF_CONDUCT.md)**.

Great first issues: add HSK 2 vocabulary, add reading passages, improve accessibility, add
spaced repetition (SM-2), add audio playback via the Web Speech API, build a leaderboard page.

## 📜 License

[MIT](./LICENSE) © LangsHub contributors

---

加油! 🇨🇳