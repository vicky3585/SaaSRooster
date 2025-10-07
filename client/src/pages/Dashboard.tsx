import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  RefreshCcw
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

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [chartPeriod, setChartPeriod] = useState("30");

  // Fetch dashboard stats
  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
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
      label: "Add Purchase",
      icon: ShoppingCart,
      color: "bg-blue-500 hover:bg-blue-600",
      onClick: () => setLocation("/inventory"),
    },
    {
      label: "Add Expense",
      icon: TrendingUp,
      color: "bg-blue-500 hover:bg-blue-600",
      onClick: () => setLocation("/expenses"),
    },
    {
      label: "New Quotation",
      icon: FileCheck,
      color: "bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600",
      onClick: () => setLocation("/invoices"),
    },
    {
      label: "Add Customer",
      icon: UserPlus,
      color: "bg-blue-500 hover:bg-blue-600",
      onClick: () => setLocation("/customers"),
    },
    {
      label: "Add Reminder",
      icon: Bell,
      color: "bg-blue-500 hover:bg-blue-600",
      onClick: () => {},
    },
    {
      label: "Payment In",
      icon: ArrowDownCircle,
      color: "bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600",
      onClick: () => setLocation("/invoices"),
    },
    {
      label: "Payment Out",
      icon: ArrowUpCircle,
      color: "bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600",
      onClick: () => setLocation("/expenses"),
    },
  ];

  // Sample chart data - in real app this would come from API
  const revenueData = [
    { date: "18 Sep", amount: 3000 },
    { date: "19 Sep", amount: 6000 },
    { date: "20 Sep", amount: 9000 },
    { date: "21 Sep", amount: 12000 },
    { date: "22 Sep", amount: 15000 },
    { date: "23 Sep", amount: 18000 },
    { date: "24 Sep", amount: 21000 },
    { date: "25 Sep", amount: 19000 },
    { date: "26 Sep", amount: 17000 },
    { date: "27 Sep", amount: 15000 },
    { date: "28 Sep", amount: 12000 },
    { date: "29 Sep", amount: 9000 },
  ];

  const invoiceDistribution = [
    { status: "Paid", value: 450, fill: "hsl(var(--chart-1))" },
    { status: "Overdue", value: 200, fill: "hsl(var(--chart-2))" },
    { status: "Due", value: 150, fill: "hsl(var(--chart-3))" },
  ];

  const recentActivities = [
    {
      type: "Customer Due",
      description: "₹21,000",
      time: "All",
      status: "overdue",
    },
    {
      type: "Supplier Due",
      description: "Amount Due",
      time: "Last 30 days",
      status: "pending",
    },
    {
      type: "Amount Received",
      description: "₹18,000",
      time: "Last 30 days",
      status: "success",
    },
    {
      type: "Amount Paid",
      description: "Payment processed",
      time: "Last 30 days",
      status: "success",
    },
  ];

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
          <h2 className="text-2xl font-bold mb-2">Ledgix</h2>
          <p className="text-sm text-muted-foreground mb-4">Ledger + Logic - Comprehensive Billing & Accounting Solution</p>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Flying Venture System. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
