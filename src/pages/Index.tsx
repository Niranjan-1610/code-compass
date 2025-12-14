import { useState } from "react";
import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import RepoInput from "@/components/RepoInput";
import LoadingState from "@/components/LoadingState";
import AnalysisResults, { AnalysisData } from "@/components/AnalysisResults";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [analyzedUrl, setAnalyzedUrl] = useState("");
  const { toast } = useToast();

  const handleAnalyze = async (url: string) => {
    setIsLoading(true);
    setAnalysisData(null);
    setAnalyzedUrl(url);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-repo", {
        body: { repoUrl: url },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setAnalysisData(data);
      toast({
        title: "Analysis Complete!",
        description: "Your repository has been analyzed successfully.",
      });
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze repository. Please try again.",
        variant: "destructive",
      });
      setAnalyzedUrl("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>GitGrade - AI-Powered GitHub Repository Analyzer</title>
        <meta
          name="description"
          content="Get instant AI-powered feedback on your GitHub repository. Analyze code quality, documentation, and receive personalized improvement roadmaps."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main>
          <Hero />
          <RepoInput onAnalyze={handleAnalyze} isLoading={isLoading} />
          
          {isLoading && <LoadingState />}
          
          {analysisData && !isLoading && (
            <AnalysisResults data={analysisData} repoUrl={analyzedUrl} />
          )}
        </main>
      </div>
    </>
  );
};

export default Index;
