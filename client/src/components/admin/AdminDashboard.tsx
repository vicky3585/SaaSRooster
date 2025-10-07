import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Building2, Users, CreditCard, TrendingUp, DollarSign, Package } from "lucide-react";
import { adminApiRequest } from "@/pages/AdminPanel";

export default function AdminDashboard() {
  const { data: organizations = [] } = useQuery({
    queryKey: ["/api/admin/organizations"],
    queryFn: () => adminApiRequest("GET", "/api/admin/organizations"),
  });

  const stats = [
    {
      name: "Total Organizations",
      value: organizations.length,
      icon: Building2,
      color: "bg-blue-500/10 text-blue-500",
    },
    {
      name: "Total Users",
      value: organizations.reduce((sum: number, org: any) => sum + (org.memberCount || 0), 0),
      icon: Users,
      color: "bg-green-500/10 text-green-500",
    },
    {
      name: "Active Subscriptions",
      value: organizations.filter((org: any) => org.subscriptionStatus === "active" || org.subscriptionStatus === "trialing").length,
      icon: CreditCard,
      color: "bg-purple-500/10 text-purple-500",
    },
    {
      name: "Trial Accounts",
      value: organizations.filter((org: any) => org.subscriptionStatus === "trialing").length,
      icon: TrendingUp,
      color: "bg-orange-500/10 text-orange-500",
    },
  ];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Platform Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of your SaaS platform metrics and activity
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.name} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.name}</p>
                <p className="text-3xl font-bold mt-2">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Organizations</h3>
          <div className="space-y-3">
            {organizations.slice(0, 5).map((org: any) => (
              <div key={org.id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                <div>
                  <p className="font-medium">{org.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(org.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-sm px-2 py-1 bg-background rounded border">
                  {org.subscriptionStatus}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Subscription Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">Active</span>
              </div>
              <span className="font-semibold">
                {organizations.filter((org: any) => org.subscriptionStatus === "active").length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm">Trial</span>
              </div>
              <span className="font-semibold">
                {organizations.filter((org: any) => org.subscriptionStatus === "trialing").length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm">Past Due</span>
              </div>
              <span className="font-semibold">
                {organizations.filter((org: any) => org.subscriptionStatus === "past_due").length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <span className="text-sm">Cancelled</span>
              </div>
              <span className="font-semibold">
                {organizations.filter((org: any) => org.subscriptionStatus === "canceled").length}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
