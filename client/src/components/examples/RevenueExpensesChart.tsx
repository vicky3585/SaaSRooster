import RevenueExpensesChart from '../RevenueExpensesChart';

export default function RevenueExpensesChartExample() {
  const mockData = [
    { month: 'Jan', revenue: 125000, expenses: 82000 },
    { month: 'Feb', revenue: 138000, expenses: 89000 },
    { month: 'Mar', revenue: 145000, expenses: 95000 },
    { month: 'Apr', revenue: 162000, expenses: 98000 },
    { month: 'May', revenue: 158000, expenses: 102000 },
    { month: 'Jun', revenue: 175000, expenses: 108000 },
  ];

  return <RevenueExpensesChart data={mockData} />;
}
