import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface Metrics {
  codeQuality: number;
  documentation: number;
  testCoverage: number;
  projectStructure: number;
  gitPractices: number;
  realWorldRelevance: number;
}

interface MetricsBarChartProps {
  metrics: Metrics;
}

const MetricsBarChart = ({ metrics }: MetricsBarChartProps) => {
  const data = [
    { name: "Code", value: metrics.codeQuality },
    { name: "Docs", value: metrics.documentation },
    { name: "Tests", value: metrics.testCoverage },
    { name: "Structure", value: metrics.projectStructure },
    { name: "Git", value: metrics.gitPractices },
    { name: "Relevance", value: metrics.realWorldRelevance },
  ];

  const getBarColor = (value: number) => {
    if (value >= 80) return "hsl(170 80% 45%)";
    if (value >= 60) return "hsl(45 93% 58%)";
    if (value >= 40) return "hsl(30 90% 55%)";
    return "hsl(0 84% 60%)";
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
          <p className="text-sm font-medium text-foreground">
            {payload[0].payload.name}: <span className="text-primary">{payload[0].value}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-secondary/30 p-6">
      <h3 className="mb-4 font-semibold text-center">Metrics Comparison</h3>
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 47% 18%)" vertical={false} />
            <XAxis 
              dataKey="name" 
              tick={{ fill: "hsl(215 20% 65%)", fontSize: 11 }}
              axisLine={{ stroke: "hsl(222 47% 18%)" }}
              tickLine={false}
            />
            <YAxis 
              domain={[0, 100]} 
              tick={{ fill: "hsl(215 20% 50%)", fontSize: 10 }}
              axisLine={{ stroke: "hsl(222 47% 18%)" }}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(222 47% 14%)" }} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.value)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MetricsBarChart;
