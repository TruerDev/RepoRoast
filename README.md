# RepoRoast 🔥

**AI-powered code review as punishment.** Paste your GitHub repo — get a brutally honest, sarcastic roast of your code.

Live: [reporoast.vercel.app](https://reporoast.vercel.app)

## What it does

- Analyzes your public GitHub repository (file structure, commits, dependencies, actual code)
- Generates a savage but technically accurate code review using Google Gemini AI
- Scores your repo 0-100 with severity-rated cards
- Supports 11 languages

## Tech stack

- **Next.js 14** — frontend + API routes
- **Google Gemini 2.5 Flash** — AI roast generation
- **GitHub API** — repo data fetching

## Getting started

```bash
git clone https://github.com/TruerDev/RepoRoast.git
cd RepoRoast
npm install
```

Create `.env.local`:
```
GEMINI_API_KEY=your-gemini-api-key
```

Run:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy

One-click deploy to Vercel — just add `GEMINI_API_KEY` as an environment variable.

## Support

- [Patreon](https://patreon.com/TruerDev)
- [Boosty](https://boosty.to/truerdev) (для поддержки из РФ)

## License

MIT
