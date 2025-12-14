import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ScoreCardProps {
  score: number;
  level: string;
}

const ScoreCard = ({ score, level }: ScoreCardProps) => {
  const getScoreColor = () => {
    if (score >= 80) return "text-accent";
    if (score >= 60) return "text-[hsl(45_93%_58%)]";
    if (score >= 40) return "text-[hsl(30_90%_55%)]";
    return "text-destructive";
  };

  const getScoreGradient = () => {
    if (score >= 80) return "from-accent to-[hsl(200_95%_55%)]";
    if (score >= 60) return "from-[hsl(45_93%_58%)] to-[hsl(30_90%_55%)]";
    if (score >= 40) return "from-[hsl(30_90%_55%)] to-destructive";
    return "from-destructive to-[hsl(0_70%_50%)]";
  };

  const getIcon = () => {
    if (score >= 70) return <TrendingUp className="h-5 w-5" />;
    if (score >= 40) return <Minus className="h-5 w-5" />;
    return <TrendingDown className="h-5 w-5" />;
  };

  const getLevelBadge = () => {
    const badges: Record<string, { bg: string; text: string }> = {
      "Gold": { bg: "bg-[hsl(45_93%_58%)]/20", text: "text-[hsl(45_93%_58%)]" },
      "Silver": { bg: "bg-muted", text: "text-muted-foreground" },
      "Bronze": { bg: "bg-[hsl(30_50%_40%)]/20", text: "text-[hsl(30_70%_60%)]" },
      "Advanced": { bg: "bg-accent/20", text: "text-accent" },
      "Intermediate": { bg: "bg-primary/20", text: "text-primary" },
      "Beginner": { bg: "bg-secondary", text: "text-muted-foreground" },
    };
    return badges[level] || badges["Beginner"];
  };

  const levelStyle = getLevelBadge();

  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-secondary/30 p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className={`h-5 w-5 ${getScoreColor()}`} />
          <h3 className="font-semibold">Repository Score</h3>
        </div>
        <div className={`flex items-center gap-1 ${getScoreColor()}`}>
          {getIcon()}
        </div>
      </div>

      {/* Score display */}
      <div className="mb-6 flex items-end gap-2">
        <span className={`bg-gradient-to-r ${getScoreGradient()} bg-clip-text text-6xl font-bold text-transparent`}>
          {score}
        </span>
        <span className="mb-2 text-2xl text-muted-foreground">/ 100</span>
      </div>

      {/* Progress bar */}
      <div className="mb-4 h-3 overflow-hidden rounded-full bg-secondary">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${getScoreGradient()} transition-all duration-1000 ease-out`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Level badge */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Level</span>
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${levelStyle.bg} ${levelStyle.text}`}>
          {level}
        </span>
      </div>
    </div>
  );
};

export default ScoreCard;
