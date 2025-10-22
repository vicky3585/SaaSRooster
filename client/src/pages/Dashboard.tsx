import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  DollarSign, 
  FileText, 
  ShoppingCart, 
  AlertCircle, 
  Users,
  TrendingUp,
  Plus,
  Receipt,
  UserPlus,
  Bell,
  ArrowDownCircle,
  ArrowUpCircle,
  FileCheck,
  RefreshCcw,
  Calendar,
  AlertTriangle
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format } from "date-fns";

type VitalStat = {
  title: string;
  value: string | number;
  count?: number;
  color: string;
  icon: any;
};

type Organization = {
  id: string;
  name: string;
  trialEndsAt: string | null;
  subscriptionStatus: "trialing" | "active" | "past_due" | "canceled" | "expired";
  planId: "free" | "basic" | "pro" | "enterprise";
};

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [chartPeriod, setChartPeriod] = useState("30");

  // Fetch current organization data
  const { data: organization } = useQuery<Organization>({
    queryKey: ["/api/organizations/current"],
  });

  // Fetch dashboard stats
  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch revenue chart data
  const { data: revenueData = [] } = useQuery<Array<{ date: string; amount: number }>>({
    queryKey: [`/api/dashboard/revenue-chart?days=${chartPeriod}`],
    enabled: !!chartPeriod,
  });

  // Fetch invoice distribution
  const { data: invoiceDistribution = [] } = useQuery<Array<{ status: string; value: number; fill: string }>>({
    queryKey: ["/api/dashboard/invoice-distribution"],
  });

  // Fetch recent activities
  const { data: recentActivities = [] } = useQuery<Array<{ type: string; description: string; time: string; status: string }>>({
    queryKey: ["/api/dashboard/recent-activities"],
  });

  const vitalStats: VitalStat[] = [
    {
      title: "Amount Outstanding",
      value: `₹${(stats as any)?.amountOutstanding?.toLocaleString('en-IN') || '0'}`,
      color: "border-l-orange-500",
      icon: DollarSign,
    },
    {
      title: "Unpaid Invoices",
      value: (stats as any)?.unpaidInvoices || 0,
      count: (stats as any)?.unpaidInvoices || 0,
      color: "border-l-red-500",
      icon: FileText,
    },
    {
      title: "Open Quotation",
      value: (stats as any)?.openQuotations || 0,
      count: (stats as any)?.openQuotations || 0,
      color: "border-l-yellow-500",
      icon: FileCheck,
    },
    {
      title: "Unpaid Purchases",
      value: (stats as any)?.unpaidPurchases || 0,
      count: (stats as any)?.unpaidPurchases || 0,
      color: "border-l-purple-500",
      icon: ShoppingCart,
    },
    {
      title: "Staff Present Today",
      value: (stats as any)?.staffPresent || 0,
      count: (stats as any)?.staffPresent || 0,
      color: "border-l-green-500",
      icon: Users,
    },
  ];

  const quickActions = [
    {
      label: "New Invoice",
      icon: Receipt,
      color: "bg-blue-500 hover:bg-blue-600",
      onClick: () => setLocation("/invoices"),
    },
    {
      label: "Add Purchase",
      icon: ShoppingCart,
      color: "bg-purple-500 hover:bg-purple-600",
      onClick: () => setLocation("/purchase-orders"),
    },
    {
      label: "Add Expense",
      icon: TrendingUp,
      color: "bg-orange-500 hover:bg-orange-600",
      onClick: () => setLocation("/expenses"),
    },
    {
      label: "New Quotation",
      icon: FileCheck,
      color: "bg-green-500 hover:bg-green-600",
      onClick: () => setLocation("/quotations"),
    },
    {
      label: "Add Customer",
      icon: UserPlus,
      color: "bg-blue-500 hover:bg-blue-600",
      onClick: () => setLocation("/customers"),
    },
    {
      label: "Payment In",
      icon: ArrowDownCircle,
      color: "bg-emerald-500 hover:bg-emerald-600",
      onClick: () => setLocation("/invoices"),
    },
  ];

  // Helper function to get subscription banner details
  const getSubscriptionBannerDetails = () => {
    if (!organization?.trialEndsAt) return null;

    const expiryDate = new Date(organization.trialEndsAt);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const formattedDate = format(expiryDate, "MMMM dd, yyyy");
    
    const isExpired = daysUntilExpiry < 0;
    const isExpiringSoon = daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
    
    let variant: "default" | "destructive" = "default";
    let icon = Calendar;
    let message = "";
    
    if (organization.subscriptionStatus === "trialing") {
      if (isExpired) {
        variant = "destructive";
        icon = AlertTriangle;
        message = `Your trial expired on ${formattedDate}. Please upgrade to continue using all features.`;
      } else if (isExpiringSoon) {
        variant = "destructive";
        icon = AlertTriangle;
        message = `Trial ends in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''} on ${formattedDate}. Upgrade now to avoid interruption.`;
      } else {
        icon = Calendar;
        message = `Trial expires on: ${formattedDate} (${daysUntilExpiry} days remaining)`;
      }
    } else if (organization.subscriptionStatus === "active") {
      if (isExpired) {
        variant = "destructive";
        icon = AlertTriangle;
        message = `Your subscription expired on ${formattedDate}. Please renew to continue.`;
      } else if (isExpiringSoon) {
        icon = AlertTriangle;
        message = `Subscription renews on ${formattedDate} (${daysUntilExpiry} days remaining)`;
      } else {
        icon = Calendar;
        message = `Subscription renews on: ${formattedDate}`;
      }
    } else if (organization.subscriptionStatus === "expired") {
      variant = "destructive";
      icon = AlertTriangle;
      message = `Your subscription expired on ${formattedDate}. Please renew to continue.`;
    } else if (organization.subscriptionStatus === "canceled") {
      variant = "destructive";
      icon = AlertTriangle;
      message = `Your subscription was canceled. Access ends on ${formattedDate}.`;
    } else if (organization.subscriptionStatus === "past_due") {
      variant = "destructive";
      icon = AlertTriangle;
      message = `Payment past due. Subscription expires on ${formattedDate}. Please update your payment method.`;
    }
    
    return { variant, icon, message };
  };

  const subscriptionBanner = getSubscriptionBannerDetails();

  return (
    <div className="p-6 space-y-6" data-testid="page-dashboard">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome to your business overview
          </p>
        </div>
        <Button variant="outline" size="sm" data-testid="button-refresh-dashboard">
          <RefreshCcw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Subscription Expiry Banner */}
      {subscriptionBanner && (
        <Alert 
          variant={subscriptionBanner.variant}
          className="border-l-4"
          data-testid="subscription-banner"
        >
          <subscriptionBanner.icon className="h-5 w-5" />
          <AlertDescription className="ml-2 flex items-center justify-between">
            <span className="font-medium">{subscriptionBanner.message}</span>
            {(organization?.subscriptionStatus === "trialing" || 
              organization?.subscriptionStatus === "expired" ||
              organization?.subscriptionStatus === "past_due") && (
              <Button 
                size="sm" 
                variant={subscriptionBanner.variant === "destructive" ? "secondary" : "default"}
                onClick={() => setLocation("/settings/billing")}
                className="ml-4"
              >
                Upgrade Now
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Vital Stats */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
          Vital Stats
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {vitalStats.map((stat, index) => (
            <Card key={index} className={`border-l-4 ${stat.color}`} data-testid={`stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className="w-5 h-5 text-muted-foreground" />
                  {stat.count !== undefined && (
                    <span className="text-2xl font-bold">{stat.count}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-1">{stat.title}</p>
                <p className="text-lg font-semibold">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="default"
              className={`${action.color} text-white h-auto py-4 flex flex-col items-center gap-2`}
              onClick={action.onClick}
              data-testid={`button-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <action.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{action.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Business Insights & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Business Insights Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold uppercase tracking-wide">
                Business Insights
              </CardTitle>
              <Select value={chartPeriod} onValueChange={setChartPeriod}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              Paid, Overdue, Due Invoices Distribution
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                  formatter={(value: any) => [`₹${value.toLocaleString('en-IN')}`, 'Amount']}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#colorAmount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold uppercase tracking-wide">
              Recent Activity
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="customer">Customer Due</SelectItem>
                  <SelectItem value="supplier">Supplier Due</SelectItem>
                  <SelectItem value="received">Amount Received</SelectItem>
                  <SelectItem value="paid">Amount Paid</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="30">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivities.map((activity, index) => (
              <div
                key={index}
                className="flex items-start justify-between p-3 rounded-md hover-elevate"
                data-testid={`activity-${index}`}
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.type}</p>
                  <p className="text-xs text-muted-foreground">{activity.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                </div>
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.status === 'overdue' ? 'bg-red-500' :
                  activity.status === 'pending' ? 'bg-yellow-500' :
                  'bg-green-500'
                }`} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Invoice Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold uppercase tracking-wide">
            Invoice Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={invoiceDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="status" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-border">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Bizverse</h2>
          <p className="text-sm text-muted-foreground mb-4">Comprehensive Billing & Accounting Solution</p>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Flying Venture System. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
