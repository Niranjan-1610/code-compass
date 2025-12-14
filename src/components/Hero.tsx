import { ArrowRight, Code, GitBranch, Star } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative overflow-hidden pb-8 pt-32">
      {/* Background gradient effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 top-0 h-96 w-96 rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute -right-40 top-40 h-96 w-96 rounded-full bg-accent/20 blur-[120px]" />
      </div>

      <div className="container relative mx-auto px-4 text-center">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-2 text-sm">
          <Star className="h-4 w-4 text-accent" />
          <span className="text-muted-foreground">AI-Powered Code Analysis</span>
        </div>

        {/* Title */}
        <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
          Grade Your{" "}
          <span className="bg-gradient-to-r from-primary to-[hsl(280_90%_70%)] bg-clip-text text-transparent">
            GitHub
          </span>{" "}
          Repository
        </h1>

        {/* Description */}
        <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
          Get instant AI-powered feedback on your code quality, project structure, and documentation. 
          Receive a personalized roadmap to improve your repository.
        </p>

        {/* Features */}
        <div className="mx-auto mb-12 flex max-w-3xl flex-wrap items-center justify-center gap-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Code className="h-4 w-4 text-primary" />
            <span>Code Quality</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <GitBranch className="h-4 w-4 text-accent" />
            <span>Git Best Practices</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowRight className="h-4 w-4 text-primary" />
            <span>Personalized Roadmap</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
