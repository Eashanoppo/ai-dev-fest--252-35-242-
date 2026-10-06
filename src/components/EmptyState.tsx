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
    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-border rounded-lg bg-surface-subtle/30 my-2 select-none">
      {icon && (
        <div className="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center text-muted mb-3 shadow-2xs">
          {icon}
        </div>
      )}
      <h3 className="text-xs font-semibold tracking-tight text-primary mb-1 uppercase font-mono">
        {title}
      </h3>
      <p className="text-xs text-muted max-w-sm mb-4 leading-relaxed font-sans">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
};
