import { DefectStatus } from "@workspace/api-client-react";

interface StatusBadgeProps {
  status: DefectStatus;
}

export function DefectStatusBadge({ status }: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "reported":
        return { label: "Reported", className: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900/50" };
      case "ready_to_retest":
        return { label: "Ready to Retest", className: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-900/50" };
      case "closed":
        return { label: "Closed", className: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-900/50" };
      default:
        return { label: status, className: "bg-gray-100 text-gray-800 border-gray-200" };
    }
  };

  const config = getStatusConfig();

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-none text-xs font-mono font-medium border ${config.className}`}>
      {config.label}
    </span>
  );
}
