import { Badge } from "@/components/ui/badge";
import { type VariantProps } from "class-variance-authority";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

interface StatusBadgeProps {
  status: "paid" | "overdue" | "draft" | "pending" | "partial" | "void" | "sent";
  className?: string;
}

const statusConfig: Record<
  StatusBadgeProps["status"],
  { label: string; variant: BadgeVariant; className: string }
> = {
  paid: {
    label: "Paid",
    variant: "default",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  overdue: {
    label: "Overdue",
    variant: "destructive",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
  draft: {
    label: "Draft",
    variant: "secondary",
    className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  },
  pending: {
    label: "Pending",
    variant: "secondary",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  partial: {
    label: "Partial",
    variant: "secondary",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  void: {
    label: "Void",
    variant: "secondary",
    className: "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-500",
  },
  sent: {
    label: "Sent",
    variant: "secondary",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge
      variant={config.variant}
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className} ${className || ""}`}
      data-testid={`badge-status-${status}`}
    >
      {config.label}
    </Badge>
  );
}
