import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_MODEL = "gemini-2.5-flash";

async function ghFetch(path) {
  const res = await fetch(`https://api.github.com/repos/${path}`, {
    headers: {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "RepoRoast/1.0",
    },
  });
  if (!res.ok) return null;
  return res.json();
}

async function ghFetchRaw(url) {
  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github.v3.raw",
      "User-Agent": "RepoRoast/1.0",
    },
  });
  if (!res.ok) return null;
  return res.text();
}

async function fetchRepoData(repo) {
  const [repoInfo, commits, tree, languages] = await Promise.all([
    ghFetch(repo),
    ghFetch(`${repo}/commits?per_page=30`),
    ghFetch(`${repo}/git/trees/HEAD?recursive=1`),
    ghFetch(`${repo}/languages`),
  ]);

  if (!repoInfo) throw new Error("Repository not found or not accessible");

  const fileTree = tree?.tree
    ?.filter((f) => f.type === "blob")
    ?.map((f) => f.path) || [];

  const commitMessages = commits?.map((c) => c.commit?.message) || [];

  // Fetch key files
  const keyFiles = [
    "package.json",
    "requirements.txt",
    "Cargo.toml",
    "go.mod",
    "pom.xml",
    "build.gradle",
    "Gemfile",
    "pyproject.toml",
  ];
  const foundDeps = fileTree.find((f) => keyFiles.includes(f));
  let depsContent = null;
  if (foundDeps) {
    depsContent = await ghFetchRaw(
      `https://api.github.com/repos/${repo}/contents/${foundDeps}`
    );
  }

  let readmeContent = null;
  const readmeFile = fileTree.find((f) =>
    /^readme\.(md|txt|rst)$/i.test(f)
  );
  if (readmeFile) {
    readmeContent = await ghFetchRaw(
      `https://api.github.com/repos/${repo}/contents/${readmeFile}`
    );
    if (readmeContent && readmeContent.length > 3000) {
      readmeContent = readmeContent.slice(0, 3000) + "\n...[truncated]";
    }
  }

  // Sample some source files for code quality review
  const codeExtensions = /\.(js|ts|jsx|tsx|py|go|rs|java|rb|php|c|cpp|cs|swift|kt)$/;
  const codeFiles = fileTree.filter((f) => codeExtensions.test(f));
  const sampleFiles = codeFiles.slice(0, 5);
  const codeSnippets = {};
  await Promise.all(
    sampleFiles.map(async (filePath) => {
      const content = await ghFetchRaw(
        `https://api.github.com/repos/${repo}/contents/${filePath}`
      );
      if (content) {
        codeSnippets[filePath] =
          content.length > 2000
            ? content.slice(0, 2000) + "\n...[truncated]"
            : content;
      }
    })
  );

  return {
    name: repoInfo.full_name,
    description: repoInfo.description,
    stars: repoInfo.stargazers_count,
    forks: repoInfo.forks_count,
    openIssues: repoInfo.open_issues_count,
    language: repoInfo.language,
    languages,
    createdAt: repoInfo.created_at,
    updatedAt: repoInfo.updated_at,
    defaultBranch: repoInfo.default_branch,
    totalFiles: fileTree.length,
    fileTree: fileTree.slice(0, 100),
    commitMessages: commitMessages.slice(0, 30),
    depsFile: foundDeps,
    depsContent:
      depsContent && depsContent.length > 3000
        ? depsContent.slice(0, 3000) + "\n...[truncated]"
        : depsContent,
    readme: readmeContent,
    codeSnippets,
  };
}

const LANG_NAMES = {
  en: "English", ru: "Russian", zh: "Chinese", ja: "Japanese", ko: "Korean",
  es: "Spanish", de: "German", fr: "French", pt: "Portuguese", hi: "Hindi", tr: "Turkish",
};

