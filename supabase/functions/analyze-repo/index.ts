import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
  const urlParts = repoUrl.replace("https://github.com/", "").replace(/\/$/, "").split("/");
  const owner = urlParts[0];
  const repo = urlParts[1];

  const headers: Record<string, string> = {
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "GitGrade-Analyzer",
  };

  // Fetch basic repo info
  const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
  if (!repoRes.ok) {
    throw new Error(`Repository not found or not accessible: ${repoRes.status}`);
  }
  const repoData = await repoRes.json();

  // Fetch languages
  const languagesRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, { headers });
  const languages = languagesRes.ok ? await languagesRes.json() : {};

  // Fetch README
  let readmeContent = "";
  let hasReadme = false;
  try {
    const readmeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, { headers });
    if (readmeRes.ok) {
      const readmeData = await readmeRes.json();
      hasReadme = true;
      const decoded = atob(readmeData.content.replace(/\n/g, ""));
      readmeContent = decoded.substring(0, 2000); // Limit for AI context
    }
  } catch {
    hasReadme = false;
  }

  // Fetch commits
  const commitsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=30`, { headers });
  const commitsData = commitsRes.ok ? await commitsRes.json() : [];
  const recentCommits = commitsData.slice(0, 10).map((c: any) => ({
    message: c.commit?.message || "",
    date: c.commit?.committer?.date || "",
  }));

  // Fetch contributors
  const contributorsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contributors?per_page=1`, { headers });
  const contributors = contributorsRes.ok ? parseInt(contributorsRes.headers.get("Link")?.match(/page=(\d+)>; rel="last"/)?.[1] || "1") : 1;

  // Fetch branches
  const branchesRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches?per_page=1`, { headers });
  const branches = branchesRes.ok ? parseInt(branchesRes.headers.get("Link")?.match(/page=(\d+)>; rel="last"/)?.[1] || "1") : 1;

  // Fetch file structure (root directory)
  const contentsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, { headers });
  const contents = contentsRes.ok ? await contentsRes.json() : [];
  const fileStructure = Array.isArray(contents) ? contents.map((f: any) => `${f.type}: ${f.name}`) : [];

  // Check for tests, license, CI
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { repoUrl } = await req.json();

    if (!repoUrl || !repoUrl.includes("github.com")) {
      return new Response(
        JSON.stringify({ error: "Please provide a valid GitHub repository URL" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Fetching GitHub data for:", repoUrl);
    const repoData = await fetchGitHubData(repoUrl);
    console.log("Repository data fetched:", repoData.name);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
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

    console.log("Sending to AI for analysis...");
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
      console.error("AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("AI analysis failed");
    }

    const aiData = await aiResponse.json();
    let analysisContent = aiData.choices?.[0]?.message?.content || "";
    
    // Clean up the response - remove markdown code blocks if present
    analysisContent = analysisContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    console.log("AI response received, parsing...");
    
    let analysis;
    try {
      analysis = JSON.parse(analysisContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", analysisContent);
      throw new Error("Failed to parse analysis results");
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error analyzing repository:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Failed to analyze repository" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
