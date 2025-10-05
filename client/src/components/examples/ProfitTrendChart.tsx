import ProfitTrendChart from '../ProfitTrendChart';

export default function ProfitTrendChartExample() {
  const mockData = [
    { month: 'Jan', profit: 43000 },
    { month: 'Feb', profit: 49000 },
    { month: 'Mar', profit: 50000 },
    { month: 'Apr', profit: 64000 },
    { month: 'May', profit: 56000 },
    { month: 'Jun', profit: 67000 },
  ];

  return <ProfitTrendChart data={mockData} />;
}
