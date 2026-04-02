import { Link } from "wouter";
import { BugIcon, LogOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: React.ReactNode;
  onLogout?: () => void;
  username?: string | null;
}

export function Layout({ children, onLogout, username }: LayoutProps) {
  return (
    <div className="min-h-[100dvh] flex flex-col">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-5xl mx-auto w-full px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors font-medium">
            <div className="bg-primary text-primary-foreground p-1.5 flex items-center justify-center">
              <BugIcon className="w-4 h-4" strokeWidth={3} />
            </div>
            <span className="font-mono font-bold tracking-tight">DEFECT_TRACKER</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/defects/new" className="text-sm font-medium hover:text-primary transition-colors">
              Log Defect
            </Link>
            {username && (
              <span className="text-xs font-mono text-muted-foreground hidden sm:block">{username}</span>
            )}
            {onLogout && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className="h-7 px-2 text-xs font-mono rounded-none text-muted-foreground hover:text-foreground"
              >
                <LogOutIcon className="w-3.5 h-3.5 mr-1.5" />
                Sign Out
              </Button>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
