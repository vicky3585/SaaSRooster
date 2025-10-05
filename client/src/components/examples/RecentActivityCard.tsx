import RecentActivityCard from '../RecentActivityCard';

export default function RecentActivityCardExample() {
  const mockActivities = [
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

  return <RecentActivityCard activities={mockActivities} />;
}
