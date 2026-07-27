import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: ReactNode;
}

export default function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}
