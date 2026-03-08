import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_MODEL = "gemini-2.5-flash";
const GROQ_MODELS = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODELS = [
  "google/gemma-3-27b-it:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "stepfun/step-3.5-flash:free",
  "nvidia/nemotron-3-nano-30b-a3b:free",
  "openrouter/free",
];

// Round-robin indices
let geminiKeyIndex = 0;
let groqKeyIndex = 0;

const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 5;

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimit.get(ip);
  if (!entry || now - entry.start > RATE_LIMIT_WINDOW) {
    rateLimit.set(ip, { start: now, count: 1 });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

function ghHeaders(accept = "application/vnd.github.v3+json") {
  const headers = { Accept: accept, "User-Agent": "RepoRoast/1.0" };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function ghFetch(path) {
  const res = await fetch(`https://api.github.com/repos/${path}`, {
    headers: ghHeaders(),
  });
  if (res.status === 403) {
    const body = await res.json().catch(() => ({}));
    if (body.message?.includes("rate limit")) {
      throw new Error("GitHub API rate limit exceeded. Please try again later.");
    }
  }
  if (!res.ok) return null;
  return res.json();
}

async function ghFetchRaw(url) {
  const res = await fetch(url, {
    headers: ghHeaders("application/vnd.github.v3.raw"),
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

  const fileTree =
    tree?.tree?.filter((f) => f.type === "blob")?.map((f) => f.path) || [];

  const commitMessages = commits?.map((c) => c.commit?.message) || [];

  const keyFiles = [
    "package.json", "requirements.txt", "Cargo.toml", "go.mod",
    "pom.xml", "build.gradle", "Gemfile", "pyproject.toml",
  ];
  const foundDeps = fileTree.find((f) => keyFiles.includes(f));
  let depsContent = null;
  if (foundDeps) {
    depsContent = await ghFetchRaw(
      `https://api.github.com/repos/${repo}/contents/${foundDeps}`
    );
    if (depsContent && depsContent.length > 3000) {
      depsContent = depsContent.slice(0, 3000) + "\n...[truncated]";
    }
  }

  let readmeContent = null;
  const readmeFile = fileTree.find((f) => /^readme\.(md|txt|rst)$/i.test(f));
  if (readmeFile) {
    readmeContent = await ghFetchRaw(
      `https://api.github.com/repos/${repo}/contents/${readmeFile}`
    );
    if (readmeContent && readmeContent.length > 3000) {
      readmeContent = readmeContent.slice(0, 3000) + "\n...[truncated]";
    }
  }

  const codeExtensions =
    /\.(js|ts|jsx|tsx|py|go|rs|java|rb|php|c|cpp|cs|swift|kt)$/;
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
    depsContent,
    readme: readmeContent,
    codeSnippets,
  };
}

const LANG_NAMES = {
  en: "English", ru: "Russian", zh: "Chinese", ja: "Japanese", ko: "Korean",
  es: "Spanish", de: "German", fr: "French", pt: "Portuguese", hi: "Hindi",
  tr: "Turkish",
};

function buildPrompt(data, lang = "en") {
  const now = new Date().toISOString().split("T")[0];

  const langInstruction =
    lang !== "en"
      ? `\n\nIMPORTANT: Write ALL text output (label, verdict, section titles, section text) in ${LANG_NAMES[lang] || "English"}. The JSON keys must stay in English, but all string VALUES must be in ${LANG_NAMES[lang] || "English"}. Be natural and fluent — don't just translate, write as a native speaker would.`
      : "";

  return `You are RepoRoast — a merciless, razor-sharp, technically brilliant AI code critic with the comedic timing of a stand-up comedian and the empathy of a compiler error. You don't just review code — you DESTROY egos while being technically accurate. Your roasts should make developers question their career choices.

RULES OF ENGAGEMENT:
- Be VICIOUS but ACCURATE. Every burn must reference specific files, actual code, real commit messages, or concrete dependency choices from the data.
- NO generic roasts like "messy code" or "bad practices" — name the EXACT file, the EXACT line, the EXACT variable.
- Use dark humor, sarcasm, backhanded compliments, and creative metaphors. Think Gordon Ramsay reviewing code.
- If something is genuinely good, acknowledge it — then immediately pivot to something terrible. The praise makes the roast hit harder.
- Roast the DECISIONS, not the person. Why did they choose THAT library? Why is THAT file 500 lines? Why does THAT commit message say "fix"?
- TODAY'S DATE IS ${now}. The current year is ${now.slice(0, 4)}. All dates in the repo data are real and valid. NEVER say any date is "in the future". NEVER assume the year is 2024 or any other year — use ${now.slice(0, 4)} as the current year.${langInstruction}

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
Produce the most devastatingly funny, technically precise roast possible. Every section must reference SPECIFIC things from the repo — actual filenames, actual code patterns, actual commit messages, actual dependency versions. If you can quote a variable name or a commit message directly, DO IT.

Scoring guide — be HARSH:
- 0-15: Mass destruction. Should be reported to authorities.
- 16-30: Barely functional. The code equivalent of a dumpster fire.
- 31-50: Mediocre. Works by accident, not by design.
- 51-70: Decent but flawed. Like a B-student who copies homework.
- 71-85: Actually good. Rare. Suspicious.
- 86-100: Nearly perfect. Reserve for repos that genuinely impress you.
Most repos land in 20-50. Don't be generous.

Return a JSON object with this exact structure:
{
  "score": <number 0-100>,
  "label": "<short savage label, 2-4 words, make it STING>",
  "verdict": "<2-3 sentence overall verdict — deliver the killing blow. Be theatrical, dramatic, specific.>",
  "sections": [
    {
      "icon": "<emoji>",
      "title": "<punchy section title>",
      "severity": "<CRITICAL|FATAL|HIGH|MEDIUM|LOW>",
      "color": "<#ff1e3c for CRITICAL/FATAL, #ff4500 for HIGH, #ff8c00 for MEDIUM, #ffd60a for LOW>",
      "text": "<3-4 sentences of devastating, specific, technically grounded roast. Quote actual code/filenames/commits. Make it hurt.>"
    }
  ]
}

Generate 5-7 sections. Each must focus on a different aspect (code quality, architecture, naming conventions, commit hygiene, dependency bloat, testing, documentation, security, etc.). Make every word count.`;
}

function parseAIResponse(text) {
  let jsonStr = text;
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) jsonStr = jsonMatch[1];
  jsonStr = jsonStr.trim();

  // Fix invalid escape sequences that LLMs sometimes produce
  jsonStr = jsonStr.replace(/\\(?![nrtbf\\/"])/g, "\\\\");

  try {
    return JSON.parse(jsonStr);
  } catch {
    const objMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (!objMatch) throw new Error("Failed to parse AI response as JSON");
    const cleaned = objMatch[0].replace(/\\(?![nrtbf\\/"])/g, "\\\\");
    return JSON.parse(cleaned);
  }
}

function validateRoast(roast) {
  if (
    typeof roast.score !== "number" ||
    !roast.label ||
    !roast.verdict ||
    !Array.isArray(roast.sections)
  ) {
    throw new Error("Invalid response structure from AI");
  }
  roast.score = Math.max(0, Math.min(100, Math.round(roast.score)));
  return roast;
}

function getGeminiKeys() {
  const keys = [];
  // Support both GEMINI_API_KEYS (comma-separated) and legacy GEMINI_API_KEY
  if (process.env.GEMINI_API_KEYS) {
    keys.push(...process.env.GEMINI_API_KEYS.split(",").map(k => k.trim()).filter(Boolean));
  }
  if (process.env.GEMINI_API_KEY) {
    const single = process.env.GEMINI_API_KEY.trim();
    if (single && !keys.includes(single)) keys.push(single);
  }
  return keys;
}

export async function GET() {
  const geminiKeys = getGeminiKeys().length;
  const groqKeys = (process.env.GROQ_API_KEYS || "").split(",").filter(k => k.trim()).length;
  return Response.json({
    status: "ok",
    geminiKeyCount: geminiKeys,
    hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
    hasGithubToken: !!process.env.GITHUB_TOKEN,
    groqKeyCount: groqKeys,
  });
}

export async function POST(request) {
  try {
    console.log("[roast] POST request received");

    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    if (!checkRateLimit(clientIp)) {
      return Response.json(
        { error: "Too many requests. Please wait a minute before trying again." },
        { status: 429 }
      );
    }

    const { repo, lang } = await request.json();

    if (!repo || !/^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/.test(repo)) {
      return Response.json(
        { error: "Invalid repository format. Use: username/repository" },
        { status: 400 }
      );
    }

    const geminiKeys = getGeminiKeys();
    const groqKeys = (process.env.GROQ_API_KEYS || "").split(",").map(k => k.trim()).filter(Boolean);
    const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();

    if (geminiKeys.length === 0 && !openRouterKey && groqKeys.length === 0) {
      console.error("[roast] No AI API keys configured");
      return Response.json(
        { error: "Server configuration error: no API keys" },
        { status: 500 }
      );
    }

    console.log(`[roast] Fetching repo data for: ${repo}`);
    const repoData = await fetchRepoData(repo);
    const prompt = buildPrompt(repoData, lang);

    let text;
    let usedProvider = "none";

    // 1. Try Gemini first (round-robin across keys)
    if (geminiKeys.length > 0) {
      for (let attempt = 0; attempt < geminiKeys.length; attempt++) {
        const keyIdx = (geminiKeyIndex + attempt) % geminiKeys.length;
        const key = geminiKeys[keyIdx];
        try {
          const genAI = new GoogleGenerativeAI(key);
          const model = genAI.getGenerativeModel({
            model: GEMINI_MODEL,
            generationConfig: { responseMimeType: "application/json" },
          });
          const result = await model.generateContent(prompt);
          text = result.response.text();
          usedProvider = `gemini-key#${keyIdx}`;
          geminiKeyIndex = (keyIdx + 1) % geminiKeys.length;
          console.log(`[roast] Generated via Gemini (key #${keyIdx})`);
          break;
        } catch (geminiErr) {
          console.warn(`[roast] Gemini key #${keyIdx} failed:`, geminiErr.message);
          // Continue trying other keys — each key may have different validity/quota
        }
      }
    }

    // 2. Fallback to OpenRouter (try multiple free models)
    if (!text && openRouterKey) {
      for (const orModel of OPENROUTER_MODELS) {
        try {
          const res = await fetch(OPENROUTER_API_URL, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${openRouterKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://truer-repo-roast.vercel.app",
              "X-Title": "RepoRoast",
            },
            body: JSON.stringify({
              model: orModel,
              messages: [
                { role: "system", content: "You are a JSON-only API. Respond with valid JSON only, no markdown fences." },
                { role: "user", content: prompt },
              ],
              temperature: 0.9,
              max_tokens: 4096,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            text = data.choices?.[0]?.message?.content;
            if (text) {
              usedProvider = `openrouter/${orModel}`;
              console.log(`[roast] Generated via OpenRouter (${orModel})`);
              break;
            }
          } else {
            const body = await res.text();
            console.warn(`[roast] OpenRouter ${orModel} failed (${res.status}):`, body);
          }
        } catch (orErr) {
          console.warn(`[roast] OpenRouter ${orModel} error:`, orErr.message);
        }
      }
    }

    // 3. Fallback to Groq (round-robin across keys, fallback across models)
    if (!text && groqKeys.length > 0) {
      for (const groqModel of GROQ_MODELS) {
        if (text) break;
        for (let attempt = 0; attempt < groqKeys.length; attempt++) {
          const keyIdx = (groqKeyIndex + attempt) % groqKeys.length;
          const key = groqKeys[keyIdx];
          try {
            const res = await fetch(GROQ_API_URL, {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${key}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: groqModel,
                messages: [
                  { role: "system", content: "You are a JSON-only API. Respond with valid JSON only, no markdown fences." },
                  { role: "user", content: prompt },
                ],
                temperature: 0.9,
                max_tokens: 4096,
                response_format: { type: "json_object" },
              }),
            });

            if (!res.ok) {
              const body = await res.text();
              console.warn(`[roast] Groq ${groqModel} key #${keyIdx} failed (${res.status}):`, body);
              if (res.status === 429) continue;
              break; // Non-rate-limit error — try next model
            }

            const data = await res.json();
            text = data.choices?.[0]?.message?.content;
            usedProvider = `groq-${groqModel}-key#${keyIdx}`;
            groqKeyIndex = (keyIdx + 1) % groqKeys.length;
            console.log(`[roast] Generated via Groq ${groqModel} (key #${keyIdx})`);
            break;
          } catch (groqErr) {
            console.warn(`[roast] Groq ${groqModel} key #${keyIdx} error:`, groqErr.message);
          }
        }
      }
    }

    if (!text) {
      throw new Error("All AI providers failed. Please try again later.");
    }

    console.log(`[roast] Raw AI response (first 200 chars):`, text?.slice(0, 200));
    const roast = validateRoast(parseAIResponse(text));
    console.log(`[roast] Success via ${usedProvider}, score: ${roast.score}`);

    return Response.json(roast);
  } catch (err) {
    console.error("Roast API error:", err);

    let message = "Failed to generate roast. Please try again.";
    let status = 500;

    if (err.message.includes("rate limit") || err.message.includes("overloaded") || err.message.includes("All AI providers")) {
      message = err.message;
      status = 429;
    } else if (err.message.includes("not found") || err.message.includes("not accessible")) {
      message = err.message;
      status = 404;
    }

    return Response.json({ error: message }, { status });
  }
}
