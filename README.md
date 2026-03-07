# RepoRoast 🔥

**AI-powered code review as punishment.** Paste your GitHub repo — get a brutally honest, sarcastic roast of your code.

Live: [truer-repo-roast.vercel.app](https://truer-repo-roast.vercel.app/)

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

git clone https://github.com/TruerDev/RepoRoast.git
cd RepoRoast
npm install

Create `.env.local`:

GEMINI_API_KEY=your-gemini-api-key

Run:

npm run dev

Open http://localhost:3000

## Deploy

One-click deploy to Vercel — just add `GEMINI_API_KEY` as an environment variable.

## License

MIT
