import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// --- CORS: restrict to Lovable domains and localhost ---
const ALLOWED_LOCALHOST_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:8080",
  "http://localhost:3000",
];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") || "";
  const isLovableDomain =
    origin.endsWith(".lovable.app") || origin.endsWith(".lovable.dev");
  const isLocalDev = ALLOWED_LOCALHOST_ORIGINS.includes(origin);
  const allowedOrigin =
    isLovableDomain || isLocalDev ? origin : ALLOWED_LOCALHOST_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

// --- Zod schema for AI response validation ---
const RoadmapItemSchema = z.object({
  title: z.string().max(200),
  description: z.string().max(1000),
  priority: z.enum(["high", "medium", "low"]),
});

const AnalysisSchema = z.object({
  score: z.number().min(0).max(100),
  level: z.string().max(50),
  summary: z.string().max(2000),
  strengths: z.array(z.string().max(500)).min(1).max(8),
  weaknesses: z.array(z.string().max(500)).min(1).max(8),
  metrics: z.object({
    codeQuality: z.number().min(0).max(100),
    documentation: z.number().min(0).max(100),
    testCoverage: z.number().min(0).max(100),
    projectStructure: z.number().min(0).max(100),
    gitPractices: z.number().min(0).max(100),
    realWorldRelevance: z.number().min(0).max(100),
  }),
  roadmap: z.array(RoadmapItemSchema).min(2).max(10),
});

interface GitHubFile {
  type: string;
  name: string;
  path: string;
  size?: number;
}

interface GitHubRepoData {
  name: string;
  fullName: string;
  description: string;
  language: string;
  languages: Record<string, number>;
  stars: number;
  forks: number;
  openIssues: number;
  watchers: number;
  size: number;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  defaultBranch: string;
  hasReadme: boolean;
  readmeContent: string;
  hasTests: boolean;
  hasLicense: boolean;
  licenseType: string;
  hasCi: boolean;
  ciTypes: string[];
  hasContributing: boolean;
  hasChangelog: boolean;
  hasCodeOfConduct: boolean;
  hasSecurity: boolean;
  hasDocFolder: boolean;
  commits: number;
  totalCommits: number;
  contributors: number;
  branches: number;
  releases: number;
  fileStructure: string[];
  recentCommits: { message: string; date: string; author: string }[];
  openPRs: number;
  closedIssues: number;
  topics: string[];
  packageJson: Record<string, unknown> | null;
  hasTypeScript: boolean;
  hasDockerfile: boolean;
  hasMakefile: boolean;
}

async function fetchWithRetry(url: string, headers: Record<string, string>, retries = 2): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    const res = await fetch(url, { headers });
    if (res.status === 403 && i < retries) {
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      continue;
    }
    return res;
  }
  return fetch(url, { headers });
}

