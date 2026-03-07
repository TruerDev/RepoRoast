export const metadata = {
  title: "RepoRoast — AI Code Review as Punishment",
  description: "Paste your GitHub repo. We'll tell you the truth. Sarcastic AI code reviews.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Bebas+Neue&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ background: "#0d0d0d", margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
