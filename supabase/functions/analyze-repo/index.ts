import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GitHubRepoData {
  name: string;
  description: string;
  language: string;
  languages: Record<string, number>;
  stars: number;
  forks: number;
  openIssues: number;
  hasReadme: boolean;
  readmeContent: string;
  hasTests: boolean;
  hasLicense: boolean;
  hasCi: boolean;
  commits: number;
  contributors: number;
  branches: number;
  fileStructure: string[];
  recentCommits: { message: string; date: string }[];
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

  const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
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

  const languagesRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, { headers });
  const languages = languagesRes.ok ? await languagesRes.json() : {};

  let readmeContent = "";
  let hasReadme = false;
  try {
    const readmeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, { headers });
    if (readmeRes.ok) {
      const readmeData = await readmeRes.json();
      hasReadme = true;
      const decoded = atob(readmeData.content.replace(/\n/g, ""));
      readmeContent = decoded.substring(0, 2000);
    }
  } catch {
    hasReadme = false;
  }

  const commitsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=30`, { headers });
  const commitsData = commitsRes.ok ? await commitsRes.json() : [];
  const recentCommits = commitsData.slice(0, 10).map((c: { commit?: { message?: string; committer?: { date?: string } } }) => ({
    message: c.commit?.message || "",
    date: c.commit?.committer?.date || "",
  }));

  const contributorsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contributors?per_page=1`, { headers });
  const contributors = contributorsRes.ok ? parseInt(contributorsRes.headers.get("Link")?.match(/page=(\d+)>; rel="last"/)?.[1] || "1") : 1;

  const branchesRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches?per_page=1`, { headers });
  const branches = branchesRes.ok ? parseInt(branchesRes.headers.get("Link")?.match(/page=(\d+)>; rel="last"/)?.[1] || "1") : 1;

  const contentsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, { headers });
  const contents = contentsRes.ok ? await contentsRes.json() : [];
  const fileStructure = Array.isArray(contents) ? contents.map((f: { type: string; name: string }) => `${f.type}: ${f.name}`) : [];

  const hasTests = fileStructure.some((f: string) => 
    f.toLowerCase().includes("test") || 
    f.toLowerCase().includes("spec") ||
    f.toLowerCase().includes("__tests__")
  );
  const hasLicense = fileStructure.some((f: string) => f.toLowerCase().includes("license"));
  const hasCi = fileStructure.some((f: string) => 
    f.includes(".github") || 
    f.includes(".gitlab-ci") || 
    f.includes("Jenkinsfile") ||
    f.includes(".travis")
  );

  return {
    name: repoData.name,
    description: repoData.description || "",
    language: repoData.language || "Unknown",
    languages,
    stars: repoData.stargazers_count || 0,
    forks: repoData.forks_count || 0,
    openIssues: repoData.open_issues_count || 0,
    hasReadme,
    readmeContent,
    hasTests,
    hasLicense,
    hasCi,
    commits: commitsData.length,
    contributors,
    branches,
    fileStructure,
    recentCommits,
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
  UNAUTHORIZED: "Authentication required. Please sign in to analyze repositories.",
  USER_RATE_LIMITED: "You have reached the analysis limit (10 per hour). Please try again later.",
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
  if (msg === "UNAUTHORIZED") return { message: ERROR_MESSAGES.UNAUTHORIZED, status: 401 };
  if (msg === "USER_RATE_LIMITED") return { message: ERROR_MESSAGES.USER_RATE_LIMITED, status: 429 };
  if (msg.includes("not found") || msg.includes("404")) return { message: ERROR_MESSAGES.NOT_FOUND, status: 404 };
  if (msg.includes("private") || msg.includes("Access denied")) return { message: ERROR_MESSAGES.ACCESS_DENIED, status: 403 };
  if (msg.includes("rate limit") || msg.includes("Rate limit")) return { message: ERROR_MESSAGES.RATE_LIMITED, status: 429 };
  return { message: ERROR_MESSAGES.ANALYSIS_FAILED, status: 500 };
}

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Authentication check ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.UNAUTHORIZED }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.UNAUTHORIZED }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Rate limiting (service role client to bypass RLS) ---
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const now = new Date();
    const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS);

    const { data: rateLimitData } = await serviceClient
      .from("user_rate_limits")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (rateLimitData) {
      const recordWindowStart = new Date(rateLimitData.window_start);
      if (recordWindowStart > windowStart && rateLimitData.request_count >= RATE_LIMIT_MAX) {
        return new Response(
          JSON.stringify({ error: ERROR_MESSAGES.USER_RATE_LIMITED }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      // Reset window or increment counter
      if (recordWindowStart <= windowStart) {
        await serviceClient.from("user_rate_limits").update({
          request_count: 1,
          window_start: now.toISOString(),
          last_request: now.toISOString(),
        }).eq("user_id", user.id);
      } else {
        await serviceClient.from("user_rate_limits").update({
          request_count: rateLimitData.request_count + 1,
          last_request: now.toISOString(),
        }).eq("user_id", user.id);
      }
    } else {
      await serviceClient.from("user_rate_limits").insert({
        user_id: user.id,
        request_count: 1,
        window_start: now.toISOString(),
        last_request: now.toISOString(),
      });
    }

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

    const prompt = `You are an expert code reviewer and mentor. Analyze this GitHub repository data and provide a comprehensive evaluation.

