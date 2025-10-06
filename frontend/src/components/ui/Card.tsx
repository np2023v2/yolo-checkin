import React from 'react';
import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export function Card({ children, className, title }: CardProps) {
  return (
    <div className={clsx('bg-white rounded-lg shadow-md p-6', className)}>
      {title && (
        <h3 className="text-xl font-semibold mb-4">{title}</h3>
      )}
      {children}
    </div>
  );
}
