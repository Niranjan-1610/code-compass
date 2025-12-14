import { Map, ChevronRight, Target, Clock, Zap } from "lucide-react";

interface RoadmapItem {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

interface RoadmapCardProps {
  roadmap: RoadmapItem[];
}

const RoadmapCard = ({ roadmap }: RoadmapCardProps) => {
  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case "high":
        return {
          bg: "bg-destructive/20",
          text: "text-destructive",
          icon: <Zap className="h-3 w-3" />,
          label: "High Priority",
        };
      case "medium":
        return {
          bg: "bg-[hsl(45_93%_58%)]/20",
          text: "text-[hsl(45_93%_58%)]",
          icon: <Target className="h-3 w-3" />,
          label: "Medium",
        };
      default:
        return {
          bg: "bg-accent/20",
          text: "text-accent",
          icon: <Clock className="h-3 w-3" />,
          label: "Low Priority",
        };
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-secondary/30 p-6">
      <div className="mb-4 flex items-center gap-2">
        <Map className="h-5 w-5 text-accent" />
        <h3 className="font-semibold">Personalized Roadmap</h3>
      </div>

      <p className="mb-6 text-sm text-muted-foreground">
        Follow these actionable steps to improve your repository
      </p>

      <div className="space-y-4">
        {roadmap.map((item, index) => {
          const priorityStyle = getPriorityStyle(item.priority);
          return (
            <div
              key={index}
              className="group relative overflow-hidden rounded-xl border border-border bg-secondary/30 p-4 transition-all duration-300 hover:border-primary/50 hover:bg-secondary/50"
            >
              {/* Step number */}
              <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                {index + 1}
              </div>

              {/* Priority badge */}
              <div className={`mb-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${priorityStyle.bg} ${priorityStyle.text}`}>
                {priorityStyle.icon}
                {priorityStyle.label}
              </div>

              {/* Content */}
              <h4 className="mb-1 flex items-center gap-2 font-medium">
                <ChevronRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" />
                {item.title}
              </h4>
              <p className="ml-6 text-sm text-muted-foreground">{item.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RoadmapCard;
