import React from 'react';

interface StatusBadgeProps {
  status: string;
}

const statusStyles = {
  completed: 'bg-green-100 text-green-800',
  processing: 'bg-blue-100 text-blue-800',
  error: 'bg-red-100 text-red-800',
  pending: 'bg-gray-100 text-gray-800'
} as const;

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => (
  <span className={`text-sm px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status as keyof typeof statusStyles]}`}>
    {status.charAt(0).toUpperCase() + status.slice(1)}
  </span>
);