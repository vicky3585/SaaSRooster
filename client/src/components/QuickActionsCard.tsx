import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, UserPlus, DollarSign, Receipt } from "lucide-react";

interface QuickAction {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
}

export default function QuickActionsCard() {
  const actions: QuickAction[] = [
    {
      label: "Create Invoice",
      icon: FileText,
      onClick: () => console.log("Create Invoice clicked"),
    },
    {
      label: "Add Customer",
      icon: UserPlus,
      onClick: () => console.log("Add Customer clicked"),
    },
    {
      label: "Record Payment",
      icon: DollarSign,
      onClick: () => console.log("Record Payment clicked"),
    },
    {
      label: "New Expense",
      icon: Receipt,
      onClick: () => console.log("New Expense clicked"),
    },
  ];

  return (
    <Card className="p-6" data-testid="card-quick-actions">
      <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.label}
              variant="outline"
              className="h-24 flex flex-col gap-2 hover-elevate"
              onClick={action.onClick}
              data-testid={`button-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-sm font-medium">{action.label}</span>
            </Button>
          );
        })}
      </div>
    </Card>
  );
}
