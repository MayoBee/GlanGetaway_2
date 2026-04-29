import React from 'react';

export interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
  return <div className="relative">{children}</div>;
};

export const DialogTrigger = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  return <button {...props}>{children}</button>;
};

export const DialogContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 ${className}`}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {children}
      </div>
    </div>
  );
};

export const DialogHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  return <div className={`mb-4 ${className}`}>{children}</div>;
};

export const DialogTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  return <h2 className={`text-lg font-semibold ${className}`}>{children}</h2>;
};

export const DialogDescription = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  return <p className={`text-sm text-gray-600 ${className}`}>{children}</p>;
};

export const DialogFooter = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  return <div className={`mt-6 flex justify-end gap-2 ${className}`}>{children}</div>;
};
