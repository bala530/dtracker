import { useState } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { 
  useListDefects, 
  useGetDefectStats, 
  ListDefectsStatus,
  getListDefectsQueryKey,
  getGetDefectStatsQueryKey
} from "@workspace/api-client-react";
import { DefectStatusBadge } from "@/components/defect-status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SearchIcon, FilterIcon, PlusIcon, BugIcon, CheckCircle2Icon, AlertCircleIcon, RotateCwIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const [statusFilter, setStatusFilter] = useState<ListDefectsStatus | "all">("all");
  
  const params = statusFilter !== "all" ? { status: statusFilter } : {};
  
  // Need to provide queryOptions for the custom hooks
  const { data: defects, isLoading: isLoadingDefects } = useListDefects(params, {
    query: {
      queryKey: getListDefectsQueryKey(params)
    }
  });

  const { data: stats, isLoading: isLoadingStats } = useGetDefectStats({
    query: {
      queryKey: getGetDefectStatsQueryKey()
    }
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Defect Tracker</h1>
          <p className="text-muted-foreground mt-1">Monitor, triage, and resolve software issues.</p>
        </div>
        <Link href="/defects/new">
          <Button className="w-full md:w-auto font-mono uppercase tracking-wider text-xs">
            <PlusIcon className="w-4 h-4 mr-2" />
            Log Defect
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          title="Total Defects" 
          value={stats?.total} 
          isLoading={isLoadingStats} 
          icon={<BugIcon className="w-4 h-4 text-muted-foreground" />} 
        />
        <StatCard 
          title="Reported" 
          value={stats?.reported} 
          isLoading={isLoadingStats} 
          icon={<AlertCircleIcon className="w-4 h-4 text-red-500" />} 
          className="border-t-4 border-t-red-500"
        />
        <StatCard 
          title="Ready to Retest" 
          value={stats?.readyToRetest} 
          isLoading={isLoadingStats} 
          icon={<RotateCwIcon className="w-4 h-4 text-amber-500" />} 
          className="border-t-4 border-t-amber-500"
        />
        <StatCard 
          title="Closed" 
          value={stats?.closed} 
          isLoading={isLoadingStats} 
          icon={<CheckCircle2Icon className="w-4 h-4 text-emerald-500" />} 
          className="border-t-4 border-t-emerald-500"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between bg-card border border-border p-2">
          <div className="flex items-center gap-2 w-full md:max-w-sm">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-[180px] border-none bg-transparent focus:ring-0 rounded-none shadow-none">
                <div className="flex items-center gap-2">
                  <FilterIcon className="w-4 h-4 text-muted-foreground" />
                  <SelectValue placeholder="Filter by status" />
                </div>
              </SelectTrigger>
              <SelectContent rounded="none">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="reported">Reported</SelectItem>
                <SelectItem value="ready_to_retest">Ready to Retest</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border font-mono">
                <tr>
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Environment</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Reported On</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingDefects ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-full max-w-md" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-20" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    </tr>
                  ))
                ) : defects?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No defects found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  defects?.map((defect) => (
                    <tr key={defect.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors group cursor-pointer" onClick={() => window.location.href = `/defects/${defect.id}`}>
                      <td className="px-4 py-3 font-mono font-medium text-foreground whitespace-nowrap">
                        <Link href={`/defects/${defect.id}`} onClick={e => e.stopPropagation()} className="hover:text-primary transition-colors">
                          {defect.defectId}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-medium truncate max-w-[200px] md:max-w-md lg:max-w-xl">
                        {defect.description}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 text-muted-foreground border border-border">
                          {defect.environment}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <DefectStatusBadge status={defect.status} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {format(new Date(defect.createdAt), "MMM d, yyyy")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, isLoading, icon, className = "" }: { title: string, value?: number, isLoading: boolean, icon: React.ReactNode, className?: string }) {
  return (
    <Card className={`rounded-none shadow-none ${className}`}>
      <CardContent className="p-4 flex flex-col gap-1">
        <div className="flex items-center justify-between text-muted-foreground text-sm font-medium">
          {title}
          {icon}
        </div>
        {isLoading ? (
          <Skeleton className="h-8 w-16 mt-1" />
        ) : (
          <div className="text-2xl font-bold font-mono">{value || 0}</div>
        )}
      </CardContent>
    </Card>
  );
}
