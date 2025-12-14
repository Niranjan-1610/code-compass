import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";

interface RepoInputProps {
  onAnalyze: (url: string) => void;
  isLoading: boolean;
}

const RepoInput = ({ onAnalyze, isLoading }: RepoInputProps) => {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onAnalyze(url.trim());
    }
  };

  return (
    <section className="container mx-auto px-4">
      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl">
        <div className="relative flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="url"
              placeholder="https://github.com/username/repository"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="h-14 rounded-xl border-border bg-secondary/50 pl-12 pr-4 text-base placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
              disabled={isLoading}
            />
          </div>
          <Button
            type="submit"
            variant="hero"
            size="xl"
            disabled={!url.trim() || isLoading}
            className="rounded-xl"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                Analyze
              </>
            )}
          </Button>
        </div>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Paste any public GitHub repository URL to get started
        </p>
      </form>
    </section>
  );
};

export default RepoInput;
