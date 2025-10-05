import KPICard from "@/components/KPICard";
import RevenueExpensesChart from "@/components/RevenueExpensesChart";
import ProfitTrendChart from "@/components/ProfitTrendChart";
import CustomerDistributionChart from "@/components/CustomerDistributionChart";
import QuickActionsCard from "@/components/QuickActionsCard";
import RecentActivityCard from "@/components/RecentActivityCard";
import { DollarSign, TrendingDown, TrendingUp, AlertCircle } from "lucide-react";

export default function Dashboard() {
  const revenueExpensesData = [
    { month: 'Jan', revenue: 125000, expenses: 82000 },
    { month: 'Feb', revenue: 138000, expenses: 89000 },
    { month: 'Mar', revenue: 145000, expenses: 95000 },
    { month: 'Apr', revenue: 162000, expenses: 98000 },
    { month: 'May', revenue: 158000, expenses: 102000 },
    { month: 'Jun', revenue: 175000, expenses: 108000 },
  ];

  const profitData = [
    { month: 'Jan', profit: 43000 },
    { month: 'Feb', profit: 49000 },
    { month: 'Mar', profit: 50000 },
    { month: 'Apr', profit: 64000 },
    { month: 'May', profit: 56000 },
    { month: 'Jun', profit: 67000 },
  ];

  const customerData = [
    { name: 'Retail', value: 45 },
    { name: 'Wholesale', value: 30 },
    { name: 'Enterprise', value: 15 },
    { name: 'Government', value: 7 },
    { name: 'Others', value: 3 },
  ];

  const recentActivities = [
    {
      id: '1',
      type: 'Invoice Created',
      description: 'Invoice #INV/24-25/000123 for Acme Corp',
      time: '2 hours ago',
      status: 'draft' as const,
    },
    {
      id: '2',
      type: 'Payment Received',
      description: 'Payment of ₹50,000 from Tech Solutions Ltd',
      time: '5 hours ago',
      status: 'paid' as const,
    },
    {
      id: '3',
      type: 'Invoice Sent',
      description: 'Invoice #INV/24-25/000122 sent to Global Enterprises',
      time: '1 day ago',
      status: 'sent' as const,
    },
    {
      id: '4',
      type: 'Expense Recorded',
      description: 'Office supplies - ₹5,200',
      time: '2 days ago',
    },
    {
      id: '5',
      type: 'Customer Added',
      description: 'New customer: Innovate Systems Pvt Ltd',
      time: '3 days ago',
    },
  ];

  return (
    <div className="p-6 space-y-6" data-testid="page-dashboard">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here's your business overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Revenue"
          value="₹12.5L"
          icon={DollarSign}
          trend={{ value: "12.5%", isPositive: true }}
          iconColor="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
        />
        <KPICard
          title="Total Expenses"
          value="₹8.2L"
          icon={TrendingDown}
          trend={{ value: "3.2%", isPositive: false }}
          iconColor="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
        />
        <KPICard
          title="Net Profit"
          value="₹4.3L"
          icon={TrendingUp}
          trend={{ value: "18.7%", isPositive: true }}
          iconColor="bg-primary/10 text-primary"
        />
        <KPICard
          title="Outstanding"
          value="₹2.1L"
          icon={AlertCircle}
          iconColor="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueExpensesChart data={revenueExpensesData} />
        <ProfitTrendChart data={profitData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CustomerDistributionChart data={customerData} />
        <QuickActionsCard />
        <RecentActivityCard activities={recentActivities} />
      </div>
    </div>
  );
}
