import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import StatusBadge from "./StatusBadge";

interface Activity {
  id: string;
  type: string;
  description: string;
  time: string;
  status?: "paid" | "overdue" | "draft" | "pending" | "partial" | "void" | "sent";
}

interface RecentActivityCardProps {
  activities: Activity[];
}

export default function RecentActivityCard({ activities }: RecentActivityCardProps) {
  return (
    <Card className="p-6" data-testid="card-recent-activity">
      <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
      <ScrollArea className="h-80">
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start justify-between gap-4 pb-4 border-b last:border-0"
              data-testid={`activity-${activity.id}`}
            >
              <div className="flex-1">
                <p className="font-medium text-sm">{activity.type}</p>
                <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
              </div>
              {activity.status && <StatusBadge status={activity.status} />}
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
