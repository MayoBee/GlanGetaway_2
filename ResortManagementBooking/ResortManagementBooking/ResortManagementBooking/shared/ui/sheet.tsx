import React from 'react';

export interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export const Sheet = ({ open, onOpenChange, children }: SheetProps) => {
  return <div className="relative">{children}</div>;
};

export const SheetTrigger = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  return <button {...props}>{children}</button>;
};

export const SheetContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  return (
    <div className={`fixed inset-y-0 right-0 w-full sm:w-[400px] bg-white shadow-xl p-6 ${className}`}>
      {children}
    </div>
  );
};

export const SheetHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  return <div className={`mb-4 ${className}`}>{children}</div>;
};

export const SheetTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  return <h2 className={`text-lg font-semibold ${className}`}>{children}</h2>;
};

export const SheetDescription = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  return <div className={`text-sm text-gray-600 ${className}`}>{children}</div>;
};