Repository: ${repoData.name}
Description: ${repoData.description}
Primary Language: ${repoData.language}
Languages Used: ${Object.keys(repoData.languages).join(", ")}
Stars: ${repoData.stars}, Forks: ${repoData.forks}
Has README: ${repoData.hasReadme}
Has Tests: ${repoData.hasTests}
Has License: ${repoData.hasLicense}
Has CI/CD: ${repoData.hasCi}
Commits (recent): ${repoData.commits}
Contributors: ${repoData.contributors}
Branches: ${repoData.branches}

File Structure:
${repoData.fileStructure.join("\n")}

Recent Commit Messages:
${repoData.recentCommits.map(c => `- ${c.message}`).join("\n")}

README Content (excerpt):
${repoData.readmeContent || "No README found"}

Based on this data, provide a JSON response with the following structure:
{
  "score": (0-100 overall score based on code quality, documentation, tests, git practices, structure),
  "level": ("Beginner" | "Intermediate" | "Advanced" OR "Bronze" | "Silver" | "Gold"),
  "summary": "A 2-3 sentence evaluation of the repository's current quality",
  "strengths": ["strength1", "strength2", "strength3"] (2-4 specific strengths),
  "weaknesses": ["weakness1", "weakness2", "weakness3"] (2-4 specific areas for improvement),
  "metrics": {
    "codeQuality": (0-100 based on language choice, structure, and patterns),
    "documentation": (0-100 based on README and comments),
    "testCoverage": (0-100 based on test presence and structure),
    "projectStructure": (0-100 based on folder organization),
    "gitPractices": (0-100 based on commits, branches, issues),
    "realWorldRelevance": (0-100 based on usefulness and completeness)
  },
  "roadmap": [
    {"title": "Step title", "description": "What to do and why", "priority": "high" | "medium" | "low"},
    ... (4-6 actionable steps ordered by priority)
  ]
}

Be honest but constructive. Focus on actionable feedback that would help a developer improve.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are an expert code reviewer. Always respond with valid JSON only, no markdown formatting.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
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
      analysis = JSON.parse(analysisContent);
    } catch {
      console.error("Failed to parse AI response");
      throw new Error("ANALYSIS_FAILED");
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error analyzing repository:", error instanceof Error ? error.message : "Unknown error");
    const { message, status } = getSafeErrorMessage(error);
    return new Response(
      JSON.stringify({ error: message }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
