import { Code, GitBranch, FileText, TestTube, FolderTree, Users } from "lucide-react";

interface Metrics {
  codeQuality: number;
  documentation: number;
  testCoverage: number;
  projectStructure: number;
  gitPractices: number;
  realWorldRelevance: number;
}

interface MetricsGridProps {
  metrics: Metrics;
}

const MetricsGrid = ({ metrics }: MetricsGridProps) => {
  const metricItems = [
    { label: "Code Quality", value: metrics.codeQuality, icon: Code },
    { label: "Documentation", value: metrics.documentation, icon: FileText },
    { label: "Test Coverage", value: metrics.testCoverage, icon: TestTube },
    { label: "Project Structure", value: metrics.projectStructure, icon: FolderTree },
    { label: "Git Practices", value: metrics.gitPractices, icon: GitBranch },
    { label: "Real-World Relevance", value: metrics.realWorldRelevance, icon: Users },
  ];

  const getColor = (value: number) => {
    if (value >= 80) return "text-accent";
    if (value >= 60) return "text-[hsl(45_93%_58%)]";
    if (value >= 40) return "text-[hsl(30_90%_55%)]";
    return "text-destructive";
  };

  const getBarColor = (value: number) => {
    if (value >= 80) return "bg-accent";
    if (value >= 60) return "bg-[hsl(45_93%_58%)]";
    if (value >= 40) return "bg-[hsl(30_90%_55%)]";
    return "bg-destructive";
  };

  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-secondary/30 p-6">
      <h3 className="mb-6 font-semibold">Detailed Metrics</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {metricItems.map((item) => (
          <div key={item.label} className="rounded-xl bg-secondary/50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{item.label}</span>
              </div>
              <span className={`text-lg font-bold ${getColor(item.value)}`}>
                {item.value}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className={`h-full rounded-full ${getBarColor(item.value)} transition-all duration-1000 ease-out`}
                style={{ width: `${item.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MetricsGrid;
