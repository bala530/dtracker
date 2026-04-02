import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import CreateDefect from "@/pages/create-defect";
import DefectDetail from "@/pages/defect-detail";
import Login from "@/pages/login";
import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

function AppContent() {
  const { authenticated, loading, login, logout, username } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="font-mono text-muted-foreground text-sm animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!authenticated) {
    return <Login onLogin={login} />;
  }

  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Layout onLogout={logout} username={username}>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/defects/new" component={CreateDefect} />
          <Route path="/defects/:id" component={DefectDetail} />
          <Route component={NotFound} />
        </Switch>
      </Layout>
    </WouterRouter>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
