import React from 'react';

export interface DropdownMenuProps {
  children: React.ReactNode;
}

export const DropdownMenu = ({ children }: DropdownMenuProps) => {
  return <div className="relative inline-block text-left">{children}</div>;
};

export const DropdownMenuTrigger = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className="inline-flex"
      {...props}
    >
      {children}
    </div>
  );
};

export const DropdownMenuContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  return (
    <div className={`absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none ${className}`}>
      <div className="py-1">{children}</div>
    </div>
  );
};

export const DropdownMenuItem = ({ children, onClick, className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  return (
    <button
      onClick={onClick}
      className={`block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const DropdownMenuSeparator = () => {
  return <div className="border-t border-gray-100 my-1" />;
};
