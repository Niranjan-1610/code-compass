import { Github, ExternalLink } from "lucide-react";
import ScoreCard from "./ScoreCard";
import SummaryCard from "./SummaryCard";
import RoadmapCard from "./RoadmapCard";
import MetricsGrid from "./MetricsGrid";
import MetricsRadarChart from "./MetricsRadarChart";
import MetricsBarChart from "./MetricsBarChart";

export interface AnalysisData {
  score: number;
  level: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  metrics: {
    codeQuality: number;
    documentation: number;
    testCoverage: number;
    projectStructure: number;
    gitPractices: number;
    realWorldRelevance: number;
  };
  roadmap: {
    title: string;
    description: string;
    priority: "high" | "medium" | "low";
  }[];
}

interface AnalysisResultsProps {
  data: AnalysisData;
  repoUrl: string;
}

const AnalysisResults = ({ data, repoUrl }: AnalysisResultsProps) => {
  const repoName = repoUrl.replace("https://github.com/", "").replace(".git", "");
  
  return (
    <section className="container mx-auto mt-12 px-4 pb-16">
      {/* Professional Header */}
      <div className="mb-10 text-center">
        <div className="mb-4 inline-flex items-center gap-3 rounded-full border border-border bg-secondary/50 px-5 py-2.5">
          <Github className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-muted-foreground">Analysis Complete</span>
        </div>
        <h2 className="mb-2 text-2xl font-bold md:text-3xl">Repository Analysis Report</h2>
        <a
          href={repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 font-mono text-lg text-primary transition-colors hover:text-primary/80"
        >
          {repoName}
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      {/* Results grid */}
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Top row - Score and Summary */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ScoreCard score={data.score} level={data.level} />
          <SummaryCard
            summary={data.summary}
            strengths={data.strengths}
            weaknesses={data.weaknesses}
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          <MetricsRadarChart metrics={data.metrics} />
          <MetricsBarChart metrics={data.metrics} />
        </div>

        {/* Detailed Metrics */}
        <MetricsGrid metrics={data.metrics} />

        {/* Roadmap */}
        <RoadmapCard roadmap={data.roadmap} />
      </div>
    </section>
  );
};

export default AnalysisResults;
