import { FileText, CheckCircle, AlertCircle, Info } from "lucide-react";

interface SummaryCardProps {
  summary: string;
  strengths: string[];
  weaknesses: string[];
}

const SummaryCard = ({ summary, strengths, weaknesses }: SummaryCardProps) => {
  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-secondary/30 p-6">
      <div className="mb-4 flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Analysis Summary</h3>
      </div>

      {/* Main summary */}
      <p className="mb-6 leading-relaxed text-muted-foreground">{summary}</p>

      {/* Strengths */}
      {strengths.length > 0 && (
        <div className="mb-4">
          <div className="mb-2 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium text-accent">Strengths</span>
          </div>
          <ul className="space-y-2">
            {strengths.map((strength, index) => (
              <li
                key={index}
                className="flex items-start gap-2 rounded-lg bg-accent/10 p-3 text-sm"
              >
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <span className="text-foreground/90">{strength}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Weaknesses */}
      {weaknesses.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-[hsl(45_93%_58%)]" />
            <span className="text-sm font-medium text-[hsl(45_93%_58%)]">Areas for Improvement</span>
          </div>
          <ul className="space-y-2">
            {weaknesses.map((weakness, index) => (
              <li
                key={index}
                className="flex items-start gap-2 rounded-lg bg-[hsl(45_93%_58%)]/10 p-3 text-sm"
              >
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(45_93%_58%)]" />
                <span className="text-foreground/90">{weakness}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SummaryCard;
