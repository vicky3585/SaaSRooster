import StatusBadge from '../StatusBadge';

export default function StatusBadgeExample() {
  return (
    <div className="flex flex-wrap gap-2">
      <StatusBadge status="paid" />
      <StatusBadge status="overdue" />
      <StatusBadge status="draft" />
      <StatusBadge status="pending" />
      <StatusBadge status="partial" />
      <StatusBadge status="void" />
      <StatusBadge status="sent" />
    </div>
  );
}
