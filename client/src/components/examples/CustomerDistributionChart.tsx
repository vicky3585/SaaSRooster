import CustomerDistributionChart from '../CustomerDistributionChart';

export default function CustomerDistributionChartExample() {
  const mockData = [
    { name: 'Retail', value: 45 },
    { name: 'Wholesale', value: 30 },
    { name: 'Enterprise', value: 15 },
    { name: 'Government', value: 7 },
    { name: 'Others', value: 3 },
  ];

  return <CustomerDistributionChart data={mockData} />;
}
