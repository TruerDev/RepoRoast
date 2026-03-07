import "./globals.css";

export const metadata = {
  title: "RepoRoast — AI Code Review as Punishment",
  description: "Paste your GitHub repo. We'll roast your code with brutally honest, sarcastic AI reviews. Get a score, laugh, cry, and maybe fix your code.",
  keywords: ["code review", "github", "ai", "roast", "code quality", "repository analyzer"],
  authors: [{ name: "TruerDev" }],
  openGraph: {
    title: "RepoRoast — AI Code Review as Punishment",
    description: "Paste your GitHub repo. We'll roast your code with brutally honest, sarcastic AI reviews.",
    url: "https://reporoast.vercel.app",
    siteName: "RepoRoast",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "RepoRoast — AI Code Review as Punishment",
    description: "Paste your GitHub repo. We'll roast your code with brutally honest, sarcastic AI reviews.",
  },
  metadataBase: new URL("https://reporoast.vercel.app"),
};

export const viewport = {
  themeColor: "#0d0d0d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Bebas+Neue&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔥</text></svg>" />
      </head>
      <body style={{ background: "#0d0d0d", margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
