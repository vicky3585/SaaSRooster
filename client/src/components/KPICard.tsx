import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface KPICardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  iconColor?: string;
}

export default function KPICard({ title, value, icon: Icon, trend, iconColor = "bg-primary/10 text-primary" }: KPICardProps) {
  return (
    <Card className="p-6 h-32" data-testid={`card-kpi-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <h3 className="text-3xl font-bold">{value}</h3>
          {trend && (
            <div className="mt-2">
              <Badge
                variant="secondary"
                className={`text-xs px-2 py-0.5 ${
                  trend.isPositive
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {trend.isPositive ? "↑" : "↓"} {trend.value}
              </Badge>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );
}
