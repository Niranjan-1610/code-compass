import ScoreCard from "./ScoreCard";
import SummaryCard from "./SummaryCard";
import RoadmapCard from "./RoadmapCard";
import MetricsGrid from "./MetricsGrid";

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
  return (
    <section className="container mx-auto mt-12 px-4 pb-16">
      {/* Repo info */}
      <div className="mb-8 text-center">
        <p className="text-sm text-muted-foreground">Analysis complete for</p>
        <a
          href={repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-lg text-primary hover:underline"
        >
          {repoUrl.replace("https://github.com/", "")}
        </a>
      </div>

      {/* Results grid */}
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Top row - Score and Summary */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ScoreCard score={data.score} level={data.level} />
          <SummaryCard
            summary={data.summary}
            strengths={data.strengths}
            weaknesses={data.weaknesses}
          />
        </div>

        {/* Metrics */}
        <MetricsGrid metrics={data.metrics} />

        {/* Roadmap */}
        <RoadmapCard roadmap={data.roadmap} />
      </div>
    </section>
  );
};

export default AnalysisResults;
