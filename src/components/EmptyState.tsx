import React from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-border rounded bg-surface/50 my-2">
      {icon && <div className="text-muted mb-3">{icon}</div>}
      <h3 className="text-sm font-semibold tracking-tight text-primary mb-1">
        {title}
      </h3>
      <p className="text-xs text-muted max-w-sm mb-4 leading-relaxed">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
};
