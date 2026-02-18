import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { Session } from "@supabase/supabase-js";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import RepoInput from "@/components/RepoInput";
import LoadingState from "@/components/LoadingState";
import AnalysisResults, { AnalysisData } from "@/components/AnalysisResults";
import AuthPage from "@/components/AuthPage";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [analyzedUrl, setAnalyzedUrl] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener BEFORE checking session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsAuthLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

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

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return <AuthPage />;
  }

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
        <Header session={session} />
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