async function fetchGitHubData(repoUrl: string): Promise<GitHubRepoData> {
  const cleanUrl = repoUrl
    .replace(/\.git$/, "")
    .replace(/\/$/, "")
    .replace("https://github.com/", "")
    .replace("http://github.com/", "");

  const urlParts = cleanUrl.split("/").filter(Boolean);
  const owner = urlParts[0];
  const repo = urlParts[1];

  if (!owner || !repo) {
    throw new Error("Invalid GitHub URL. Please use format: https://github.com/username/repository");
  }

  const githubToken = Deno.env.get("GITHUB_TOKEN");
  const headers: Record<string, string> = {
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "GitGrade-Analyzer",
  };

  if (githubToken) {
    headers["Authorization"] = `Bearer ${githubToken}`;
  }

  // Fetch core repo data
  const repoRes = await fetchWithRetry(`https://api.github.com/repos/${owner}/${repo}`, headers);
  if (!repoRes.ok) {
    if (repoRes.status === 403) {
      const rateLimitRemaining = repoRes.headers.get("X-RateLimit-Remaining");
      if (rateLimitRemaining === "0") {
        throw new Error("GitHub API rate limit exceeded. Please wait a few minutes and try again.");
      }
      throw new Error("Access denied by GitHub. The repository may be private or inaccessible.");
    }
    if (repoRes.status === 404) {
      throw new Error("Repository not found. Please check the URL and ensure it's a public repository.");
    }
    throw new Error(`GitHub API error: ${repoRes.status}`);
  }
  const repoData = await repoRes.json();

  // Parallel fetch everything we need
  const [
    languagesRes,
    readmeRes,
    commitsRes,
    contentsRes,
    releasesRes,
    pullsRes,
    closedIssuesRes,
    contributorsHeaderRes,
    branchesHeaderRes,
    topicsRes,
    allCommitsCountRes,
  ] = await Promise.all([
    fetchWithRetry(`https://api.github.com/repos/${owner}/${repo}/languages`, headers),
    fetchWithRetry(`https://api.github.com/repos/${owner}/${repo}/readme`, headers),
    fetchWithRetry(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=50`, headers),
    fetchWithRetry(`https://api.github.com/repos/${owner}/${repo}/contents`, headers),
    fetchWithRetry(`https://api.github.com/repos/${owner}/${repo}/releases?per_page=1`, headers),
    fetchWithRetry(`https://api.github.com/repos/${owner}/${repo}/pulls?state=open&per_page=1`, headers),
    fetchWithRetry(`https://api.github.com/repos/${owner}/${repo}/issues?state=closed&per_page=1`, headers),
    fetchWithRetry(`https://api.github.com/repos/${owner}/${repo}/contributors?per_page=1`, headers),
    fetchWithRetry(`https://api.github.com/repos/${owner}/${repo}/branches?per_page=1`, headers),
    fetchWithRetry(`https://api.github.com/repos/${owner}/${repo}/topics`, { ...headers, "Accept": "application/vnd.github.mercy-preview+json" }),
    fetchWithRetry(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`, headers),
  ]);

  const languages = languagesRes.ok ? await languagesRes.json() : {};

  // README
  let readmeContent = "";
  let hasReadme = false;
  if (readmeRes.ok) {
    try {
      const readmeData = await readmeRes.json();
      hasReadme = true;
      const decoded = atob(readmeData.content.replace(/\n/g, ""));
      readmeContent = decoded.substring(0, 4000); // More content for better analysis
    } catch { /* ignore */ }
  }

  // Commits
  const commitsData = commitsRes.ok ? await commitsRes.json() : [];
  const recentCommits = Array.isArray(commitsData) ? commitsData.slice(0, 20).map((c: {
    commit?: { message?: string; committer?: { date?: string }; author?: { name?: string } };
    author?: { login?: string };
  }) => ({
    message: (c.commit?.message || "").split("\n")[0].substring(0, 120),
    date: c.commit?.committer?.date || "",
    author: c.author?.login || c.commit?.author?.name || "unknown",
  })) : [];

  // Total commits count via Link header
  let totalCommits = commitsData.length;
  if (allCommitsCountRes.ok) {
    const linkHeader = allCommitsCountRes.headers.get("Link") || "";
    const match = linkHeader.match(/page=(\d+)>; rel="last"/);
    if (match) totalCommits = parseInt(match[1]);
  }

  // File structure
  const contents = contentsRes.ok ? await contentsRes.json() : [];
  const fileStructure: string[] = Array.isArray(contents)
    ? contents.map((f: GitHubFile) => `${f.type}: ${f.name}`)
    : [];

  const fileNames = Array.isArray(contents) ? contents.map((f: GitHubFile) => f.name.toLowerCase()) : [];

  // Detect CI types
  const ciTypes: string[] = [];
  if (fileNames.includes(".github")) ciTypes.push("GitHub Actions");
  if (fileNames.includes(".gitlab-ci.yml")) ciTypes.push("GitLab CI");
  if (fileNames.includes("jenkinsfile")) ciTypes.push("Jenkins");
  if (fileNames.includes(".travis.yml")) ciTypes.push("Travis CI");
  if (fileNames.includes(".circleci")) ciTypes.push("CircleCI");
  if (fileNames.includes("bitbucket-pipelines.yml")) ciTypes.push("Bitbucket Pipelines");

  // Check for specific files
  const hasTests = fileNames.some(f =>
    f.includes("test") || f.includes("spec") || f.includes("__tests__") || f.includes("jest") || f.includes("vitest") || f.includes("cypress") || f.includes("playwright")
  );
  const hasLicense = fileNames.some(f => f.includes("license") || f.includes("licence"));
  const licenseType = repoData.license?.spdx_id || repoData.license?.name || "None";
  const hasCi = ciTypes.length > 0;
  const hasContributing = fileNames.some(f => f.includes("contributing"));
  const hasChangelog = fileNames.some(f => f.includes("changelog") || f.includes("changes") || f.includes("history"));
  const hasCodeOfConduct = fileNames.some(f => f.includes("code_of_conduct") || f.includes("conduct"));
  const hasSecurity = fileNames.some(f => f.includes("security"));
  const hasDocFolder = fileNames.some(f => f === "docs" || f === "doc" || f === "documentation");
  const hasTypeScript = "TypeScript" in languages || fileNames.some(f => f.includes("tsconfig"));
  const hasDockerfile = fileNames.some(f => f.includes("dockerfile") || f.includes("docker-compose"));
  const hasMakefile = fileNames.some(f => f === "makefile" || f === "makefile.am");

  // Fetch package.json if it's a JS/TS project
  let packageJson: Record<string, unknown> | null = null;
  if (fileNames.includes("package.json")) {
    try {
      const pkgRes = await fetchWithRetry(`https://api.github.com/repos/${owner}/${repo}/contents/package.json`, headers);
      if (pkgRes.ok) {
        const pkgData = await pkgRes.json();
        const decoded = atob(pkgData.content.replace(/\n/g, ""));
        packageJson = JSON.parse(decoded);
      }
    } catch { /* ignore */ }
  }

  // Releases count
  let releases = 0;
  if (releasesRes.ok) {
    const linkHeader = releasesRes.headers.get("Link") || "";
    const match = linkHeader.match(/page=(\d+)>; rel="last"/);
    releases = match ? parseInt(match[1]) : (await releasesRes.json()).length > 0 ? 1 : 0;
  }

  // Open PRs
  let openPRs = 0;
  if (pullsRes.ok) {
    const linkHeader = pullsRes.headers.get("Link") || "";
    const match = linkHeader.match(/page=(\d+)>; rel="last"/);
    openPRs = match ? parseInt(match[1]) : (await pullsRes.json()).length;
  }

  // Closed issues
  let closedIssues = 0;
  if (closedIssuesRes.ok) {
    const linkHeader = closedIssuesRes.headers.get("Link") || "";
    const match = linkHeader.match(/page=(\d+)>; rel="last"/);
    closedIssues = match ? parseInt(match[1]) : (await closedIssuesRes.json()).length;
  }

  const contributors = contributorsHeaderRes.ok
    ? parseInt(contributorsHeaderRes.headers.get("Link")?.match(/page=(\d+)>; rel="last"/)?.[1] || "1")
    : 1;

  const branches = branchesHeaderRes.ok
    ? parseInt(branchesHeaderRes.headers.get("Link")?.match(/page=(\d+)>; rel="last"/)?.[1] || "1")
    : 1;

  const topics = topicsRes.ok ? (await topicsRes.json()).names || [] : [];

  return {
    name: repoData.name,
    fullName: repoData.full_name || `${owner}/${repo}`,
    description: repoData.description || "",
    language: repoData.language || "Unknown",
    languages,
    stars: repoData.stargazers_count || 0,
    forks: repoData.forks_count || 0,
    openIssues: repoData.open_issues_count || 0,
    watchers: repoData.watchers_count || 0,
    size: repoData.size || 0,
    createdAt: repoData.created_at || "",
    updatedAt: repoData.updated_at || "",
    pushedAt: repoData.pushed_at || "",
    defaultBranch: repoData.default_branch || "main",
    hasReadme,
    readmeContent,
    hasTests,
    hasLicense,
    licenseType,
    hasCi,
    ciTypes,
    hasContributing,
    hasChangelog,
    hasCodeOfConduct,
    hasSecurity,
    hasDocFolder,
    commits: commitsData.length,
    totalCommits,
    contributors,
    branches,
    releases,
    fileStructure,
    recentCommits,
    openPRs,
    closedIssues,
    topics,
    packageJson,
    hasTypeScript,
    hasDockerfile,
    hasMakefile,
  };
}

// Safe user-facing error messages
const ERROR_MESSAGES = {
  INVALID_URL: "Invalid repository URL. Use format: https://github.com/username/repository",
  ANALYSIS_FAILED: "Unable to analyze repository at this time. Please try again.",
  SERVICE_UNAVAILABLE: "Service temporarily unavailable. Please try again later.",
  RATE_LIMITED: "Too many requests. Please try again in a moment.",
  NOT_FOUND: "Repository not found. Please check the URL and ensure it is a public repository.",
  ACCESS_DENIED: "Access denied. The repository may be private or inaccessible.",
};

const GITHUB_URL_REGEX = /^https:\/\/github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+(\/|\.git)?$/;

function validateGitHubUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed || trimmed.length > 500) {
    throw new Error("INVALID_URL");
  }
  if (!GITHUB_URL_REGEX.test(trimmed)) {
    throw new Error("INVALID_URL");
  }
  return trimmed;
}