function buildPrompt(data, lang = "en") {
  const langInstruction = lang !== "en"
    ? `\n\nIMPORTANT: Write ALL text output (label, verdict, section titles, section text) in ${LANG_NAMES[lang] || "English"}. The JSON keys must stay in English, but all string VALUES must be in ${LANG_NAMES[lang] || "English"}. Be natural and fluent in ${LANG_NAMES[lang] || "English"} — don't just translate, write as a native speaker would.`
    : "";

  return `You are RepoRoast — a brutally honest, sarcastic, and technically sharp AI code reviewer. Your job is to "roast" a GitHub repository. Be funny, savage, and specific. Reference actual file names, variable names, commit messages, and dependency choices you see in the data. No generic roasts — every observation must be grounded in the actual repo data.${langInstruction}

REPO DATA:
- Name: ${data.name}
- Description: ${data.description || "None (already a red flag)"}
- Primary Language: ${data.language || "Unknown"}
- Languages: ${JSON.stringify(data.languages || {})}
- Stars: ${data.stars} | Forks: ${data.forks} | Open Issues: ${data.openIssues}
- Created: ${data.createdAt} | Last Updated: ${data.updatedAt}
- Total Files: ${data.totalFiles}
- Default Branch: ${data.defaultBranch}

FILE TREE (first 100 files):
${data.fileTree.join("\n")}

RECENT COMMIT MESSAGES (last 30):
${data.commitMessages.map((m, i) => `${i + 1}. ${m}`).join("\n")}

${data.depsFile ? `DEPENDENCIES (${data.depsFile}):\n${data.depsContent}\n` : "No dependency file found (do they even have dependencies?)."}

${data.readme ? `README:\n${data.readme}\n` : "No README found (of course)."}

${Object.keys(data.codeSnippets).length > 0 ? `CODE SAMPLES:\n${Object.entries(data.codeSnippets).map(([path, code]) => `--- ${path} ---\n${code}`).join("\n\n")}` : "No code files found to review."}

INSTRUCTIONS:
Analyze this repo and produce a roast. Be specific — mention actual file names, actual commit messages, actual variable names, actual dependencies. Make it funny and savage but TECHNICALLY ACCURATE. Don't make up things that aren't in the data.

Score from 0-100 (0 = complete disaster, 100 = perfect). Most repos should score 20-60. Only truly well-maintained repos score above 70. Score harshly but fairly.

Return ONLY valid JSON (no markdown, no backticks) in this exact format:
{
  "score": <number 0-100>,
  "label": "<short sarcastic label, 2-4 words>",
  "verdict": "<2-3 sentence overall verdict, sarcastic but insightful>",
  "sections": [
    {
      "icon": "<emoji>",
      "title": "<section title>",
      "severity": "<CRITICAL|FATAL|HIGH|MEDIUM|LOW>",
      "color": "<#ff1e3c for CRITICAL/FATAL, #ff4500 for HIGH, #ff8c00 for MEDIUM, #ffd60a for LOW>",
      "text": "<2-3 sentences of specific, funny, technically grounded roast>"
    }
  ]
}

Generate 4-6 sections. Each section should focus on a different aspect (e.g., code quality, naming, commits, dependencies, project structure, README, testing, etc.). Use the actual data to make specific observations.`;
}

export async function POST(request) {
  try {
    const { repo, lang } = await request.json();

    if (!repo || !/^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/.test(repo)) {
      return Response.json(
        { error: "Invalid repository format. Use: username/repository" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "Server configuration error: missing API key" },
        { status: 500 }
      );
    }

    const repoData = await fetchRepoData(repo);
    const prompt = buildPrompt(repoData, lang);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Parse JSON from response (handle potential markdown wrapping)
    let jsonStr = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1];
    jsonStr = jsonStr.trim();

    const roast = JSON.parse(jsonStr);

    // Validate structure
    if (
      typeof roast.score !== "number" ||
      !roast.label ||
      !roast.verdict ||
      !Array.isArray(roast.sections)
    ) {
      throw new Error("Invalid response structure from AI");
    }

    roast.score = Math.max(0, Math.min(100, Math.round(roast.score)));

    return Response.json(roast);
  } catch (err) {
    console.error("Roast API error:", err);
    const message =
      err.message === "Repository not found or not accessible"
        ? err.message
        : "Failed to generate roast. Please try again.";
    return Response.json({ error: message }, { status: err.message.includes("not found") ? 404 : 500 });
  }
}
