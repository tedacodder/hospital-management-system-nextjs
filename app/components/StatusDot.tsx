import React from 'react';

interface StatusDotProps {
  status: string;
}

export default function StatusDot({ status }: StatusDotProps) {
  const getColor = () => {
    switch (status) {
      case 'confirmed': return '#198754';
      case 'pending': return '#ffc107';
      case 'urgent': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <div
      className="rounded-circle me-3"
      style={{ width: '8px', height: '8px', background: getColor() }}
    />
  );
}
