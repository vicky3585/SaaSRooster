import KPICard from '../KPICard';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

export default function KPICardExample() {
  return (
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
  );
}
