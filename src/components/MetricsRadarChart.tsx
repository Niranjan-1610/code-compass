import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";

interface Metrics {
  codeQuality: number;
  documentation: number;
  testCoverage: number;
  projectStructure: number;
  gitPractices: number;
  realWorldRelevance: number;
}

interface MetricsRadarChartProps {
  metrics: Metrics;
}

const MetricsRadarChart = ({ metrics }: MetricsRadarChartProps) => {
  const data = [
    { subject: "Code Quality", value: metrics.codeQuality, fullMark: 100 },
    { subject: "Documentation", value: metrics.documentation, fullMark: 100 },
    { subject: "Test Coverage", value: metrics.testCoverage, fullMark: 100 },
    { subject: "Structure", value: metrics.projectStructure, fullMark: 100 },
    { subject: "Git Practices", value: metrics.gitPractices, fullMark: 100 },
    { subject: "Real-World", value: metrics.realWorldRelevance, fullMark: 100 },
  ];

  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-secondary/30 p-6">
      <h3 className="mb-4 font-semibold text-center">Performance Overview</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
            <PolarGrid 
              stroke="hsl(222 47% 25%)" 
              strokeDasharray="3 3"
            />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ 
                fill: "hsl(215 20% 65%)", 
                fontSize: 11,
                fontWeight: 500
              }}
            />
            <PolarRadiusAxis 
              angle={30} 
              domain={[0, 100]} 
              tick={{ fill: "hsl(215 20% 50%)", fontSize: 10 }}
              tickCount={5}
            />
            <Radar
              name="Score"
              dataKey="value"
              stroke="hsl(270 76% 60%)"
              fill="hsl(270 76% 60%)"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MetricsRadarChart;
