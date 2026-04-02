import { Link } from "wouter";
import { BugIcon } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
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
          </div>
        </div>
      </header>
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
