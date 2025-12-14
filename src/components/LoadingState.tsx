import { GitBranch, Code, FileText, TestTube } from "lucide-react";

const LoadingState = () => {
  const steps = [
    { icon: GitBranch, label: "Fetching repository data..." },
    { icon: Code, label: "Analyzing code quality..." },
    { icon: FileText, label: "Reviewing documentation..." },
    { icon: TestTube, label: "Generating insights..." },
  ];

  return (
    <section className="container mx-auto mt-12 px-4">
      <div className="mx-auto max-w-xl">
        <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-secondary/30 p-8">
          {/* Animated spinner */}
          <div className="mb-6 flex justify-center">
            <div className="relative h-20 w-20">
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
              <div className="absolute inset-2 animate-spin rounded-full border-4 border-accent/30 border-b-accent" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
            </div>
          </div>

          <h3 className="mb-6 text-center text-lg font-semibold">
            Analyzing Repository...
          </h3>

          {/* Steps */}
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div
                key={step.label}
                className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3"
                style={{
                  animation: `pulse 2s infinite`,
                  animationDelay: `${index * 0.5}s`,
                }}
              >
                <step.icon className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">{step.label}</span>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            This may take a moment depending on repository size
          </p>
        </div>
      </div>
    </section>
  );
};

export default LoadingState;
