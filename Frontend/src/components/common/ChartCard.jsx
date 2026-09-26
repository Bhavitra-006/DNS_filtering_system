import React from 'react';
import Card from './Card';

export default function ChartCard({
  title,
  subtitle,
  icon: Icon,
  actions,
  children,
  height = 280,
  className = '',
  footer,
}) {
  return (
    <Card
      title={title}
      subtitle={subtitle}
      icon={Icon}
      action={actions}
      className={className}
      footer={footer}
      bodyClassName="p-4"
    >
      <div style={{ width: '100%', height }}>
        {children}
      </div>
    </Card>
  );
}