function getSafeErrorMessage(error: unknown): { message: string; status: number } {
  if (!(error instanceof Error)) {
    return { message: ERROR_MESSAGES.ANALYSIS_FAILED, status: 500 };
  }
  const msg = error.message;
  if (msg === "INVALID_URL") return { message: ERROR_MESSAGES.INVALID_URL, status: 400 };
  if (msg.includes("not found") || msg.includes("404")) return { message: ERROR_MESSAGES.NOT_FOUND, status: 404 };
  if (msg.includes("private") || msg.includes("Access denied")) return { message: ERROR_MESSAGES.ACCESS_DENIED, status: 403 };
  if (msg.includes("rate limit") || msg.includes("Rate limit")) return { message: ERROR_MESSAGES.RATE_LIMITED, status: 429 };
  return { message: ERROR_MESSAGES.ANALYSIS_FAILED, status: 500 };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Parse and validate request body ---
    const body = await req.json();
    const rawUrl = body?.repoUrl;

    let validatedUrl: string;
    try {
      validatedUrl = validateGitHubUrl(rawUrl ?? "");
    } catch {
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.INVALID_URL }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const repoData = await fetchGitHubData(validatedUrl);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("Missing required API configuration");
      throw new Error("SERVICE_UNAVAILABLE");
    }

    // Calculate repo age in days
    const createdDate = new Date(repoData.createdAt);
    const now = new Date();
    const ageDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

    const packageDeps = repoData.packageJson
      ? `Dependencies: ${Object.keys((repoData.packageJson.dependencies as Record<string,string>) || {}).join(", ") || "none"}
Dev Dependencies: ${Object.keys((repoData.packageJson.devDependencies as Record<string,string>) || {}).join(", ") || "none"}
Scripts: ${Object.keys((repoData.packageJson.scripts as Record<string,string>) || {}).join(", ") || "none"}`
      : "No package.json found";

    const prompt = `You are a senior software engineer and open-source project evaluator with 15+ years of experience. Analyze this GitHub repository with deep technical scrutiny and provide an ACCURATE, HONEST, and DETAILED evaluation.

=== REPOSITORY OVERVIEW ===
Full Name: ${repoData.fullName}
Description: ${repoData.description || "No description provided"}
Topics/Tags: ${repoData.topics.join(", ") || "none"}
Primary Language: ${repoData.language}
All Languages: ${JSON.stringify(repoData.languages)}
Repository Age: ${ageDays} days (created ${repoData.createdAt.split("T")[0]})
Last Push: ${repoData.pushedAt.split("T")[0]}
Last Updated: ${repoData.updatedAt.split("T")[0]}
Repo Size: ${repoData.size} KB

=== COMMUNITY & ENGAGEMENT ===
Stars: ${repoData.stars}
Forks: ${repoData.forks}
Watchers: ${repoData.watchers}
Contributors: ${repoData.contributors}
Open Issues: ${repoData.openIssues}
Closed Issues: ${repoData.closedIssues}
Open Pull Requests: ${repoData.openPRs}
Releases Published: ${repoData.releases}

=== VERSION CONTROL & WORKFLOW ===
Total Commits (estimated): ${repoData.totalCommits}
Recent Commits Analyzed: ${repoData.commits}
Active Branches: ${repoData.branches}
Default Branch: ${repoData.defaultBranch}

Recent Commit Messages (newest first):
${repoData.recentCommits.map((c, i) => `${i + 1}. [${c.date.split("T")[0]}] ${c.author}: ${c.message}`).join("\n")}

=== DOCUMENTATION & PROJECT HEALTH ===
Has README: ${repoData.hasReadme}
Has CONTRIBUTING guide: ${repoData.hasContributing}
Has CHANGELOG: ${repoData.hasChangelog}
Has CODE_OF_CONDUCT: ${repoData.hasCodeOfConduct}
Has SECURITY policy: ${repoData.hasSecurity}
Has /docs folder: ${repoData.hasDocFolder}
License: ${repoData.licenseType}

README Content:
${repoData.readmeContent || "No README found"}

=== TESTING & QUALITY ===
Has Test Files/Folders: ${repoData.hasTests}
Has TypeScript: ${repoData.hasTypeScript}
Has Dockerfile: ${repoData.hasDockerfile}
Has Makefile: ${repoData.hasMakefile}

=== CI/CD ===
Has CI/CD: ${repoData.hasCi}
CI Systems Detected: ${repoData.ciTypes.join(", ") || "none"}

=== ROOT FILE STRUCTURE ===
${repoData.fileStructure.join("\n")}

=== PACKAGE INFORMATION ===
${packageDeps}

=== EVALUATION INSTRUCTIONS ===
Score each metric STRICTLY and ACCURATELY based on evidence above. Do NOT be overly generous. Here's how to score:

**codeQuality (0-100):**
- Look at: TypeScript usage, language diversity, repo size relative to complexity, commit quality
- 80+: Strong typed language, clean commits, professional structure
- 60-79: Good practices but minor issues
- 40-59: Mixed quality signals
- <40: Major quality concerns

**documentation (0-100):**  
- Look at: README quality and length, CONTRIBUTING guide, inline docs presence, /docs folder, changelog
- 90+: Comprehensive README, contributing guide, changelog, API docs
- 70-89: Good README with usage examples
- 50-69: Basic README present
- 30-49: Minimal or incomplete README
- <30: No README or just a few lines

**testCoverage (0-100):**
- Look at: test files presence, CI/CD (implies automated testing), test frameworks in package.json
- 80+: Clear test setup with CI running them
- 60-79: Tests present but no clear CI integration
- 40-59: Some test indicators
- 20-39: No obvious test files
- <20: No tests whatsoever

**projectStructure (0-100):**
- Look at: file organization, use of standard directories (src, lib, tests, docs), docker/makefile, monorepo patterns
- Evaluate root-level cleanliness and logical separation of concerns

**gitPractices (0-100):**
- Look at: commit message quality (conventional commits? descriptive?), number of branches, release cadence, PR usage, issues resolved
- Good commits: "feat: add user authentication" vs bad: "fix stuff", "wip", "asdf"

**realWorldRelevance (0-100):**
- Look at: stars, forks, contributors, releases, open issues being addressed, topics/tags, description clarity, active maintenance
- A project with 0 stars/forks that's clearly a learning exercise should score lower than a maintained OSS tool

**Overall score:** Weighted average roughly: codeQuality(25%) + documentation(20%) + testCoverage(15%) + projectStructure(15%) + gitPractices(15%) + realWorldRelevance(10%)

**Level mapping:**
- 85-100: "Expert" 
- 70-84: "Advanced"
- 55-69: "Intermediate"
- 40-54: "Beginner"
- 0-39: "Needs Work"

Respond ONLY with this exact JSON (no markdown, no explanation):
{
  "score": <calculated weighted score 0-100>,
  "level": "<one of: Needs Work | Beginner | Intermediate | Advanced | Expert>",
  "summary": "<3-4 sentences: what the project is, its current quality level, what makes it stand out or fall short, and overall impression>",
  "strengths": ["<specific strength with evidence>", "<specific strength>", "<specific strength>"],
  "weaknesses": ["<specific weakness with evidence>", "<specific weakness>", "<specific weakness>"],
  "metrics": {
    "codeQuality": <0-100>,
    "documentation": <0-100>,
    "testCoverage": <0-100>,
    "projectStructure": <0-100>,
    "gitPractices": <0-100>,
    "realWorldRelevance": <0-100>
  },
  "roadmap": [
    {"title": "<actionable title>", "description": "<specific, actionable description referencing actual repo data>", "priority": "high" | "medium" | "low"},
    ...4-6 items ordered by impact
  ]
}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "system",
            content: "You are a senior software engineer with 15+ years of experience evaluating open-source projects. Be precise, honest, and evidence-based in your evaluations. Never inflate scores. Always respond with valid JSON only — no markdown, no code blocks, no commentary.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      console.error("AI API error:", aiResponse.status);

      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: ERROR_MESSAGES.RATE_LIMITED }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: ERROR_MESSAGES.SERVICE_UNAVAILABLE }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("ANALYSIS_FAILED");
    }

    const aiData = await aiResponse.json();
    let analysisContent = aiData.choices?.[0]?.message?.content || "";

    analysisContent = analysisContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let analysis;
    try {
      const parsed = JSON.parse(analysisContent);
      analysis = AnalysisSchema.parse(parsed);
    } catch {
      console.error("Failed to parse or validate AI response");
      throw new Error("ANALYSIS_FAILED");
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const corsHeaders = getCorsHeaders(req);
    console.error("Error analyzing repository:", error instanceof Error ? error.message : "Unknown error");
    const { message, status } = getSafeErrorMessage(error);
    return new Response(
      JSON.stringify({ error: message }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
