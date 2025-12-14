import { Code, GitBranch, Star, BarChart3, Shield, Zap } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative overflow-hidden pb-12 pt-32">
      {/* Background gradient effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-primary/15 blur-[150px]" />
        <div className="absolute -right-40 top-40 h-[400px] w-[400px] rounded-full bg-accent/15 blur-[150px]" />
        <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[hsl(45_93%_58%)]/10 blur-[100px]" />
      </div>

      <div className="container relative mx-auto px-4 text-center">
        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-5 py-2.5 text-sm font-medium backdrop-blur-sm">
          <Star className="h-4 w-4 text-primary" />
          <span className="text-primary">AI-Powered Code Analysis</span>
        </div>

        {/* Title */}
        <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-7xl">
          Analyze & Grade Your{" "}
          <span className="relative inline-block">
            <span className="bg-gradient-to-r from-primary via-[hsl(280_90%_70%)] to-accent bg-clip-text text-transparent">
              GitHub
            </span>
            <span className="absolute -bottom-2 left-0 h-1 w-full rounded-full bg-gradient-to-r from-primary to-accent opacity-50" />
          </span>{" "}
          Repository
        </h1>

        {/* Description */}
        <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
          Get instant AI-powered insights on code quality, project structure, and documentation. 
          Receive actionable recommendations with detailed metrics and visual reports.
        </p>

        {/* Features Grid */}
        <div className="mx-auto mb-12 grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {[
            { icon: Code, label: "Code Quality", color: "text-primary" },
            { icon: GitBranch, label: "Git Practices", color: "text-accent" },
            { icon: BarChart3, label: "Visual Reports", color: "text-[hsl(45_93%_58%)]" },
            { icon: Shield, label: "Best Practices", color: "text-primary" },
            { icon: Zap, label: "Instant Analysis", color: "text-accent" },
            { icon: Star, label: "Score & Level", color: "text-[hsl(45_93%_58%)]" },
          ].map((feature, index) => (
            <div 
              key={index}
              className="flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-secondary/30 p-4 backdrop-blur-sm transition-all hover:border-border hover:bg-secondary/50"
            >
              <feature.icon className={`h-5 w-5 ${feature.color}`} />
              <span className="text-xs font-medium text-muted-foreground">{feature.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
