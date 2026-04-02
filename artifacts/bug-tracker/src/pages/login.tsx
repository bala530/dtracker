import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, BugIcon, LockIcon } from "lucide-react";

interface LoginProps {
  onLogin: (username: string, password: string) => Promise<string | null>;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const err = await onLogin(username, password);
    if (err) setError(err);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary text-primary-foreground mb-2">
            <BugIcon className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-mono font-bold tracking-tight uppercase">DEFECT_TRACKER</h1>
          <p className="text-sm text-muted-foreground font-mono">Sign in to continue</p>
        </div>

        <div className="bg-card border border-border p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="font-mono text-xs uppercase text-muted-foreground">
                Username
              </Label>
              <Input
                id="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="rounded-none focus-visible:ring-primary font-mono"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-mono text-xs uppercase text-muted-foreground">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-none focus-visible:ring-primary font-mono"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive font-mono flex items-center gap-2">
                <LockIcon className="w-3.5 h-3.5 shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full rounded-none font-mono uppercase tracking-wider text-xs"
              disabled={loading || !username || !password}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Sign In
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground font-mono">
          Bug Tracker &mdash; Internal Tool
        </p>
      </div>
    </div>
  );
}
